<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const hasChrome = typeof chrome !== "undefined" && chrome.runtime?.sendMessage;
// Moet gelijk zijn aan SERVER in calendar-feed.js
const SERVER = "https://eduarte-agenda.sbaselmans1.workers.dev";

const feed = ref(null);
const lastSync = ref(0);
const lastError = ref("");
const busy = ref(false);
const message = ref("");
const copied = ref(false);
const app = ref("outlook");

const link = () => (feed.value ? `${SERVER}/cal/${feed.value.id}.ics` : "");

function readStatus() {
  if (!hasChrome) return;
  chrome.storage.local.get(["eduarteCalendarFeed", "eduarteCalendarLastSync", "eduarteCalendarLastError"], (data) => {
    feed.value = data.eduarteCalendarFeed || null;
    lastSync.value = data.eduarteCalendarLastSync || 0;
    lastError.value = data.eduarteCalendarLastError || "";
  });
}

function send(type) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type }, (res) => {
      resolve(chrome.runtime.lastError ? { success: false, error: chrome.runtime.lastError.message } : res);
    });
  });
}

async function createLink() {
  if (!hasChrome || busy.value) return;
  busy.value = true;
  message.value = "";
  const res = await send("CALENDAR_CREATE");
  busy.value = false;
  if (!res?.success) message.value = res?.error || "Agenda-link maken mislukt.";
  readStatus();
}

async function removeLink() {
  if (!hasChrome) return;
  await send("CALENDAR_DELETE");
  message.value = "Agenda-link verwijderd. Haal het abonnement ook weg in je agenda-app.";
  readStatus();
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(link());
    copied.value = true;
    setTimeout(() => (copied.value = false), 1800);
  } catch {
    message.value = "Kopiëren lukte niet; selecteer de link en kopieer hem handmatig.";
  }
}

function onChanged(changes, area) {
  if (area === "local" && Object.keys(changes).some((k) => k.startsWith("eduarteCalendar"))) readStatus();
}

onMounted(() => {
  readStatus();
  if (hasChrome) chrome.storage.onChanged.addListener(onChanged);
});

onBeforeUnmount(() => {
  if (hasChrome) chrome.storage.onChanged.removeListener(onChanged);
});

function formatTime(ms) {
  return ms ? new Date(ms).toLocaleString("nl-NL", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "nog niet";
}
</script>

<template>
  <div class="setting calendar">
    <h3 class="setting-title">Rooster in je agenda</h3>
    <span class="setting-subtitle">
      Krijg je lessen in Outlook, Google Agenda of de agenda van je telefoon. Je agenda-app haalt de wijzigingen
      zelf op; Eduarte Tools werkt de link bij elke keer dat je Eduarte opent.
    </span>

    <template v-if="!feed">
      <div class="actions">
        <md-filled-tonal-button type="button" :disabled="busy" @click="createLink">
          {{ busy ? "Bezig…" : "Maak mijn agenda-link" }}
        </md-filled-tonal-button>
      </div>
    </template>

    <template v-else>
      <code class="link" title="Je persoonlijke agenda-link">{{ link() }}</code>
      <div class="actions">
        <md-filled-tonal-button type="button" @click="copyLink">{{ copied ? "Gekopieerd!" : "Kopieer link" }}</md-filled-tonal-button>
        <md-text-button type="button" @click="removeLink">Verwijderen</md-text-button>
      </div>

      <div class="apps" role="tablist">
        <button type="button" :class="{ on: app === 'outlook' }" @click="app = 'outlook'">Outlook</button>
        <button type="button" :class="{ on: app === 'google' }" @click="app = 'google'">Google</button>
        <button type="button" :class="{ on: app === 'phone' }" @click="app = 'phone'">iPhone</button>
      </div>
      <ol v-if="app === 'outlook'" class="steps">
        <li>Open <a href="https://outlook.office.com/calendar/addcalendar" target="_blank" rel="noreferrer">Outlook-agenda → Agenda toevoegen</a>.</li>
        <li>Kies <b>Abonneren via internet</b> en plak de link.</li>
        <li>Naam: <i>Eduarte rooster</i> → <b>Importeren</b>.</li>
      </ol>
      <ol v-else-if="app === 'google'" class="steps">
        <li>Open <a href="https://calendar.google.com/calendar/r/settings/addbyurl" target="_blank" rel="noreferrer">Google Agenda → Via URL toevoegen</a>.</li>
        <li>Plak de link en klik <b>Agenda toevoegen</b>.</li>
      </ol>
      <ol v-else class="steps">
        <li>Instellingen → <b>Agenda</b> → <b>Accounts</b> → <b>Voeg account toe</b> → <b>Anders</b>.</li>
        <li>Kies <b>Voeg agenda-abonnement toe</b> en plak de link.</li>
      </ol>

      <span class="status">
        Laatst bijgewerkt: {{ formatTime(lastSync) }}
        <span v-if="lastError" class="error">· {{ lastError }}</span>
      </span>
      <span class="hint">Deel deze link niet: iedereen met de link kan je rooster zien.</span>
    </template>

    <span v-if="message" class="status" role="status">{{ message }}</span>
  </div>
</template>

<style scoped>
.calendar { display: grid; gap: 10px; }
.link { display: block; padding: 8px 10px; border-radius: 10px; background: var(--color-surface-container-high, rgba(255,255,255,.06)); font-size: 11px; word-break: break-all; user-select: all; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.apps { display: flex; gap: 4px; padding: 3px; border-radius: 12px; background: var(--color-surface-container-high, rgba(255,255,255,.06)); }
.apps button { flex: 1; padding: 6px 0; border: 0; border-radius: 9px; background: none; color: var(--color-on-surface-variant); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.apps button.on { background: var(--color-primary); color: var(--color-on-primary); }
.steps { margin: 0; padding-left: 18px; display: grid; gap: 4px; color: var(--color-on-surface-variant); font: var(--typescale-body-small); }
.steps a { color: var(--color-primary); }
.status { color: var(--color-on-surface-variant); font: var(--typescale-body-small); }
.error { color: var(--color-error, #f87171); }
.hint { color: var(--color-on-surface-variant); font: var(--typescale-body-small); opacity: .8; }
</style>
