<script setup>
import { computed } from "vue";
import Icon from "./Icon.vue";
import { accentSwatches } from "../themePresets.js";

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const value = computed({
  get() { return props.modelValue; },
  set(v) { emit("update:modelValue", v); },
});

function isSelected(color) {
  return (value.value || "").toLowerCase() === color.toLowerCase();
}
</script>

<template>
  <div class="swatches">
    <button v-for="color in accentSwatches" :key="color" type="button" class="swatch" :style="{ background: color }"
      :class="{ selected: isSelected(color) }" @click="value = color">
      <Icon class="check">check</Icon>
    </button>
    <label class="swatch custom" title="Eigen kleur kiezen">
      <Icon>palette</Icon>
      <input type="color" :value="value" @input="value = $event.target.value">
    </label>
  </div>
</template>

<style scoped>
.swatches { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
.swatch {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
  transition: transform 180ms cubic-bezier(.34,1.56,.64,1), border-color 180ms ease;
}
.swatch:hover { transform: scale(1.1); }
.swatch:active { transform: scale(.92); }
.swatch .check { font-size: 17px; color: #fff; opacity: 0; transition: opacity 150ms; }
.swatch.selected { border-color: var(--color-on-surface); }
.swatch.selected .check { opacity: 1; }
.swatch.custom {
  background: var(--color-surface-container-high) !important;
  color: var(--color-on-surface-variant);
  border: 2px dashed var(--color-outline-variant);
}
.swatch.custom input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}
</style>
