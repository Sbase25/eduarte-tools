<script setup>
import { computed } from "vue";
import Icon from "./Icon.vue";

const props = defineProps(["modelValue", "options"]);
const emit = defineEmits(["update:modelValue"]);

const value = computed({
  get() { return props.modelValue; },
  set(v) { emit("update:modelValue", v); },
});
</script>

<template>
  <div class="segmented-button">
    <button v-for="opt in options" :key="opt.value" class="segment" type="button" :data-state="opt.value === value" :aria-pressed="opt.value === value" @click="value = opt.value">
      <Icon v-if="opt.icon" :filled="opt.value === value">{{ opt.icon }}</Icon>
      <span v-if="opt.title">{{ opt.title }}</span>
    </button>
  </div>
</template>

<style scoped>
.segmented-button {
  display: flex;
  padding: 4px;
  gap: 4px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 20px 20px 8px 20px;
  background: var(--color-surface-container);
}
.segment {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  padding-inline: 10px;
  border: 0;
  border-radius: 16px 16px 6px 16px;
  background: transparent;
  color: var(--color-on-surface-variant);
  font: var(--typescale-label-large);
  cursor: pointer;
  transition: background-color 180ms ease, color 180ms ease, transform 160ms cubic-bezier(.2,.8,.2,1);
}
.segment .icon { font-size: 17px; }
.segment:active { transform: scale(.93); }
.segment[data-state=true] {
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
}
</style>
