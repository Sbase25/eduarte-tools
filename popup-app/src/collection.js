// Eduarte Team: lokale verzameling, rarity, teamchemie en penalty-uitkomst.
// Alles hier is zuivere logica (geen DOM) zodat het getest kan worden.

export const TEAM_SIZE = 5;

export const RARITIES = [
  { id: "bronze", name: "Brons", min: 0 },
  { id: "silver", name: "Zilver", min: 6 },
  { id: "gold", name: "Goud", min: 7.5 },
  { id: "special", name: "Special", min: 9 },
];

export function rarityFor(result) {
  let rarity = RARITIES[0];
  for (const candidate of RARITIES) if (result >= candidate.min) rarity = candidate;
  return rarity;
}

export function ratingFor(result) {
  return Math.max(1, Math.min(99, Math.round(result * 10)));
}

// "Wiskunde · Toets 1" -> "Wiskunde"
export function subjectName(title) {
  const text = String(title || "").trim();
  const first = text.split(/\s[·|\-–]\s/)[0].trim();
  return first || "Vak";
}

const GROUPS = [
  { id: "talen", name: "Talen", words: ["nederlands", "engels", "duits", "frans", "spaans", "taal", "lezen", "schrijven", "spreken", "luisteren"] },
  { id: "rekenen", name: "Rekenen & Bèta", words: ["reken", "wiskunde", "natuurkunde", "scheikunde", "biologie", "techniek", "elektro", "statistiek"] },
  { id: "ict", name: "ICT & Techniek", words: ["ict", "informatica", "netwerk", "server", "linux", "windows", "programmeren", "systeem", "security", "cloud", "database"] },
  { id: "maatschappij", name: "Mens & Maatschappij", words: ["loopbaan", "burgerschap", "economie", "maatschappij", "geschiedenis", "aardrijkskunde", "stage", "bpv", "studie"] },
];

export function groupFor(subject) {
  const lower = String(subject || "").toLowerCase();
  const group = GROUPS.find(({ words }) => words.some((word) => lower.includes(word)));
  return group ? { id: group.id, name: group.name } : { id: "overig", name: "Overig" };
}

export function makeCard(grade, now = Date.now()) {
  const subject = subjectName(grade.subject || grade.title);
  const rarity = rarityFor(grade.result);
  return {
    id: String(grade.id),
    subject,
    title: String(grade.subject || grade.title || subject),
    result: grade.result,
    weight: grade.weight ?? null,
    rating: ratingFor(grade.result),
    rarity: rarity.id,
    group: groupFor(subject).id,
    obtainedAt: now,
  };
}

// Voegt nieuwe kaarten toe; bestaande kaart (zelfde id) blijft behouden.
export function mergeCollection(existing, drawn, now = Date.now()) {
  const byId = new Map((Array.isArray(existing) ? existing : []).map((card) => [card.id, card]));
  const added = [];
  for (const grade of drawn) {
    if (!Number.isFinite(grade.result) || grade.result < 0 || grade.result > 10) continue;
    const id = String(grade.id);
    if (byId.has(id)) continue;
    const card = makeCard(grade, now);
    byId.set(id, card);
    added.push(card);
  }
  return { collection: [...byId.values()], added };
}

// Chemie per speler = aantal andere teamgenoten in dezelfde vakgroep (max 3 punten).
export function teamChemistry(team) {
  const cards = team.filter(Boolean);
  const perCard = new Map();
  for (const card of cards) {
    const links = cards.filter((other) => other.id !== card.id && other.group === card.group && card.group !== "overig").length;
    perCard.set(card.id, Math.min(3, links));
  }
  const total = [...perCard.values()].reduce((sum, value) => sum + value, 0);
  const max = TEAM_SIZE * 3;
  return { perCard, percent: Math.round((total / max) * 100) };
}

export function effectiveRating(card, chemistry) {
  return Math.min(99, card.rating + (chemistry.perCard.get(card.id) || 0));
}

export function teamRating(team) {
  const cards = team.filter(Boolean);
  if (!cards.length) return 0;
  const chemistry = teamChemistry(cards);
  const sum = cards.reduce((total, card) => total + effectiveRating(card, chemistry), 0);
  return Math.round(sum / cards.length);
}

// aim, dive: 0 = links, 1 = midden, 2 = rechts. power: 0..1.
// random: functie die een getal in [0, 1) geeft.
export function penaltyOutcome({ rating, aim, power, dive }, random = Math.random) {
  const skill = Math.max(0, Math.min(1, rating / 100));
  // Te zacht is makkelijk te keren, te hard kan over of naast.
  const missChance = Math.max(0.03, 0.34 - skill * 0.3) + Math.max(0, power - 0.88) * 2.2;
  if (random() < missChance) return "miss";
  const saveBase = aim === dive ? 0.62 - skill * 0.3 : 0.04;
  const saveChance = Math.max(0.05, saveBase - (power - 0.5) * 0.4);
  return random() < saveChance ? "saved" : "goal";
}

export function sortCollection(collection, mode = "rating") {
  const cards = [...collection];
  if (mode === "recent") return cards.sort((a, b) => b.obtainedAt - a.obtainedAt);
  if (mode === "subject") return cards.sort((a, b) => a.subject.localeCompare(b.subject, "nl") || b.rating - a.rating);
  return cards.sort((a, b) => b.rating - a.rating || a.subject.localeCompare(b.subject, "nl"));
}

// --- Opslag (chrome.storage.local, met localStorage als terugval tijdens ontwikkeling) ---
const COLLECTION_KEY = "eduarteCollection";
const TEAM_KEY = "eduarteTeam";

async function readKey(key) {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const stored = await chrome.storage.local.get(key);
    return stored[key];
  }
  try { return JSON.parse(localStorage.getItem(key)); } catch { return undefined; }
}

async function writeKey(key, value) {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export async function loadCollection() {
  const value = await readKey(COLLECTION_KEY);
  return Array.isArray(value) ? value : [];
}

export async function saveCollection(collection) {
  await writeKey(COLLECTION_KEY, collection);
}

export async function loadTeam() {
  const value = await readKey(TEAM_KEY);
  const ids = Array.isArray(value) ? value.slice(0, TEAM_SIZE) : [];
  while (ids.length < TEAM_SIZE) ids.push(null);
  return ids;
}

export async function saveTeam(ids) {
  await writeKey(TEAM_KEY, ids);
}

export async function clearCollectionData() {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.remove([COLLECTION_KEY, TEAM_KEY]);
    return;
  }
  try { localStorage.removeItem(COLLECTION_KEY); localStorage.removeItem(TEAM_KEY); } catch { /* ignore */ }
}
