<script setup>
import { computed } from "vue";
import Icon from "./Icon.vue";

const props = defineProps({ modelValue: Boolean, title: String, subtitle: String });
const emit = defineEmits(["update:modelValue"]);

const value = computed({
  get() { return props.modelValue; },
  set(v) { emit("update:modelValue", v); },
});
</script>

<template>
  <label class="setting switch">
    <div v-if="title || $slots.title" class="setting-text">
      <h3 class="setting-title"><slot name="title">{{ title }}</slot></h3>
      <span v-if="subtitle || $slots.subtitle" class="setting-subtitle"><slot name="subtitle">{{ subtitle }}</slot></span>
    </div>
    <div class="switch-track" :data-state="value">
      <div class="switch-thumb" :data-state="value">
        <Icon class="switch-icon" :data-state="value">check</Icon>
      </div>
    </div>
    <input type="checkbox" v-model="value">
  </label>
</template>

<style scoped>
.setting.switch {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px;
  padding-block: 12px;
  cursor: pointer;
}
.setting-title { margin: 0; font: var(--typescale-body-large); color: var(--color-on-surface); }
.setting-subtitle { display: block; margin-top: 2px; color: var(--color-on-surface-variant); font: var(--typescale-body-medium); }
.switch-track {
  --thumb-size: 16px;
  position: relative;
  flex: none;
  width: 52px;
  height: 32px;
  border: 2px solid var(--color-outline);
  border-radius: 16px;
  background-color: var(--color-surface-container-highest);
  transition: background-color 200ms, border-color 200ms;
}
.switch-track[data-state=true] { border-color: transparent; background-color: var(--color-primary); }
.switch-thumb {
  position: absolute;
  top: 50%;
  left: 8px;
  width: var(--thumb-size);
  height: var(--thumb-size);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--color-outline);
  transform: translateY(-50%);
  transition: left 200ms cubic-bezier(.2,0,0,1), width 200ms cubic-bezier(.2,0,0,1), height 200ms cubic-bezier(.2,0,0,1), background-color 200ms;
}
label:hover .switch-thumb { --thumb-size: 20px; }
.switch-thumb[data-state=true] { left: 30px; --thumb-size: 24px; background-color: var(--color-on-primary-container); }
.switch-icon {
  font-size: 15px;
  opacity: 0;
  color: var(--color-surface-container-highest);
  transition: opacity 150ms;
}
.switch-icon[data-state=true] { opacity: 1; }
.switch input { position: absolute; height: 0; width: 0; overflow: hidden; opacity: 0; }
</style>
