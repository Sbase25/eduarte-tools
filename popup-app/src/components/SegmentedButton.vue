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
    <button v-for="opt in options" :key="opt.value" class="segment" :data-state="opt.value === value" @click="value = opt.value">
      <Icon v-if="opt.icon" :filled="opt.value === value">{{ opt.icon }}</Icon>
      <span v-if="opt.title">{{ opt.title }}</span>
    </button>
  </div>
</template>

<style scoped>
.segmented-button {
  display: flex;
  border: 1.5px solid var(--color-outline);
  border-radius: 20px;
  padding: 3px;
  gap: 2px;
  background: var(--color-surface-container-low);
}
.segment {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding-inline: 10px;
  border: 0;
  border-radius: 17px;
  background: transparent;
  color: var(--color-on-surface-variant);
  font: var(--typescale-label-large);
  cursor: pointer;
  transition: background-color 220ms cubic-bezier(.2,0,0,1), color 200ms ease, transform 160ms cubic-bezier(.34,1.56,.64,1);
}
.segment .icon { font-size: 17px; }
.segment:active { transform: scale(.93); }
.segment[data-state=true] {
  background: var(--color-secondary-container);
  color: var(--color-on-secondary-container);
}
</style>
