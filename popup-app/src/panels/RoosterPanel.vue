<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import SwitchInput from "../components/SwitchInput.vue";
import MaterialTextField from "../components/MaterialTextField.vue";

const props = defineProps(["state"]);
const s = props.state;

const GITHUB_ORIGIN = { origins: ["https://api.github.com/*"] };
const STATUS_KEYS = [
  "eduarteRoosterUrl", "eduarteRoosterLastRun", "eduarteRoosterLastUpload",
  "eduarteRoosterLastError", "eduarteRoosterCount", "eduarteRoosterIcs",
];
const hasChrome = typeof chrome !== "undefined" && chrome.storage?.local;

const status = reactive({});
const busy = ref(false);
const message = ref("");
const copied = ref(false);

function loadStatus() {
  if (!hasChrome) return;
  chrome.storage.local.get(STATUS_KEYS, (data) => Object.assign(status, data));
}

function onStorageChange(changes, area) {
  if (area !== "local") return;
  for (const key of STATUS_KEYS) {
    if (changes[key]) status[key] = changes[key].newValue;
  }
}

onMounted(() => {
  loadStatus();
  if (hasChrome) chrome.storage.onChanged.addListener(onStorageChange);
});
onUnmounted(() => {
  if (hasChrome) chrome.storage.onChanged.removeListener(onStorageChange);
});

function formatTime(value) {
  if (!value) return "nog nooit";
  return new Date(value).toLocaleString("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const hasToken = computed(() => String(s.eduarteRoosterGithubToken || "").trim().length > 0);

// GitHub-toegang is een optionele permissie: alleen vragen als iemand de sync gebruikt.
function ensureGithubPermission() {
  if (!hasChrome || !chrome.permissions) return Promise.resolve(true);
  // Direct aanroepen (binnen de klik), anders ziet Chrome geen gebruikersactie.
  return chrome.permissions.request(GITHUB_ORIGIN);
}

const enabled = computed({
  get: () => s.eduarteRoosterSyncEnabled,
  set: (value) => {
    if (!value) {
      s.eduarteRoosterSyncEnabled = false;
      return;
    }
    ensureGithubPermission()
      .then((granted) => {
        s.eduarteRoosterSyncEnabled = granted;
        if (!granted) message.value = "Zonder toegang tot GitHub kan het rooster niet online worden gezet.";
      })
      .catch((error) => { message.value = error.message; });
  },
});

async function syncNow() {
  message.value = "";
  if (hasToken.value && !(await ensureGithubPermission())) {
    message.value = "Zonder toegang tot GitHub kan het rooster niet online worden gezet.";
    return;
  }
  busy.value = true;
  chrome.runtime.sendMessage({ type: "ROOSTER_SYNC_NOW" }, (response) => {
    busy.value = false;
    const error = chrome.runtime.lastError?.message || (!response?.success && response?.error);
    if (error) {
      message.value = error;
      return;
    }
    message.value = response.uploaded
      ? `${response.count} lessen bijgewerkt in je online agenda.`
      : `${response.count} lessen opgehaald.${hasToken.value ? "" : " Vul een GitHub-token in om ze online te zetten."}`;
    loadStatus();
  });
}

function copyUrl() {
  navigator.clipboard.writeText(status.eduarteRoosterUrl).then(() => {
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 1800);
  });
}

function downloadIcs() {
  const blob = new Blob([status.eduarteRoosterIcs], { type: "text/calendar" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "eduarte-rooster.ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
</script>

<template>
  <SwitchInput v-model="enabled" title="Rooster synchroniseren" subtitle="Zet je Eduarte-rooster automatisch in Outlook of Google Agenda. Wordt bijgewerkt als je Eduarte opent (hooguit één keer per uur)." />

  <div class="setting">
    <MaterialTextField v-model="s.eduarteRoosterGithubToken" label="GitHub-token (alleen 'gist')" type="password" placeholder="ghp_…" autocomplete="off" />
    <span class="setting-subtitle">
      Maak op <a href="https://github.com/settings/tokens/new?scopes=gist&amp;description=Eduarte%20Tools%20agenda" target="_blank" rel="noopener">github.com/settings/tokens</a>
      een classic token met alleen het vinkje <b>gist</b>. Je rooster komt in een geheime Gist: niet vindbaar, maar wel leesbaar voor iedereen met de link.
    </span>
  </div>

  <div class="setting">
    <h3 class="setting-title">Abonnementslink</h3>
    <template v-if="status.eduarteRoosterUrl">
      <code class="url">{{ status.eduarteRoosterUrl }}</code>
      <div class="actions">
        <md-filled-tonal-button type="button" @click="copyUrl">{{ copied ? "Gekopieerd" : "Link kopiëren" }}</md-filled-tonal-button>
      </div>
      <span class="setting-subtitle">
        Outlook: Agenda → <i>Agenda toevoegen</i> → <i>Abonneren vanaf internet</i> → plak de link.
        Google Agenda: <i>Andere agenda's</i> → <i>Via URL</i>. Outlook ververst zelf elke paar uur.
      </span>
    </template>
    <span v-else class="setting-subtitle">Verschijnt na de eerste synchronisatie met een GitHub-token.</span>
  </div>

  <div class="setting">
    <h3 class="setting-title">Status</h3>
    <span class="setting-subtitle">
      Laatst opgehaald: {{ formatTime(status.eduarteRoosterLastRun) }}<span v-if="status.eduarteRoosterCount"> · {{ status.eduarteRoosterCount }} lessen</span><br>
      Laatst online gezet: {{ formatTime(status.eduarteRoosterLastUpload) }}
    </span>
    <span v-if="status.eduarteRoosterLastError" class="setting-subtitle error">{{ status.eduarteRoosterLastError }}</span>
    <div class="actions">
      <md-filled-button type="button" :disabled="busy" @click="syncNow">{{ busy ? "Bezig…" : "Nu synchroniseren" }}</md-filled-button>
      <md-outlined-button v-if="status.eduarteRoosterIcs" type="button" @click="downloadIcs">.ics downloaden</md-outlined-button>
    </div>
    <span v-if="message" class="setting-subtitle">{{ message }}</span>
  </div>
</template>

<style scoped>
.url {
  display: block;
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--color-surface-container-low);
  font-size: 12px;
  word-break: break-all;
  user-select: all;
}
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.error { color: var(--color-error, #f2b8b5); }
a { color: var(--color-primary, inherit); }
</style>
