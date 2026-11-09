<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import MaterialTextField from "./MaterialTextField.vue";

const props = defineProps(["state"]);
const s = props.state;
const hasChrome = typeof chrome !== "undefined" && chrome.runtime?.sendMessage;

const redirectUrl = ref("");
const connected = ref(false);
const account = ref("");
const lastSync = ref(0);
const lastError = ref("");
const busy = ref(false);
const message = ref("");
const copied = ref(false);

function readStatus() {
  if (!hasChrome) return;
  chrome.storage.local.get(["eduarteOutlookSync", "eduarteOutlookAccount", "eduarteOutlookLastSync", "eduarteOutlookLastError"], (data) => {
    connected.value = !!data.eduarteOutlookSync;
    account.value = data.eduarteOutlookAccount || "";
    lastSync.value = data.eduarteOutlookLastSync || 0;
    lastError.value = data.eduarteOutlookLastError || "";
  });
}

function send(type) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type }, (res) => {
      resolve(chrome.runtime.lastError ? { success: false, error: chrome.runtime.lastError.message } : res);
    });
  });
}

async function connect() {
  if (!hasChrome || busy.value) return;
  busy.value = true;
  message.value = "Microsoft-inlogvenster openen…";
  const res = await send("OUTLOOK_CONNECT");
  busy.value = false;
  message.value = res?.success
    ? "Gekoppeld! Open je Eduarte-agenda om je rooster in Outlook te zetten."
    : (res?.error || "Koppelen mislukt.");
  readStatus();
}

async function disconnect() {
  if (!hasChrome) return;
  await send("OUTLOOK_DISCONNECT");
  message.value = "Ontkoppeld. Bestaande afspraken blijven in Outlook staan.";
  readStatus();
}

async function copyRedirect() {
  try {
    await navigator.clipboard.writeText(redirectUrl.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch { /* kopiëren niet toegestaan */ }
}

function onChanged(changes, area) {
  if (area === "local" && Object.keys(changes).some((k) => k.startsWith("eduarteOutlook"))) readStatus();
}

onMounted(async () => {
  if (!hasChrome) return;
  const res = await send("OUTLOOK_REDIRECT_URL");
  redirectUrl.value = res?.url || "";
  readStatus();
  chrome.storage.onChanged.addListener(onChanged);
});

onBeforeUnmount(() => {
  if (hasChrome) chrome.storage.onChanged.removeListener(onChanged);
});

function formatTime(ms) {
  return ms ? new Date(ms).toLocaleString("nl-NL", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "nog niet";
}
</script>

<template>
  <div class="setting outlook">
    <h3 class="setting-title">Rooster in Outlook</h3>
    <span class="setting-subtitle">
      Zet je lessen automatisch in je Outlook-agenda. Ze worden bijgewerkt elke keer dat je Eduarte opent
      (hooguit eens per uur) en bij elke week die je in de agenda bekijkt. Zonder koppeling kun je in de agenda
      altijd op <b>.ics</b> klikken om een week te downloaden.
    </span>

    <div v-if="connected" class="status ok">
      Gekoppeld{{ account ? ` met ${account}` : "" }} · laatst bijgewerkt {{ formatTime(lastSync) }}
      <span v-if="lastError" class="error">· {{ lastError }}</span>
    </div>

    <details v-if="!connected" class="steps">
      <summary>Eenmalig instellen (± 5 minuten)</summary>
      <ol>
        <li>Ga naar <a href="https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noreferrer">App-registraties in Microsoft Entra</a> en log in met je school- of Microsoft-account.</li>
        <li>Klik <b>Nieuwe registratie</b>. Naam: <i>Eduarte Tools</i>. Kies bij accounttypen de optie met <i>"elke organisatiemap en persoonlijke Microsoft-accounts"</i>.</li>
        <li>Kies bij <b>Omleidings-URI</b> het platform <b>Single-page application (SPA)</b> en plak deze URL:
          <code class="redirect">{{ redirectUrl || "(open de geïnstalleerde extensie om de URL te zien)" }}</code>
          <md-text-button v-if="redirectUrl" type="button" @click="copyRedirect">{{ copied ? "Gekopieerd" : "Kopieer URL" }}</md-text-button>
        </li>
        <li>Klik <b>Registreren</b> en kopieer de <b>Toepassings-id (client)</b> hieronder.</li>
      </ol>
    </details>

    <MaterialTextField v-if="!connected" v-model="s.eduarteOutlookClientId" label="Client ID" placeholder="1234abcd-…" autocomplete="off" />

    <div class="actions">
      <md-filled-tonal-button v-if="!connected" type="button" :disabled="busy || !s.eduarteOutlookClientId" @click="connect">
        {{ busy ? "Bezig…" : "Koppel Outlook" }}
      </md-filled-tonal-button>
      <md-text-button v-else type="button" @click="disconnect">Ontkoppelen</md-text-button>
    </div>
    <span v-if="message" class="status" role="status">{{ message }}</span>
  </div>
</template>

<style scoped>
.outlook { display: grid; gap: 10px; }
.status { color: var(--color-primary); font: var(--typescale-body-small); }
.status.ok { color: var(--color-on-surface); }
.error { color: var(--color-error, #f87171); }
.steps { font: var(--typescale-body-small); color: var(--color-on-surface-variant); }
.steps summary { cursor: pointer; color: var(--color-primary); font-weight: 600; }
.steps ol { margin: 8px 0 0; padding-left: 18px; display: grid; gap: 6px; }
.steps a { color: var(--color-primary); }
.redirect { display: block; margin: 4px 0; padding: 6px 8px; border-radius: 8px; background: var(--color-surface-container-high, rgba(255,255,255,.06)); word-break: break-all; user-select: all; }
.actions { display: flex; gap: 8px; }
</style>
