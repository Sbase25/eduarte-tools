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
import IdeasPanel from "./panels/IdeasPanel.vue";
import AboutPanel from "./panels/AboutPanel.vue";

const { state, load } = createStore();
const tab = ref("theme");

const titles = {
  theme: "Thema", login: "Inloggen", sidebar: "Menubalk", start: "Start",
  grades: "Cijfers", shortcuts: "Sneltoetsen", elo: "ELO", ideas: "Ideeën", about: "Over",
};

const panels = {
  theme: ThemePanel, login: LoginPanel, sidebar: SidebarPanel, start: StartPanel,
  grades: GradesPanel, shortcuts: ShortcutsPanel, elo: EloPanel, ideas: IdeasPanel, about: AboutPanel,
};

onMounted(load);
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
}
.panel { padding: 0 16px 16px; }
.panel-enter-active, .panel-leave-active { transition: opacity 220ms ease, transform 220ms cubic-bezier(.22,1,.36,1); }
.panel-enter-from { opacity: 0; transform: translateY(8px) scale(.985); }
.panel-leave-to { opacity: 0; }
</style>
