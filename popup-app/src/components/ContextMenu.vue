<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const isOpen = ref(false);
const enabled = ref(true);
const menu = ref(null);
const position = ref({ x: 0, y: 0 });

const actions = [
  { label: "Eduarte Tools openen", description: "Instellingen en functies", page: "settings", icon: "settings" },
  { label: "Pack opening", description: "Onthul cijfers van Eduarte", page: "packs", icon: "redeem" },
  { label: "Mijn team", description: "Verzameling, team en penalty's", page: "team", icon: "groups" },
];

function isBrowserContext(target) {
  const element = target instanceof Element ? target : target?.parentElement;
  const hasSelection = window.getSelection()?.toString().trim();

  return Boolean(
    hasSelection
    || element?.closest("a[href], area[href], button, input, textarea, select, option, [contenteditable]:not([contenteditable='false']), [role='button'], img, video, audio")
  );
}

async function showMenu(event) {
  if (!enabled.value) return;
  if (event.target instanceof Element && event.target.closest("#eduarte-tools-context-menu")) return;
  if (isBrowserContext(event.target)) return;

  event.preventDefault();
  position.value = { x: event.clientX, y: event.clientY };
  isOpen.value = true;
  await nextTick();

  const bounds = menu.value?.getBoundingClientRect();
  if (!bounds) return;
  position.value = {
    x: Math.max(8, Math.min(event.clientX, window.innerWidth - bounds.width - 8)),
    y: Math.max(8, Math.min(event.clientY, window.innerHeight - bounds.height - 8)),
  };
}

function closeMenu() {
  isOpen.value = false;
}

function closeOutside(event) {
  if (menu.value && !menu.value.contains(event.target)) closeMenu();
}

function onKeydown(event) {
  if (event.key === "Escape") closeMenu();
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

function onStorageChanged(changes, area) {
  if (area !== "local" || !changes.eduarteContextMenuEnabled) return;
  enabled.value = changes.eduarteContextMenuEnabled.newValue !== false;
  if (!enabled.value) closeMenu();
}

onMounted(() => {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.get("eduarteContextMenuEnabled", (data) => {
      const error = chrome.runtime.lastError;
      if (error) {
        console.error("Eduarte Tools kon de contextmenu-instelling niet lezen.", error.message);
        return;
      }
      enabled.value = data.eduarteContextMenuEnabled !== false;
    });
    chrome.storage.onChanged.addListener(onStorageChanged);
  }
  document.addEventListener("contextmenu", showMenu, true);
  document.addEventListener("pointerdown", closeOutside, true);
  document.addEventListener("keydown", onKeydown, true);
  window.addEventListener("scroll", closeMenu, true);
  window.addEventListener("resize", closeMenu);
});

onBeforeUnmount(() => {
  if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
    chrome.storage.onChanged.removeListener(onStorageChanged);
  }
  document.removeEventListener("contextmenu", showMenu, true);
  document.removeEventListener("pointerdown", closeOutside, true);
  document.removeEventListener("keydown", onKeydown, true);
  window.removeEventListener("scroll", closeMenu, true);
  window.removeEventListener("resize", closeMenu);
});
</script>

<template>
  <div
    v-if="isOpen"
    ref="menu"
    class="expressive-menu"
    role="menu"
    aria-label="Eduarte Tools"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
  >
    <div class="menu-heading" role="presentation">EDUARTE TOOLS</div>
    <button
      v-for="action in actions"
      :key="action.page"
      class="menu-item"
      type="button"
      role="menuitem"
      @click="openPage(action.page)"
    >
      <svg v-if="action.icon === 'settings'" class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.14 12.94a7.5 7.5 0 0 0 .05-1.88l2.03-1.58-2-3.46-2.42.98a7.3 7.3 0 0 0-1.63-.94L14.8 3h-4l-.37 3.06a7.3 7.3 0 0 0-1.63.94l-2.42-.98-2 3.46 2.03 1.58a7.5 7.5 0 0 0 0 1.88l-2.03 1.58 2 3.46 2.42-.98c.5.4 1.05.72 1.63.94L10.8 21h4l.37-3.06c.58-.22 1.13-.54 1.63-.94l2.42.98 2-3.46-2.08-1.58ZM12.8 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
      </svg>
      <svg v-else class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 7h-3.18a3 3 0 0 0-5.32-2.12L12 5.4l.5-.52A3 3 0 0 0 7.18 7H4v2h16V7Zm-9.5 0h-2a1 1 0 1 1 2 0Zm5 0h-2a1 1 0 1 1 2 0ZM5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8H5Zm5 7H8v-5h2v5Zm6 0h-2v-5h2v5Z" />
      </svg>
      <span class="menu-item-text">
        <span class="menu-item-label">{{ action.label }}</span>
        <span class="menu-item-description">{{ action.description }}</span>
      </span>
    </button>
  </div>
</template>
