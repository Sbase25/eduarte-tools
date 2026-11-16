<script setup>
import { computed } from "vue";
import Icon from "./Icon.vue";

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const value = computed({
  get() { return props.modelValue; },
  set(v) { emit("update:modelValue", v); },
});

function selectTab(tab) {
  if (tab.id === "packs" || tab.id === "team") {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "OPEN_EDUARTE_TOOLS_PAGE", page: tab.id }, (response) => {
        const error = chrome.runtime.lastError;
        if (error) console.error("Eduarte Tools kon de pack opening niet openen.", error.message);
        else if (!response?.success) console.error("Eduarte Tools kon de pack opening niet openen.", response?.error);
      });
    } else {
      window.open(new URL(`/${tab.id}.html`, window.location.href).href, "_blank", "noopener");
    }
    return;
  }
  value.value = tab.id;
}

const tabs = [
  { id: "theme", name: "Thema", icon: "format_paint" },
  { id: "login", name: "Inloggen", icon: "key" },
  { id: "sidebar", name: "Menubalk", icon: "thumbnail_bar" },
  { id: "start", name: "Start", icon: "home" },
  { id: "grades", name: "Cijfers", icon: "workspace_premium" },
  { id: "shortcuts", name: "Sneltoetsen", icon: "keyboard" },
  { id: "packs", name: "Packs", icon: "redeem" },
  { id: "team", name: "Team", icon: "groups" },
  { id: "ideas", name: "Ideeën", icon: "lightbulb" },
  { id: "about", name: "Over", icon: "info" },
];
</script>

<template>
  <nav id="navigation-rail">
    <button v-for="tab in tabs" :key="tab.id" class="navigation-item" type="button" @click="selectTab(tab)" :data-active="tab.id === value" :aria-current="tab.id === value ? 'page' : undefined">
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
  justify-content: flex-start;
  gap: 0;
  padding-top: 20px;
  border-right: 1px solid var(--color-outline-variant);
  background-color: var(--color-surface-container-low);
  overflow: hidden;
}
.navigation-item {
  position: relative;
  display: flex;
  flex: 0 0 55px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 100%;
  padding: 2px 0;
  color: var(--color-on-surface-variant);
  font: 650 11px/14px var(--md-ref-typeface-plain);
  border: 0;
  border-radius: 20px 20px 8px 20px;
  background: transparent;
  cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease;
}
.navigation-item[data-active=true] { color: var(--color-primary); }
.navigation-item:hover { color: var(--color-on-surface); }
.navigation-item[data-active=true]:hover { color: var(--color-primary); }
.navigation-item-icon-wrapper {
  position: relative;
  display: flex;
  place-items: center;
  place-content: center;
  width: 54px;
  height: 27px;
  border-radius: 16px;
  transition: background-color 220ms cubic-bezier(.2,.8,.2,1), width 220ms cubic-bezier(.2,.8,.2,1), border-radius 220ms;
}
.navigation-item-icon-wrapper[data-active=true] {
  width: 54px;
  border-radius: 999px;
  background: var(--color-primary);
}
.navigation-item-icon-wrapper[data-active=true] .icon { color: var(--color-on-primary); }
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
.navigation-item:active .navigation-item-icon-wrapper { transform: scale(.95); }
</style>
