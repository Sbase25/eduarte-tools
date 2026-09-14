<script setup>
import { computed } from "vue";
import Icon from "./Icon.vue";

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const value = computed({
  get() { return props.modelValue; },
  set(v) { emit("update:modelValue", v); },
});

const tabs = [
  { id: "theme", name: "Thema", icon: "format_paint" },
  { id: "login", name: "Inloggen", icon: "key" },
  { id: "sidebar", name: "Menubalk", icon: "thumbnail_bar" },
  { id: "start", name: "Start", icon: "home" },
  { id: "grades", name: "Cijfers", icon: "workspace_premium" },
  { id: "shortcuts", name: "Sneltoetsen", icon: "keyboard" },
  { id: "elo", name: "ELO", icon: "local_library" },
  { id: "ideas", name: "Ideeën", icon: "lightbulb" },
  { id: "about", name: "Over", icon: "info" },
];
</script>

<template>
  <nav id="navigation-rail">
    <div class="brand"><img src="/icons/icon48.png" alt="Eduarte Tools" width="26" height="26"></div>
    <button v-for="tab in tabs" :key="tab.id" class="navigation-item" @click="value = tab.id" :data-active="tab.id === value">
      <div class="navigation-item-icon-wrapper" :data-active="tab.id === value">
        <Icon :filled="tab.id === value">{{ tab.icon }}</Icon>
        <div class="navigation-item-state-layer"></div>
      </div>
      <span>{{ tab.name }}</span>
    </button>
  </nav>
</template>

<style scoped>
#navigation-rail {
  width: 80px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-block: 12px;
  border-right: 1px solid var(--color-surface-container-high);
  background-color: var(--color-surface-container-lowest);
  overflow-y: auto;
}
.brand {
  width: 48px;
  height: 30px;
  display: grid;
  place-items: center;
  margin-bottom: 6px;
  border-radius: 15px;
  background: linear-gradient(135deg, #2563eb, #9333ea);
  box-shadow: 0 4px 12px #2563eb55;
}
.navigation-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: 52px;
  padding-block: 0;
  color: var(--color-on-surface-variant);
  font: var(--typescale-label-medium);
  border: none;
  outline: none;
  background: transparent;
  cursor: pointer;
}
.navigation-item[data-active=true] { color: var(--color-on-surface); }
.navigation-item:hover { color: var(--color-on-surface); }
.navigation-item-icon-wrapper {
  position: relative;
  display: flex;
  place-items: center;
  place-content: center;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  transition: background-color 260ms cubic-bezier(.2,0,0,1), width 260ms cubic-bezier(.2,0,0,1);
}
.navigation-item-icon-wrapper[data-active=true] {
  width: 54px;
  background: linear-gradient(135deg, #30379b, #7040ed);
  box-shadow: 0 3px 10px #4338ca55;
  animation: railPop .3s cubic-bezier(.34,1.56,.64,1);
}
.navigation-item-icon-wrapper[data-active=true] .icon { color: #fff; }
@keyframes railPop { 0% { transform: scale(.8); } 60% { transform: scale(1.06); } 100% { transform: scale(1); } }
.navigation-item-state-layer {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-color: currentColor;
  opacity: 0;
  transition: opacity 160ms;
}
.navigation-item:hover .navigation-item-state-layer { opacity: .08; }
.navigation-item:focus-visible .navigation-item-state-layer { opacity: .12; }
.navigation-item:active .navigation-item-icon-wrapper { transform: scale(.92); }
</style>
