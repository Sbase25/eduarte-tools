<script setup>
import SwitchInput from "../components/SwitchInput.vue";

const props = defineProps(["state"]);
const s = props.state;

const DEFAULT_SHORTCUTS = {
  "/agenda": { key: "a", ctrl: true, alt: false, shift: false },
  "/resultaten": { key: "r", ctrl: true, alt: false, shift: false },
};

const pages = [
  { page: "/agenda", title: "Agenda", hint: "Standaard: Ctrl+A" },
  { page: "/resultaten", title: "Resultaten", hint: "Standaard: Ctrl+R" },
  { page: "/berichten", title: "Berichten", hint: "Standaard: niet ingesteld" },
  { page: "/studiewijzers", title: "Studiewijzers", hint: "Standaard: niet ingesteld" },
  { page: "/", title: "Start / Dashboard", hint: "Standaard: niet ingesteld" },
];

function formatShortcutLabel(combo) {
  if (!combo) return "";
  const parts = [];
  if (combo.ctrl) parts.push("Ctrl");
  if (combo.alt) parts.push("Alt");
  if (combo.shift) parts.push("Shift");
  parts.push(combo.key.length === 1 ? combo.key.toUpperCase() : combo.key);
  return parts.join("+");
}

function labelFor(page) {
  return formatShortcutLabel(s.eduarteShortcuts[page]);
}

function onFocus(e) {
  e.target.classList.add("recording");
  e.target.value = "Druk een toets...";
}

function onBlur(e, page) {
  e.target.classList.remove("recording");
  e.target.value = labelFor(page);
}

function onKeydown(e, page) {
  e.preventDefault();
  if (e.key === "Escape") {
    delete s.eduarteShortcuts[page];
    e.target.blur();
    return;
  }
  if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
  const combo = { key: e.key.toLowerCase(), ctrl: e.ctrlKey || e.metaKey, alt: e.altKey, shift: e.shiftKey };
  s.eduarteShortcuts[page] = combo;
  e.target.value = formatShortcutLabel(combo);
  e.target.blur();
}

function resetShortcuts() {
  s.eduarteShortcuts = { ...DEFAULT_SHORTCUTS };
}
</script>

<template>
  <p class="note">Stel je eigen sneltoetsen in om snel naar een Eduarte-pagina te springen. Klik op een veld en druk de gewenste toetscombinatie in (bijv. Ctrl+Agenda). Werkt overal binnen Eduarte/Educus.</p>
  <SwitchInput v-model="s.eduarteShortcutKeysEnabled" title="Sneltoetsen inschakelen" subtitle="Zet alle onderstaande sneltoetsen aan of uit." />

  <div v-for="p in pages" :key="p.page" class="setting">
    <h3 class="setting-title">{{ p.title }}</h3>
    <span class="setting-subtitle">{{ p.hint }}</span>
    <input class="shortcut-input" type="text" readonly :value="labelFor(p.page)" placeholder="Klik en druk een toets..."
      @focus="onFocus" @blur="onBlur($event, p.page)" @keydown="onKeydown($event, p.page)">
  </div>
  <div class="setting"><button class="btn tonal" @click="resetShortcuts">Standaardwaarden herstellen</button></div>
</template>
