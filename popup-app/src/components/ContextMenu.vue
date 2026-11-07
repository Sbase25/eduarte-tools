<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const isOpen = ref(false);
const menu = ref(null);
const anchor = ref(null);
const position = ref({ x: 0, y: 0 });

const actions = [
  { label: "Eduarte Tools openen", description: "Instellingen en functies", page: "settings", icon: "settings" },
  { label: "Pack opening", description: "Onthul cijfers van Eduarte", page: "packs", icon: "redeem" },
];

function isBrowserContext(target) {
  const element = target instanceof Element ? target : target?.parentElement;
  const hasSelection = window.getSelection()?.toString().trim();

  return Boolean(
    hasSelection
    || element?.closest("a[href], area[href], button, input, textarea, select, [contenteditable='true'], [role='button'], img, video, audio")
  );
}

async function showMenu(event) {
  const path = event.composedPath();
  if (menu.value && path.includes(menu.value)) {
    event.preventDefault();
    return;
  }
  if (isBrowserContext(event.target)) return;

  event.preventDefault();
  position.value = { x: event.clientX, y: event.clientY };
  isOpen.value = true;
  await nextTick();
  if (!menu.value || !anchor.value) return;
  menu.value.anchorElement = anchor.value;
  menu.value.open = true;
}

function closeMenu() {
  if (menu.value) menu.value.open = false;
  isOpen.value = false;
}

function closeOutside(event) {
  if (menu.value && !event.composedPath().includes(menu.value)) closeMenu();
}

function openPage(page) {
  closeMenu();
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    console.error("Eduarte Tools kan deze pagina niet vanuit het contextmenu openen.");
    return;
  }

  chrome.runtime.sendMessage({ type: "OPEN_EDUARTE_TOOLS_PAGE", page }, (response) => {
    const error = chrome.runtime.lastError;
    if (error) {
      console.error("Eduarte Tools kon de pagina niet openen.", error.message);
    } else if (!response?.success) {
      console.error("Eduarte Tools kon de pagina niet openen.", response?.error || "Onbekende fout.");
    }
  });
}

onMounted(() => {
  document.addEventListener("contextmenu", showMenu, true);
  document.addEventListener("pointerdown", closeOutside, true);
  window.addEventListener("scroll", closeMenu, true);
  window.addEventListener("resize", closeMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("contextmenu", showMenu, true);
  document.removeEventListener("pointerdown", closeOutside, true);
  window.removeEventListener("scroll", closeMenu, true);
  window.removeEventListener("resize", closeMenu);
});
</script>

<template>
  <span
    v-if="isOpen"
    ref="anchor"
    class="menu-anchor"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    aria-hidden="true"
  ></span>
  <md-menu
    v-if="isOpen"
    ref="menu"
    class="expressive-menu"
    positioning="fixed"
    menu-corner="start-start"
    anchor-corner="start-start"
    aria-label="Eduarte Tools"
    @close-menu="isOpen = false"
  >
    <div class="menu-heading" role="none">EDUARTE TOOLS</div>
    <md-menu-item v-for="action in actions" :key="action.page" @click="openPage(action.page)">
      <svg v-if="action.icon === 'settings'" slot="start" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.14 12.94a7.5 7.5 0 0 0 .05-1.88l2.03-1.58-2-3.46-2.42.98a7.3 7.3 0 0 0-1.63-.94L14.8 3h-4l-.37 3.06a7.3 7.3 0 0 0-1.63.94l-2.42-.98-2 3.46 2.03 1.58a7.5 7.5 0 0 0 0 1.88l-2.03 1.58 2 3.46 2.42-.98c.5.4 1.05.72 1.63.94L10.8 21h4l.37-3.06c.58-.22 1.13-.54 1.63-.94l2.42.98 2-3.46-2.08-1.58ZM12.8 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
      </svg>
      <svg v-else slot="start" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 7h-3.18a3 3 0 0 0-5.32-2.12L12 5.4l.5-.52A3 3 0 0 0 7.18 7H4v2h16V7Zm-9.5 0h-2a1 1 0 1 1 2 0Zm5 0h-2a1 1 0 1 1 2 0ZM5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8H5Zm5 7H8v-5h2v5Zm6 0h-2v-5h2v5Z" />
      </svg>
      <div slot="headline">{{ action.label }}</div>
      <div slot="supporting-text">{{ action.description }}</div>
    </md-menu-item>
  </md-menu>
</template>
