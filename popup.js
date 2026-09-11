const ids = [
  "darkmode", "modernstyle", "humantheme", "accent", "wallpaperUrl", "wallpaperBlur", "wallpaperOverlay", "font",
  "customenabled", "customBg", "customSurface", "customText", "customBorder",
  "enabled", "username", "password", "autosubmit", "modernnav", "animations",
  "floatingcards", "startEnabled", "weatherEnabled", "weatherCity", "greetingEnabled",
  "shortcutsEnabled", "pomodoroEnabled", "quickCalcEnabled", "quoteEnabled", "animationSpeed",
  "gradesEnabled", "gradeMin", "gradeMax", "passThreshold",
  "shortcutKeysEnabled",
];
const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
const titles = { theme: "Thema", login: "Inloggen", sidebar: "Menubalk", start: "Start", grades: "Cijfers", shortcuts: "Sneltoetsen", elo: "ELO", about: "Over" };

const DEFAULT_SHORTCUTS = {
  "/agenda": { key: "a", ctrl: true, alt: false, shift: false },
  "/resultaten": { key: "r", ctrl: true, alt: false, shift: false },
};

function formatShortcutLabel(combo) {
  if (!combo) return "";
  const parts = [];
  if (combo.ctrl) parts.push("Ctrl");
  if (combo.alt) parts.push("Alt");
  if (combo.shift) parts.push("Shift");
  parts.push(combo.key.length === 1 ? combo.key.toUpperCase() : combo.key);
  return parts.join("+");
}

let currentShortcuts = { ...DEFAULT_SHORTCUTS };

document.querySelectorAll(".shortcut-input").forEach((inp) => {
  inp.addEventListener("focus", () => {
    inp.classList.add("recording");
    inp.value = "Druk een toets...";
  });
  inp.addEventListener("blur", () => {
    inp.classList.remove("recording");
    const page = inp.dataset.page;
    const combo = currentShortcuts[page];
    inp.value = combo ? formatShortcutLabel(combo) : "";
  });
  inp.addEventListener("keydown", (e) => {
    e.preventDefault();
    const page = inp.dataset.page;
    if (e.key === "Escape") {
      delete currentShortcuts[page];
      inp.blur();
      return;
    }
    if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
    const combo = { key: e.key.toLowerCase(), ctrl: e.ctrlKey || e.metaKey, alt: e.altKey, shift: e.shiftKey };
    currentShortcuts[page] = combo;
    inp.value = formatShortcutLabel(combo);
    inp.blur();
  });
});

document.getElementById("shortcutsReset")?.addEventListener("click", () => {
  currentShortcuts = { ...DEFAULT_SHORTCUTS };
  document.querySelectorAll(".shortcut-input").forEach((inp) => {
    const combo = currentShortcuts[inp.dataset.page];
    inp.value = combo ? formatShortcutLabel(combo) : "";
  });
});

const presets = {
  dark: { dark: true, accent: "#3b82f6", bg: "#111827", surface: "#1f2937", text: "#f9fafb", border: "#374151" },
  blue: { dark: true, accent: "#38bdf8", bg: "#0b192c", surface: "#13253f", text: "#f0f9ff", border: "#1e3a5f" },
  purple: { dark: true, accent: "#c084fc", bg: "#130e24", surface: "#20163b", text: "#faf5ff", border: "#3b2d64" },
  emerald: { dark: true, accent: "#34d399", bg: "#062319", surface: "#0b3829", text: "#ecfdf5", border: "#14533d" },
  sunset: { dark: true, accent: "#fb923c", bg: "#1c0f0a", surface: "#2e1810", text: "#fff7ed", border: "#542d1f" },
  oled: { dark: true, accent: "#38bdf8", bg: "#000000", surface: "#09090b", text: "#ffffff", border: "#27272a" },
  nord: { dark: true, accent: "#88c0d0", bg: "#242933", surface: "#2e3440", text: "#eceff4", border: "#434c5e" },
  cyberpunk: { dark: true, accent: "#f43f5e", bg: "#090717", surface: "#140e2b", text: "#fdf4ff", border: "#2e1c59" },
  light: { dark: false, accent: "#2563eb", bg: "#f8fafc", surface: "#ffffff", text: "#0f172a", border: "#e2e8f0" },
};

let activePresetKey = "dark";

document.querySelectorAll(".rail button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".rail button").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(`panel-${button.dataset.tab}`).classList.add("active");
    document.getElementById("pageTitle").firstChild.textContent = titles[button.dataset.tab];
  });
});

function updateRange(id, outputId, unit = "") {
  elements[id].addEventListener("input", () => {
    const val = Number(elements[id].value);
    document.getElementById(outputId).textContent = unit ? `${val}${unit}` : val.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  });
}
updateRange("gradeMin", "gradeMinValue");
updateRange("gradeMax", "gradeMaxValue");
updateRange("passThreshold", "passThresholdValue");
updateRange("wallpaperBlur", "wallpaperBlurValue", " px");
updateRange("wallpaperOverlay", "wallpaperOverlayValue", "%");

document.querySelectorAll(".preset").forEach((button) => {
  button.addEventListener("click", () => {
    const presetKey = button.dataset.preset;
    const preset = presets[presetKey];
    if (!preset) return;
    activePresetKey = presetKey;
    elements.darkmode.checked = preset.dark;
    elements.accent.value = preset.accent;
    elements.customBg.value = preset.bg;
    elements.customSurface.value = preset.surface;
    elements.customText.value = preset.text;
    elements.customBorder.value = preset.border;
    elements.customenabled.checked = false; // Using a preset
    document.querySelectorAll(".preset").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
  });
});

elements.customenabled.addEventListener("change", () => {
  if (elements.customenabled.checked) {
    document.querySelectorAll(".preset").forEach((item) => item.classList.remove("selected"));
  } else {
    const btn = document.querySelector(`.preset[data-preset="${activePresetKey}"]`);
    if (btn) btn.classList.add("selected");
  }
});

function load() {
  chrome.storage.local.get([
    "eduarteThemePreset", "eduarteDarkMode", "eduarteAccentColor", "eduarteModernStyle", "eduarteHumanTheme",
    "eduarteWallpaperUrl", "eduarteWallpaperBlur", "eduarteWallpaperOverlay", "eduarteFont",
    "eduarteCustomTheme", "eduarteCustomColors", "eduarteEnabled", "eduarteUsername", "eduartePassword",
    "eduarteAutosubmit", "eduarteModernNav", "eduarteAnimations", "eduarteFloatingCards",
    "eduarteStartEnabled", "eduarteWeatherEnabled", "eduarteWeatherCity", "eduarteGreetingEnabled",
    "eduarteShortcutsEnabled", "eduarteNotesEnabled", "eduarteQuoteEnabled", "eduarteAnimationSpeed",
    "eduarteGradesEnabled", "eduarteGradeMinimum", "eduarteGradeMaximum", "eduartePassThreshold",
    "eduarteShortcutKeysEnabled", "eduarteShortcuts",
  ], (data) => {
    activePresetKey = data.eduarteThemePreset || "dark";
    const preset = presets[activePresetKey] || presets.dark;
    const colors = data.eduarteCustomColors || {};
    
    elements.darkmode.checked = data.eduarteDarkMode !== undefined ? !!data.eduarteDarkMode : preset.dark;
    elements.accent.value = data.eduarteAccentColor || preset.accent;
    elements.modernstyle.checked = data.eduarteModernStyle !== false;
    elements.humantheme.checked = !!data.eduarteHumanTheme;
    elements.wallpaperUrl.value = data.eduarteWallpaperUrl || "";
    elements.wallpaperBlur.value = data.eduarteWallpaperBlur ?? 12;
    elements.wallpaperOverlay.value = data.eduarteWallpaperOverlay ?? 55;
    elements.font.value = data.eduarteFont || "default";
    elements.customenabled.checked = !!data.eduarteCustomTheme;
    elements.customBg.value = colors.bg || preset.bg;
    elements.customSurface.value = colors.surface || preset.surface;
    elements.customText.value = colors.text || preset.text;
    elements.customBorder.value = colors.border || preset.border;

    document.querySelectorAll(".preset").forEach((item) => {
      if (item.dataset.preset === activePresetKey && !data.eduarteCustomTheme) {
        item.classList.add("selected");
      } else {
        item.classList.remove("selected");
      }
    });

    elements.enabled.checked = data.eduarteEnabled !== false;
    elements.username.value = data.eduarteUsername || "";
    elements.password.value = data.eduartePassword || "";
    elements.autosubmit.checked = !!data.eduarteAutosubmit;

    elements.modernnav.checked = data.eduarteModernNav !== false;
    elements.animations.checked = data.eduarteAnimations !== false;
    elements.floatingcards.checked = data.eduarteFloatingCards !== false;

    elements.startEnabled.checked = data.eduarteStartEnabled !== false;
    elements.weatherEnabled.checked = data.eduarteWeatherEnabled !== false;
    elements.weatherCity.value = data.eduarteWeatherCity || "";
    elements.greetingEnabled.checked = data.eduarteGreetingEnabled !== false;
    elements.shortcutsEnabled.checked = data.eduarteShortcutsEnabled !== false;
    elements.pomodoroEnabled.checked = data.eduartePomodoroEnabled !== false;
    elements.quickCalcEnabled.checked = data.eduarteQuickCalcEnabled !== false;
    elements.quoteEnabled.checked = data.eduarteQuoteEnabled !== false;
    elements.animationSpeed.value = data.eduarteAnimationSpeed ?? 60;

    elements.gradesEnabled.checked = data.eduarteGradesEnabled !== false;
    elements.gradeMin.value = data.eduarteGradeMinimum ?? 1;
    elements.gradeMax.value = data.eduarteGradeMaximum ?? 10;
    elements.passThreshold.value = data.eduartePassThreshold ?? 5.5;

    elements.shortcutKeysEnabled.checked = data.eduarteShortcutKeysEnabled !== false;
    currentShortcuts = data.eduarteShortcuts || { ...DEFAULT_SHORTCUTS };
    document.querySelectorAll(".shortcut-input").forEach((inp) => {
      const page = inp.dataset.page;
      inp.value = currentShortcuts[page] ? formatShortcutLabel(currentShortcuts[page]) : "";
    });

    ["gradeMin", "gradeMax", "passThreshold", "wallpaperBlur", "wallpaperOverlay"].forEach((id) => elements[id]?.dispatchEvent(new Event("input")));
  });
}

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.local.set({
    eduarteThemePreset: activePresetKey,
    eduarteDarkMode: elements.darkmode.checked,
    eduarteAccentColor: elements.accent.value,
    eduarteModernStyle: elements.modernstyle.checked,
    eduarteHumanTheme: elements.humantheme.checked,
    eduarteWallpaperUrl: elements.wallpaperUrl.value.trim(),
    eduarteWallpaperBlur: Number(elements.wallpaperBlur.value),
    eduarteWallpaperOverlay: Number(elements.wallpaperOverlay.value),
    eduarteFont: elements.font.value,
    eduarteCustomTheme: elements.customenabled.checked,
    eduarteCustomColors: {
      bg: elements.customBg.value,
      surface: elements.customSurface.value,
      text: elements.customText.value,
      border: elements.customBorder.value,
    },
    eduarteEnabled: elements.enabled.checked,
    eduarteUsername: elements.username.value.trim(),
    eduartePassword: elements.password.value,
    eduarteAutosubmit: elements.autosubmit.checked,
    eduarteModernNav: elements.modernnav.checked,
    eduarteAnimations: elements.animations.checked,
    eduarteFloatingCards: elements.floatingcards.checked,
    eduarteStartEnabled: elements.startEnabled.checked,
    eduarteWeatherEnabled: elements.weatherEnabled.checked,
    eduarteWeatherCity: elements.weatherCity.value.trim(),
    eduarteGreetingEnabled: elements.greetingEnabled.checked,
    eduarteShortcutsEnabled: elements.shortcutsEnabled.checked,
    eduartePomodoroEnabled: elements.pomodoroEnabled.checked,
    eduarteQuickCalcEnabled: elements.quickCalcEnabled.checked,
    eduarteQuoteEnabled: elements.quoteEnabled.checked,
    eduarteAnimationSpeed: Number(elements.animationSpeed.value),
    eduarteGradesEnabled: elements.gradesEnabled.checked,
    eduarteGradeMinimum: Number(elements.gradeMin.value),
    eduarteGradeMaximum: Number(elements.gradeMax.value),
    eduartePassThreshold: Number(elements.passThreshold.value),
    eduarteShortcutKeysEnabled: elements.shortcutKeysEnabled.checked,
    eduarteShortcuts: currentShortcuts,
  }, () => {
    const button = document.getElementById("save");
    button.textContent = "Opgeslagen ✓";
    button.classList.add("saved");
    setTimeout(() => { button.textContent = "Opslaan"; button.classList.remove("saved"); }, 1400);
  });
});

load();

