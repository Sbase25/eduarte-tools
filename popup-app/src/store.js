import { reactive, watch } from "vue";

/**
 * Reactieve wrapper rond chrome.storage.local die de bestaande "eduarte*"
 * opslagsleutels hergebruikt, zodat background.js/content.js/overlay.js/
 * theme.js ongewijzigd blijven werken met deze nieuwe Vue-popup.
 */
const KEYS = [
  "eduarteThemePreset", "eduarteDarkMode", "eduarteAccentColor", "eduarteModernStyle", "eduarteHumanTheme",
  "eduarteWallpaperUrl", "eduarteWallpaperBlur", "eduarteWallpaperOverlay", "eduarteFont",
  "eduarteCustomTheme", "eduarteCustomColors", "eduarteEnabled", "eduarteUsername", "eduartePassword",
  "eduarteAutosubmit", "eduarteModernNav", "eduarteAnimations", "eduarteFloatingCards",
  "eduarteStartEnabled", "eduarteWeatherEnabled", "eduarteWeatherUseLocation", "eduarteWeatherCoordinates",
  "eduarteWeatherLocationLabel", "eduarteWeatherCity", "eduarteGreetingEnabled",
  "eduarteShortcutsEnabled", "eduartePomodoroEnabled", "eduarteQuickCalcEnabled", "eduarteQuoteEnabled",
  "eduarteAnimationSpeed", "eduarteGradesEnabled", "eduarteGradeMinimum", "eduarteGradeMaximum",
  "eduartePassThreshold", "eduarteShortcutKeysEnabled", "eduarteShortcuts", "eduarteBadgeEnabled",
];

const DEFAULTS = {
  eduarteThemePreset: "dark",
  eduarteDarkMode: true,
  eduarteAccentColor: "#3b82f6",
  eduarteModernStyle: true,
  eduarteHumanTheme: false,
  eduarteWallpaperUrl: "",
  eduarteWallpaperBlur: 12,
  eduarteWallpaperOverlay: 55,
  eduarteFont: "default",
  eduarteCustomTheme: false,
  eduarteCustomColors: { bg: "#15171b", surface: "#1f2328", text: "#f4f4f6", border: "#545e6b" },
  eduarteEnabled: true,
  eduarteUsername: "",
  eduartePassword: "",
  eduarteAutosubmit: false,
  eduarteModernNav: true,
  eduarteAnimations: true,
  eduarteFloatingCards: true,
  eduarteStartEnabled: true,
  eduarteWeatherEnabled: true,
  eduarteWeatherUseLocation: true,
  eduarteWeatherCoordinates: null,
  eduarteWeatherLocationLabel: "",
  eduarteWeatherCity: "",
  eduarteGreetingEnabled: true,
  eduarteShortcutsEnabled: true,
  eduartePomodoroEnabled: true,
  eduarteQuickCalcEnabled: true,
  eduarteQuoteEnabled: true,
  eduarteAnimationSpeed: 60,
  eduarteGradesEnabled: true,
  eduarteGradeMinimum: 1,
  eduarteGradeMaximum: 10,
  eduartePassThreshold: 5.5,
  eduarteShortcutKeysEnabled: true,
  eduarteShortcuts: {
    "/agenda": { key: "a", ctrl: true, alt: false, shift: false },
    "/resultaten": { key: "r", ctrl: true, alt: false, shift: false },
  },
  eduarteBadgeEnabled: true,
};

const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

export function createStore() {
  const state = reactive({ ...DEFAULTS });
  const loaded = reactive({ value: false });

  function load() {
    if (!hasChrome) {
      loaded.value = true;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      chrome.storage.local.get(KEYS, (data) => {
        for (const key of KEYS) {
          if (data[key] !== undefined) state[key] = data[key];
        }
        loaded.value = true;
        resolve();
      });
    });
  }

  function save() {
    if (!hasChrome) return Promise.resolve();
    const payload = {};
    for (const key of KEYS) payload[key] = state[key];
    return new Promise((resolve) => {
      chrome.storage.local.set(payload, resolve);
    });
  }

  watch(state, () => {
    if (loaded.value) save();
  }, { deep: true });

  return { state, loaded, load, save };
}
