<script setup>
import SwitchInput from "../components/SwitchInput.vue";
import ColorSwatches from "../components/ColorSwatches.vue";
import MaterialTextField from "../components/MaterialTextField.vue";
import MaterialSlider from "../components/MaterialSlider.vue";
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
      type="button"
      :aria-pressed="p.key === s.eduarteThemePreset && !s.eduarteCustomTheme"
      :style="{ '--preset-gradient': `linear-gradient(135deg, ${p.bg}, ${p.accent})` }"
      @click="applyPreset(p)">{{ p.name }}</button>
  </div>

  <div class="section-label">Uiterlijk</div>
  <SwitchInput v-model="s.eduarteDarkMode" title="Donkere modus" subtitle="Gebruik een donker kleurenpalet voor Eduarte." />
  <SwitchInput v-model="s.eduarteModernStyle" title="Material 3-stijl" subtitle="Material 3-kleuren, expressieve vormen en rustige animaties op Eduarte." />
  <SwitchInput v-model="s.eduarteHumanTheme" title="Human-thema" subtitle="Origineel Study Tools glas-effect met achtergrond." />

  <div class="section-label">Accentkleur</div>
  <ColorSwatches v-model="s.eduarteAccentColor" />

  <div class="section-label">Achtergrond</div>
  <div class="setting">
    <MaterialTextField v-model="s.eduarteWallpaperUrl" label="Eigen achtergrondafbeelding (URL)" placeholder="https://example.com/wallpaper.jpg" autocomplete="off" />
    <span class="setting-subtitle">Voer een directe link in naar een afbeelding voor een glassmorphism achtergrond.</span>
  </div>
  <div class="setting">
    <h3 class="setting-title">Achtergrond vervaging</h3>
    <MaterialSlider v-model="s.eduarteWallpaperBlur" min="0" max="25" label="Achtergrond vervaging" />
    <div class="range-value">{{ s.eduarteWallpaperBlur }} px</div>
  </div>
  <div class="setting">
    <h3 class="setting-title">Donkere filterlaag</h3>
    <MaterialSlider v-model="s.eduarteWallpaperOverlay" min="10" max="90" label="Donkere filterlaag" />
    <div class="range-value">{{ s.eduarteWallpaperOverlay }}%</div>
  </div>

  <div class="section-label">Lettertype (Typografie)</div>
  <div class="setting">
    <span class="setting-subtitle">Kies een modern lettertype voor alle teksten in Eduarte.</span>
    <md-outlined-select :value="s.eduarteFont" label="Lettertype" @change="s.eduarteFont = $event.target.value">
      <md-select-option value="default"><div slot="headline">Standaard (Systeem)</div></md-select-option>
      <md-select-option value="inter"><div slot="headline">Inter (Modern & Strak)</div></md-select-option>
      <md-select-option value="roboto"><div slot="headline">Roboto (Neutraal)</div></md-select-option>
      <md-select-option value="poppins"><div slot="headline">Poppins (Rond & Fris)</div></md-select-option>
      <md-select-option value="lexend"><div slot="headline">Lexend (Optimaal leesbaar)</div></md-select-option>
      <md-select-option value="jetbrains"><div slot="headline">JetBrains Mono (Monospace)</div></md-select-option>
    </md-outlined-select>
  </div>

  <SwitchInput v-model="s.eduarteCustomTheme" title="Eigen kleuren gebruiken" subtitle="Gebruik de achtergrond- en kaartkleur hieronder." />
  <div class="color-row"><span>Achtergrond</span><input type="color" v-model="s.eduarteCustomColors.bg"></div>
  <div class="color-row"><span>Kaarten</span><input type="color" v-model="s.eduarteCustomColors.surface"></div>
  <div class="color-row"><span>Tekst</span><input type="color" v-model="s.eduarteCustomColors.text"></div>
  <div class="color-row"><span>Randen</span><input type="color" v-model="s.eduarteCustomColors.border"></div>
</template>
