// Pure functies voor de agenda-feed (los te testen, zonder Cloudflare)

export const MAX_EVENTS = 1500;
export const KEEP_PAST_DAYS = 60;

function isIso(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function clip(value, max) {
  return String(value ?? "").slice(0, max);
}

// Controleert en schoont een week die de extensie stuurt
export function cleanWeek(input) {
  if (!input || !isIso(input.from) || !isIso(input.to) || !Array.isArray(input.lessons)) return null;
  const from = new Date(input.from).toISOString();
  const to = new Date(input.to).toISOString();
  if (Date.parse(to) <= Date.parse(from) || Date.parse(to) - Date.parse(from) > 14 * 86400000) return null;
  const lessons = input.lessons
    .filter((l) => l && isIso(l.start) && isIso(l.end) && Date.parse(l.end) > Date.parse(l.start))
    .slice(0, 200)
    .map((l) => ({
      title: clip(l.title || "Les", 120),
      subject: clip(l.subject, 300),
      location: clip(l.location, 120),
      participants: clip(l.participants, 160),
      start: new Date(l.start).toISOString(),
      end: new Date(l.end).toISOString(),
    }));
  return { from, to, lessons };
}

// Vervangt alle lessen in [from, to) door de nieuwe week en ruimt oude lessen op
export function mergeWeek(events, week, now = Date.now()) {
  const from = Date.parse(week.from);
  const to = Date.parse(week.to);
  const cutoff = now - KEEP_PAST_DAYS * 86400000;
  const kept = events.filter((e) => {
    const start = Date.parse(e.start);
    return (start < from || start >= to) && Date.parse(e.end) >= cutoff;
  });
  return kept.concat(week.lessons)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .slice(-MAX_EVENTS);
}

function icsDate(iso) {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsText(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/[;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");
}

// Regels langer dan 75 tekens moeten worden afgebroken (RFC 5545)
function fold(line) {
  const parts = [];
  let rest = line;
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  parts.push(rest);
  return parts.join("\r\n");
}

function uid(event) {
  const key = `${event.start}|${event.end}|${event.title}`;
  const hash = Array.from(key).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return `${icsDate(event.start)}-${hash.toString(36)}@eduarte-tools`;
}

export function toIcs(events, updatedAt = new Date().toISOString()) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Eduarte Tools//Rooster//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Eduarte rooster",
    "X-WR-TIMEZONE:Europe/Amsterdam",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid(e)}`,
      `DTSTAMP:${icsDate(updatedAt)}`,
      `DTSTART:${icsDate(e.start)}`,
      `DTEND:${icsDate(e.end)}`,
      `SUMMARY:${icsText(e.title)}`,
      `LOCATION:${icsText(e.location)}`,
      `DESCRIPTION:${icsText([e.subject, e.participants && `Docent: ${e.participants}`].filter(Boolean).join("\n"))}`,
      "CATEGORIES:Eduarte rooster",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function randomId(bytes = 24) {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...raw)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
