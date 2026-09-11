const ids = [
  "darkmode", "modernstyle", "humantheme", "accent", "customenabled", "customBg", "customSurface", "customText", "customBorder",
  "enabled", "username", "password", "autosubmit", "modernnav", "animations",
  "floatingcards", "startEnabled", "animationSpeed", "gradesEnabled", "gradeMin",
  "gradeMax", "passThreshold",
];
const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
const titles = { theme: "Thema", login: "Inloggen", sidebar: "Menubalk", start: "Start", grades: "Cijfers", elo: "ELO", about: "Over" };
const presets = {
  dark: { dark: true, accent: "#2563eb", bg: "#15171b", surface: "#1f2328" },
  blue: { dark: true, accent: "#60a5fa", bg: "#0b1b2d", surface: "#12304a" },
  purple: { dark: true, accent: "#c084fc", bg: "#1c102b", surface: "#302047" },
  light: { dark: false, accent: "#2563eb", bg: "#f4f7fb", surface: "#ffffff" },
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

function updateRange(id, outputId) {
  elements[id].addEventListener("input", () => {
    document.getElementById(outputId).textContent = Number(elements[id].value).toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  });
}
updateRange("gradeMin", "gradeMinValue");
updateRange("gradeMax", "gradeMaxValue");
updateRange("passThreshold", "passThresholdValue");

document.querySelectorAll(".preset").forEach((button) => {
  button.addEventListener("click", () => {
    const preset = presets[button.dataset.preset];
    elements.darkmode.checked = preset.dark;
    elements.accent.value = preset.accent;
    elements.customBg.value = preset.bg;
    elements.customSurface.value = preset.surface;
    document.querySelectorAll(".preset").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
  });
});

function load() {
  chrome.storage.local.get([
    "eduarteDarkMode", "eduarteAccentColor", "eduarteModernStyle", "eduarteHumanTheme",
    "eduarteCustomTheme", "eduarteCustomColors", "eduarteEnabled", "eduarteUsername", "eduartePassword",
    "eduarteAutosubmit", "eduarteModernNav", "eduarteAnimations", "eduarteFloatingCards",
    "eduarteStartEnabled", "eduarteAnimationSpeed", "eduarteGradesEnabled",
    "eduarteGradeMinimum", "eduarteGradeMaximum", "eduartePassThreshold",
  ], (data) => {
    const colors = data.eduarteCustomColors || {};
    elements.darkmode.checked = !!data.eduarteDarkMode;
    elements.accent.value = data.eduarteAccentColor || "#2563eb";
    elements.modernstyle.checked = data.eduarteModernStyle !== false;
    elements.humantheme.checked = !!data.eduarteHumanTheme;
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
    elements.animationSpeed.value = data.eduarteAnimationSpeed ?? 60;
    elements.gradesEnabled.checked = data.eduarteGradesEnabled !== false;
    elements.gradeMin.value = data.eduarteGradeMinimum ?? 1;
    elements.gradeMax.value = data.eduarteGradeMaximum ?? 10;
    elements.passThreshold.value = data.eduartePassThreshold ?? 5.5;
    ["gradeMin", "gradeMax", "passThreshold"].forEach((id) => elements[id].dispatchEvent(new Event("input")));
  });
}

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.local.set({
    eduarteDarkMode: elements.darkmode.checked,
    eduarteAccentColor: elements.accent.value,
    eduarteModernStyle: elements.modernstyle.checked,
    eduarteHumanTheme: elements.humantheme.checked,
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
