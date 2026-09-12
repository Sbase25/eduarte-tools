<script setup>
import SwitchInput from "../components/SwitchInput.vue";
import ColorSwatches from "../components/ColorSwatches.vue";
import { presets } from "../themePresets.js";

const props = defineProps(["state"]);
const s = props.state;

function applyPreset(preset) {
  s.eduarteThemePreset = preset.key;
  s.eduarteDarkMode = preset.dark;
  s.eduarteAccentColor = preset.accent;
  s.eduarteCustomColors = { bg: preset.bg, surface: preset.surface, text: preset.text, border: preset.border };
  s.eduarteCustomTheme = false;
}
</script>

<template>
  <p class="note">Pas de kleuren, achtergrond en vormgeving van Eduarte aan. De instellingen blijven lokaal opgeslagen.</p>

  <div class="section-label">Thema Voorkeuren</div>
  <div class="preset-grid">
    <button v-for="p in presets" :key="p.key" class="preset"
      :class="{ selected: p.key === s.eduarteThemePreset && !s.eduarteCustomTheme }"
      :style="{ '--preset-gradient': `linear-gradient(135deg, ${p.bg}, ${p.accent})` }"
      @click="applyPreset(p)">{{ p.name }}</button>
  </div>

  <div class="section-label">Uiterlijk</div>
  <SwitchInput v-model="s.eduarteDarkMode" title="Donkere modus" subtitle="Gebruik een donker kleurenpalet voor Eduarte." />
  <SwitchInput v-model="s.eduarteModernStyle" title="Moderne stijl" subtitle="Rondere kaarten, schaduwen en vloeiende animaties." />
  <SwitchInput v-model="s.eduarteHumanTheme" title="Human-thema" subtitle="Origineel Study Tools glas-effect met achtergrond." />

  <div class="section-label">Accentkleur</div>
  <ColorSwatches v-model="s.eduarteAccentColor" />

  <div class="section-label">Achtergrond</div>
  <div class="setting">
    <h3 class="setting-title">Eigen achtergrondafbeelding (URL)</h3>
    <span class="setting-subtitle">Voer een directe link in naar een afbeelding voor een glassmorphism achtergrond.</span>
    <input type="text" v-model="s.eduarteWallpaperUrl" placeholder="https://example.com/wallpaper.jpg" autocomplete="off">
  </div>
  <div class="setting">
    <h3 class="setting-title">Achtergrond vervaging</h3>
    <input class="range" type="range" min="0" max="25" v-model.number="s.eduarteWallpaperBlur">
    <div class="range-value">{{ s.eduarteWallpaperBlur }} px</div>
  </div>
  <div class="setting">
    <h3 class="setting-title">Donkere filterlaag</h3>
    <input class="range" type="range" min="10" max="90" v-model.number="s.eduarteWallpaperOverlay">
    <div class="range-value">{{ s.eduarteWallpaperOverlay }}%</div>
  </div>

  <div class="section-label">Lettertype (Typografie)</div>
  <div class="setting">
    <span class="setting-subtitle">Kies een modern lettertype voor alle teksten in Eduarte.</span>
    <select v-model="s.eduarteFont">
      <option value="default">Standaard (Systeem)</option>
      <option value="inter">Inter (Modern & Strak)</option>
      <option value="roboto">Roboto (Neutraal)</option>
      <option value="poppins">Poppins (Rond & Fris)</option>
      <option value="lexend">Lexend (Optimaal leesbaar)</option>
      <option value="jetbrains">JetBrains Mono (Monospace)</option>
    </select>
  </div>

  <SwitchInput v-model="s.eduarteCustomTheme" title="Eigen kleuren gebruiken" subtitle="Gebruik de achtergrond- en kaartkleur hieronder." />
  <div class="color-row"><span>Achtergrond</span><input type="color" v-model="s.eduarteCustomColors.bg"></div>
  <div class="color-row"><span>Kaarten</span><input type="color" v-model="s.eduarteCustomColors.surface"></div>
  <div class="color-row"><span>Tekst</span><input type="color" v-model="s.eduarteCustomColors.text"></div>
  <div class="color-row"><span>Randen</span><input type="color" v-model="s.eduarteCustomColors.border"></div>
</template>
