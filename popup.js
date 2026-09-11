const ids = [
  "darkmode", "modernstyle", "humantheme", "accent", "wallpaperUrl", "wallpaperBlur", "wallpaperOverlay", "font",
  "customenabled", "customBg", "customSurface", "customText", "customBorder", "customCss",
  "enabled", "username", "password", "autosubmit", "modernnav", "animations",
  "floatingcards", "startEnabled", "weatherEnabled", "weatherCity", "greetingEnabled", "animationSpeed",
  "gradesEnabled", "gradeMin", "gradeMax", "passThreshold",
];
const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
const titles = { theme: "Thema", login: "Inloggen", sidebar: "Menubalk", start: "Start", grades: "Cijfers", elo: "ELO", about: "Over" };
const presets = {
  dark: { dark: true, accent: "#2563eb", bg: "#15171b", surface: "#1f2328", text: "#f4f4f6", border: "#545e6b" },
  blue: { dark: true, accent: "#60a5fa", bg: "#0b1b2d", surface: "#12304a", text: "#f0f8ff", border: "#274e76" },
  purple: { dark: true, accent: "#c084fc", bg: "#1c102b", surface: "#302047", text: "#faf5ff", border: "#593c82" },
  emerald: { dark: true, accent: "#10b981", bg: "#06281e", surface: "#0b3d2e", text: "#ecfdf5", border: "#1d6850" },
  sunset: { dark: true, accent: "#f97316", bg: "#241209", surface: "#3a1d12", text: "#fff7ed", border: "#6c3924" },
  oled: { dark: true, accent: "#38bdf8", bg: "#000000", surface: "#0d0d0f", text: "#ffffff", border: "#27272a" },
  nord: { dark: true, accent: "#88c0d0", bg: "#242933", surface: "#2e3440", text: "#eceff4", border: "#4c566a" },
  cyberpunk: { dark: true, accent: "#ec4899", bg: "#090a16", surface: "#13142e", text: "#f0f9ff", border: "#262957" },
  light: { dark: false, accent: "#2563eb", bg: "#f4f7fb", surface: "#ffffff", text: "#1e293b", border: "#cbd5e1" },
};

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
    const preset = presets[button.dataset.preset];
    if (!preset) return;
    elements.darkmode.checked = preset.dark;
    elements.accent.value = preset.accent;
    elements.customBg.value = preset.bg;
    elements.customSurface.value = preset.surface;
    elements.customText.value = preset.text;
    elements.customBorder.value = preset.border;
    document.querySelectorAll(".preset").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
  });
});

function load() {
  chrome.storage.local.get([
    "eduarteDarkMode", "eduarteAccentColor", "eduarteModernStyle", "eduarteHumanTheme",
    "eduarteWallpaperUrl", "eduarteWallpaperBlur", "eduarteWallpaperOverlay", "eduarteFont", "eduarteCustomCss",
    "eduarteCustomTheme", "eduarteCustomColors", "eduarteEnabled", "eduarteUsername", "eduartePassword",
    "eduarteAutosubmit", "eduarteModernNav", "eduarteAnimations", "eduarteFloatingCards",
    "eduarteStartEnabled", "eduarteWeatherEnabled", "eduarteWeatherCity", "eduarteGreetingEnabled", "eduarteAnimationSpeed",
    "eduarteGradesEnabled", "eduarteGradeMinimum", "eduarteGradeMaximum", "eduartePassThreshold",
  ], (data) => {
    const colors = data.eduarteCustomColors || {};
    elements.darkmode.checked = !!data.eduarteDarkMode;
    elements.accent.value = data.eduarteAccentColor || "#2563eb";
    elements.modernstyle.checked = data.eduarteModernStyle !== false;
    elements.humantheme.checked = !!data.eduarteHumanTheme;
    elements.wallpaperUrl.value = data.eduarteWallpaperUrl || "";
    elements.wallpaperBlur.value = data.eduarteWallpaperBlur ?? 12;
    elements.wallpaperOverlay.value = data.eduarteWallpaperOverlay ?? 55;
    elements.font.value = data.eduarteFont || "default";
    elements.customCss.value = data.eduarteCustomCss || "";
    elements.customenabled.checked = !!data.eduarteCustomTheme;
    elements.customBg.value = colors.bg || "#15171b";
    elements.customSurface.value = colors.surface || "#1f2328";
    elements.customText.value = colors.text || "#f4f4f6";
    elements.customBorder.value = colors.border || "#545e6b";

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
    elements.animationSpeed.value = data.eduarteAnimationSpeed ?? 60;

    elements.gradesEnabled.checked = data.eduarteGradesEnabled !== false;
    elements.gradeMin.value = data.eduarteGradeMinimum ?? 1;
    elements.gradeMax.value = data.eduarteGradeMaximum ?? 10;
    elements.passThreshold.value = data.eduartePassThreshold ?? 5.5;

    ["gradeMin", "gradeMax", "passThreshold", "wallpaperBlur", "wallpaperOverlay"].forEach((id) => elements[id]?.dispatchEvent(new Event("input")));
  });
}

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.local.set({
    eduarteDarkMode: elements.darkmode.checked,
    eduarteAccentColor: elements.accent.value,
    eduarteModernStyle: elements.modernstyle.checked,
    eduarteHumanTheme: elements.humantheme.checked,
    eduarteWallpaperUrl: elements.wallpaperUrl.value.trim(),
    eduarteWallpaperBlur: Number(elements.wallpaperBlur.value),
    eduarteWallpaperOverlay: Number(elements.wallpaperOverlay.value),
    eduarteFont: elements.font.value,
    eduarteCustomCss: elements.customCss.value.trim(),
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
    eduarteAnimationSpeed: Number(elements.animationSpeed.value),
    eduarteGradesEnabled: elements.gradesEnabled.checked,
    eduarteGradeMinimum: Number(elements.gradeMin.value),
    eduarteGradeMaximum: Number(elements.gradeMax.value),
    eduartePassThreshold: Number(elements.passThreshold.value),
  }, () => {
    const button = document.getElementById("save");
    button.textContent = "Opgeslagen ✓";
    button.classList.add("saved");
    setTimeout(() => { button.textContent = "Opslaan"; button.classList.remove("saved"); }, 1400);
  });
});

load();

