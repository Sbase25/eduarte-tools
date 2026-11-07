<script setup>
import { computed } from "vue";

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
    <md-switch
      :selected="value"
      icons
      :aria-label="title || 'Instelling in- of uitschakelen'"
      @change="value = $event.target.selected"
    />
  </label>
</template>

<style scoped>
.setting.switch {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 18px;
  min-height: 64px;
  padding: 10px 12px;
  border-radius: 20px 20px 8px 20px;
  cursor: pointer;
  transition: background-color 180ms ease;
}
.setting.switch:hover { background: var(--color-surface-container-low); }
.setting-title { margin: 0; font: var(--typescale-body-large); color: var(--color-on-surface); }
.setting-subtitle { display: block; margin-top: 2px; color: var(--color-on-surface-variant); font: var(--typescale-body-medium); }
md-switch { flex: 0 0 auto; }
</style>
