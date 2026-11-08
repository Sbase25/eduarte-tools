<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Icon from "../components/Icon.vue";
import {
  TEAM_SIZE, RARITIES, clearCollectionData, effectiveRating, groupFor, loadCollection, loadTeam,
  penaltyOutcome, saveTeam, sortCollection, teamChemistry, teamRating,
} from "../collection.js";
import { SEASONS, seasonFor } from "../seasons.js";
import { playSound, setSoundEnabled } from "../sound.js";

const tab = ref("collection");
const collection = ref([]);
const teamIds = ref(Array(TEAM_SIZE).fill(null));
const sortMode = ref("rating");
const sound = ref(true);
const seasonOn = ref(true);
const picking = ref(null);
const loaded = ref(false);

const season = computed(() => SEASONS[seasonOn.value ? seasonFor() : "autumn"]);
const seasonStyle = computed(() => (seasonOn.value ? { "--team-hue": season.value.hue } : { "--team-hue": 262 }));
const sorted = computed(() => sortCollection(collection.value, sortMode.value));
const team = computed(() => teamIds.value.map((id) => collection.value.find((card) => card.id === id) || null));
const chemistry = computed(() => teamChemistry(team.value));
const rating = computed(() => teamRating(team.value));
const rarityName = (id) => RARITIES.find((item) => item.id === id)?.name || "";
const grade = (value) => Number(value).toLocaleString("nl-NL", { maximumFractionDigits: 2 });
const groupName = (card) => groupFor(card.subject).name;

async function load() {
  collection.value = await loadCollection();
  const ids = await loadTeam();
  teamIds.value = ids.map((id) => (collection.value.some((card) => card.id === id) ? id : null));
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const settings = await chrome.storage.local.get(["eduarteTeamSound", "eduarteTeamSeasons"]);
    sound.value = settings.eduarteTeamSound !== false;
    seasonOn.value = settings.eduarteTeamSeasons !== false;
  }
  setSoundEnabled(sound.value);
  loaded.value = true;
}

function setting(key, value) {
  if (typeof chrome !== "undefined" && chrome.storage?.local) chrome.storage.local.set({ [key]: value });
}

function toggleSound() {
  sound.value = !sound.value;
  setSoundEnabled(sound.value);
  setting("eduarteTeamSound", sound.value);
  playSound("click");
}

function toggleSeasons() {
  seasonOn.value = !seasonOn.value;
  setting("eduarteTeamSeasons", seasonOn.value);
}

function placeCard(card) {
  if (picking.value === null) return;
  const next = [...teamIds.value].map((id) => (id === card.id ? null : id));
  next[picking.value] = card.id;
  teamIds.value = next;
  saveTeam(next);
  picking.value = null;
  playSound("click");
}

function clearSlot(index) {
  const next = [...teamIds.value];
  next[index] = null;
  teamIds.value = next;
  saveTeam(next);
}

async function eraseAll() {
  if (!window.confirm("Alle verzamelde kaarten en je team van dit apparaat verwijderen?")) return;
  await clearCollectionData();
  collection.value = [];
  teamIds.value = Array(TEAM_SIZE).fill(null);
}

// --- Penalty-minigame ---
const ROUNDS = 5;
const penalty = ref({ state: "idle", round: 0, goals: 0, shooter: null, power: 0, aim: null, dive: null, result: "", log: [] });
let powerFrame = 0;
let powerStart = 0;
const players = computed(() => team.value.filter(Boolean));

function startPenalty() {
  if (!players.value.length) return;
  penalty.value = { state: "aiming", round: 0, goals: 0, shooter: null, power: 0, aim: null, dive: null, result: "", log: [] };
  nextRound();
}

function nextRound() {
  const p = penalty.value;
  p.shooter = players.value[p.round % players.value.length];
  p.state = "aiming";
  p.result = "";
  p.aim = null;
  p.dive = null;
  powerStart = performance.now();
  cancelAnimationFrame(powerFrame);
  const tick = (now) => {
    const phase = ((now - powerStart) / 900) % 2;
    penalty.value.power = phase < 1 ? phase : 2 - phase;
    if (penalty.value.state === "aiming") powerFrame = requestAnimationFrame(tick);
  };
  powerFrame = requestAnimationFrame(tick);
}

function shoot(aim) {
  const p = penalty.value;
  if (p.state !== "aiming") return;
  cancelAnimationFrame(powerFrame);
  const dive = Math.floor(Math.random() * 3);
  const result = penaltyOutcome({
    rating: effectiveRating(p.shooter, chemistry.value),
    aim, power: p.power, dive,
  });
  p.aim = aim;
  p.dive = dive;
  p.result = result;
  p.state = "result";
  if (result === "goal") p.goals += 1;
  p.log.push(result);
  playSound(result === "goal" ? "goal" : result === "saved" ? "save" : "miss");
}

function continuePenalty() {
  const p = penalty.value;
  p.round += 1;
  if (p.round >= ROUNDS) {
    p.state = "done";
    playSound(p.goals >= 3 ? "reveal" : "click");
  } else {
    nextRound();
  }
}

const resultText = { goal: "GOAL!", saved: "Gekeerd!", miss: "Naast!" };

onMounted(() => { load(); });
onBeforeUnmount(() => cancelAnimationFrame(powerFrame));

function openPacks() {
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: "OPEN_EDUARTE_TOOLS_PAGE", page: "packs" });
  } else {
    window.open(new URL("/packs.html", window.location.href).href, "_blank", "noopener");
  }
}
</script>

<template>
  <main class="team-page" :style="seasonStyle">
    <header class="topbar">
      <div class="brand"><span class="brand-icon"><Icon>school</Icon></span><span>Eduarte <b>Team</b></span></div>
      <div class="top-actions">
        <button type="button" class="chip-btn" :aria-pressed="seasonOn" @click="toggleSeasons">{{ seasonOn ? season.emoji + " " + season.name : "🎨 Standaard" }}</button>
        <button type="button" class="chip-btn" :aria-pressed="sound" @click="toggleSound">{{ sound ? "🔊 Geluid aan" : "🔇 Geluid uit" }}</button>
      </div>
    </header>

    <div class="content">
      <nav class="tabs" role="tablist">
        <button v-for="item in [['collection','Verzameling'],['team','Team'],['penalty','Penalty']]" :key="item[0]" role="tab" type="button"
          :class="{ active: tab === item[0] }" :aria-selected="tab === item[0]" @click="tab = item[0]; playSound('click')">{{ item[1] }}</button>
      </nav>

      <p v-if="loaded && !collection.length" class="empty">
        Nog geen kaarten. Open een pack vanaf je Eduarte-resultatenpagina om vakkaarten te verzamelen.
        <md-filled-button type="button" @click="openPacks">Packs openen</md-filled-button>
      </p>

      <section v-else-if="tab === 'collection'">
        <div class="bar">
          <h1>{{ collection.length }} kaarten</h1>
          <label>Sorteer
            <select v-model="sortMode"><option value="rating">Rating</option><option value="subject">Vak</option><option value="recent">Nieuwste</option></select>
          </label>
        </div>
        <div class="grid">
          <article v-for="card in sorted" :key="card.id" class="card" :class="card.rarity">
            <strong class="rating">{{ card.rating }}</strong>
            <span class="rarity">{{ rarityName(card.rarity) }}</span>
            <h2>{{ card.subject }}</h2>
            <p>{{ groupName(card) }}</p>
            <small>Cijfer {{ grade(card.result) }}</small>
          </article>
        </div>
        <p class="hint">Kaarten staan alleen lokaal op dit apparaat. <button type="button" class="link" @click="eraseAll">Alles verwijderen</button></p>
      </section>

      <section v-else-if="tab === 'team'">
        <div class="bar">
          <h1>Teamrating {{ rating }}</h1>
          <span class="chem">Chemie {{ chemistry.percent }}%</span>
        </div>
        <p class="hint">Kaarten uit dezelfde vakgroep (bijv. Engels + Duits) geven chemie en tellen mee als bonus.</p>
        <div class="slots">
          <div v-for="(slot, index) in team" :key="index" class="slot" :class="[slot && slot.rarity, { picking: picking === index }]">
            <template v-if="slot">
              <strong class="rating">{{ effectiveRating(slot, chemistry) }}</strong>
              <h2>{{ slot.subject }}</h2>
              <small>Chemie +{{ chemistry.perCard.get(slot.id) || 0 }}</small>
              <button type="button" class="link" @click="clearSlot(index)">Weghalen</button>
            </template>
            <button v-else type="button" class="add" @click="picking = index">+ Kies kaart</button>
          </div>
        </div>
        <div v-if="picking !== null" class="picker">
          <h2>Kies een kaart voor plek {{ picking + 1 }}</h2>
          <div class="grid small">
            <button v-for="card in sorted" :key="card.id" type="button" class="card" :class="card.rarity" @click="placeCard(card)">
              <strong class="rating">{{ card.rating }}</strong><h2>{{ card.subject }}</h2>
            </button>
          </div>
          <button type="button" class="link" @click="picking = null">Annuleren</button>
        </div>
      </section>

      <section v-else class="penalty">
        <div class="bar"><h1>Penalty's</h1><span class="chem">Ronde {{ Math.min(penalty.round + 1, 5) }} van 5 · {{ penalty.goals }} goals</span></div>
        <p v-if="!players.length" class="hint">Zet eerst kaarten in je team om penalty's te nemen.</p>
        <template v-else-if="penalty.state === 'idle'">
          <p class="hint">Elke ronde neemt een teamlid een penalty. Klik op een hoek van het doel: de kracht-balk beweegt, dus timing telt. Hoge rating en chemie vergroten je kans.</p>
          <md-filled-button type="button" @click="startPenalty">Start penalty's</md-filled-button>
        </template>
        <template v-else-if="penalty.state !== 'done'">
          <p class="shooter">{{ penalty.shooter.subject }} · rating {{ effectiveRating(penalty.shooter, chemistry) }}</p>
          <div class="goal">
            <button v-for="zone in [0, 1, 2]" :key="zone" type="button" class="zone" :disabled="penalty.state !== 'aiming'" :aria-label="['Links', 'Midden', 'Rechts'][zone]" @click="shoot(zone)">
              <span v-if="penalty.state === 'result' && penalty.dive === zone" class="keeper">🧤</span>
              <span v-if="penalty.state === 'result' && penalty.aim === zone" class="ball">⚽</span>
            </button>
          </div>
          <div class="power" aria-label="Kracht"><i :style="{ width: penalty.power * 100 + '%' }"></i></div>
          <p v-if="penalty.state === 'result'" class="result" 
:class="'is-' + penalty.result">{{ resultText[penalty.result] }}</p>
          <md-filled-button v-if="penalty.state === 'result'" type="button" @click="continuePenalty">{{ penalty.round + 1 >= 5 ? "Eindstand" : "Volgende" }}</md-filled-button>
        </template>
        <template v-else>
          <p class="result is-goal">{{ penalty.goals }} / 5 goals</p>
          <p class="hint">{{ penalty.log.map((x) => (x === 'goal' ? '⚽' : x === 'saved' ? '🧤' : '❌')).join(' ') }}</p>
          <md-filled-button type="button" @click="startPenalty">Opnieuw</md-filled-button>
        </template>
      </section>
    </div>
  </main>
</template>

<style scoped>
.team-page { --h: var(--team-hue, 262); min-height: 100vh; color: #f3f3f5; font-family: system-ui, sans-serif;
  background: radial-gradient(900px 500px at 85% -10%, hsl(var(--h) 70% 30% / .55), transparent 60%), #111318; --accent: hsl(var(--h) 85% 78%); --md-sys-color-primary: var(--accent); --md-sys-color-on-primary: #1b1030; }
.topbar { height: 68px; display: flex; align-items: center; justify-content: space-between; padding-inline: clamp(20px, 5vw, 72px); border-bottom: 1px solid #ffffff18; }
.brand { display: flex; align-items: center; gap: 9px; font-weight: 650; }
.brand b { color: #aaa5b7; font-weight: 500; }
.brand-icon { display: grid; width: 31px; height: 31px; place-items: center; border: 1px solid #ffffff20; border-radius: 9px; color: var(--accent); }
.top-actions { display: flex; gap: 8px; }
.chip-btn { border: 1px solid #ffffff25; background: #ffffff0d; color: inherit; padding: 8px 14px; border-radius: 999px; cursor: pointer; font: 600 13px system-ui; }
.content { width: min(1050px, calc(100% - 40px)); margin: 0 auto; padding: 30px 0 48px; }
.tabs { display: flex; gap: 8px; margin-bottom: 24px; }
.tabs button { border: 1px solid #ffffff20; background: transparent; color: #cfc9da; padding: 10px 20px; border-radius: 999px; cursor: pointer; font: 600 14px system-ui; }
.tabs button.active { background: var(--accent); color: #1b1030; border-color: transparent; }
.bar { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
h1 { margin: 0; font-size: 30px; letter-spacing: -.02em; }
h2 { margin: 6px 0 0; font-size: 16px; }
.chem { color: var(--accent); font-weight: 700; }
select { background: #1d1b22; color: inherit; border: 1px solid #ffffff25; border-radius: 8px; padding: 6px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
.grid.small { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
.card, .slot { position: relative; padding: 16px 14px 14px; border-radius: 18px 18px 6px 18px; border: 1px solid #ffffff30; color: inherit; text-align: left; font: inherit; background: linear-gradient(160deg, #3a3342, #1f1c26); }
button.card { cursor: pointer; }
.card p, .card small, .slot small { display: block; margin: 4px 0 0; color: #cfc9da; font-size: 12px; }
.rating { font-size: 34px; line-height: 1; letter-spacing: -.03em; }
.rarity { position: absolute; top: 14px; right: 12px; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; opacity: .8; }
.bronze { background: linear-gradient(160deg, #7a5230, #2c2018); }
.silver { background: linear-gradient(160deg, #8d93a0, #2a2d34); }
.gold { background: linear-gradient(160deg, #c9a13b, #3a2d10); }
.special { background: linear-gradient(160deg, hsl(var(--h) 70% 55%), #12102a 85%); box-shadow: 0 0 24px hsl(var(--h) 80% 55% / .35); }
.slots { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
.slot { min-height: 150px; display: flex; flex-direction: column; justify-content: center; }
.slot.picking { outline: 2px solid var(--accent); }
.add { background: none; border: 2px dashed #ffffff35; color: #cfc9da; border-radius: 14px; padding: 28px 8px; cursor: pointer; font: 600 14px system-ui; }
.link { background: none; border: 0; color: var(--accent); cursor: pointer; padding: 0; margin-top: 8px; text-decoration: underline; font: inherit; align-self: flex-start; }
.picker { margin-top: 24px; padding: 18px; border: 1px solid #ffffff20; border-radius: 22px; background: #ffffff08; }
.hint, .empty { color: #b9b3c5; font-size: 14px; line-height: 1.5; }
.empty { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; padding: 30px 0; font-size: 16px; }
.shooter { color: #cfc9da; margin: 6px 0 14px; }
.goal { display: grid; grid-template-columns: repeat(3, 1fr); width: min(520px, 100%); height: 210px; border: 6px solid #fff; border-bottom: 0; border-radius: 8px 8px 0 0; background: repeating-linear-gradient(0deg, #ffffff10 0 2px, transparent 2px 24px), repeating-linear-gradient(90deg, #ffffff10 0 2px, transparent 2px 24px); }
.zone { position: relative; border: 0; background: transparent; cursor: pointer; font-size: 38px; }
.zone:disabled { opacity: 1; cursor: default; }
.zone:hover:not(:disabled) { background: hsl(var(--h) 80% 60% / .2); }
.keeper { position: absolute; left: 50%; top: 40%; transform: translateX(-50%); }
.ball { position: absolute; left: 50%; bottom: 10%; transform: translateX(-50%); }
.power { width: min(520px, 100%); height: 14px; margin: 14px 0; border-radius: 7px; background: #ffffff1a; overflow: hidden; }
.power i { display: block; height: 100%; background: linear-gradient(90deg, #6ee7b7, #facc15, #f87171); }
.result { font-size: 40px; font-weight: 800; margin: 10px 0; }
.result.is-goal { color: #6ee7b7; } .result.is-saved { color: #facc15; } .result.is-miss { color: #f87171; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
</style>
