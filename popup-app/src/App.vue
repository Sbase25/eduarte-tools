<script setup>
import { ref, onMounted } from "vue";
import { createStore } from "./store.js";
import NavigationRail from "./components/NavigationRail.vue";
import TopAppBar from "./components/TopAppBar.vue";
import ThemePanel from "./panels/ThemePanel.vue";
import LoginPanel from "./panels/LoginPanel.vue";
import SidebarPanel from "./panels/SidebarPanel.vue";
import StartPanel from "./panels/StartPanel.vue";
import GradesPanel from "./panels/GradesPanel.vue";
import ShortcutsPanel from "./panels/ShortcutsPanel.vue";
import EloPanel from "./panels/EloPanel.vue";
import AboutPanel from "./panels/AboutPanel.vue";

const { state, load, save } = createStore();
const tab = ref("theme");
const saved = ref(false);

const titles = {
  theme: "Thema", login: "Inloggen", sidebar: "Menubalk", start: "Start",
  grades: "Cijfers", shortcuts: "Sneltoetsen", elo: "ELO", about: "Over",
};

const panels = {
  theme: ThemePanel, login: LoginPanel, sidebar: SidebarPanel, start: StartPanel,
  grades: GradesPanel, shortcuts: ShortcutsPanel, elo: EloPanel, about: AboutPanel,
};

onMounted(load);

async function onSave() {
  await save();
  saved.value = true;
  setTimeout(() => { saved.value = false; }, 1400);
}
</script>

<template>
  <div id="app-layout">
    <NavigationRail v-model="tab" />
    <main id="content">
      <TopAppBar :title="titles[tab]" subtitle="Eduarte Tools · moderne instellingen" />
      <transition name="panel" mode="out-in">
        <section class="panel" :key="tab">
          <component :is="panels[tab]" :state="state" />
        </section>
      </transition>
    </main>
    <div id="save-bar">
      <button class="btn filled full" :class="{ saved }" @click="onSave">{{ saved ? "Opgeslagen ✓" : "Opslaan" }}</button>
    </div>
  </div>
</template>

<style scoped>
#app-layout {
  display: grid;
  grid-template-columns: 80px 1fr;
  height: 100%;
  overflow: hidden;
}
#content {
  position: relative;
  min-width: 0;
  overflow-y: auto;
  padding-bottom: 64px;
}
.panel { padding: 0 16px 16px; }
.panel-enter-active, .panel-leave-active { transition: opacity 220ms ease, transform 220ms cubic-bezier(.22,1,.36,1); }
.panel-enter-from { opacity: 0; transform: translateY(8px) scale(.985); }
.panel-leave-to { opacity: 0; }
#save-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  width: calc(100% - 80px);
  padding: 9px 16px;
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  border-top: 1px solid var(--color-surface-container-high);
  backdrop-filter: blur(12px);
}
</style>
