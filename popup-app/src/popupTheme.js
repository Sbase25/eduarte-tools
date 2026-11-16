import { findPreset } from "./themePresets.js";

/**
 * Laat het instellingenvenster de kleuren van het gekozen Eduarte-thema volgen
 * (voorinstelling, eigen kleuren en accentkleur), net als het portaal zelf.
 */
const KEYS = ["eduarteThemePreset", "eduarteAccentColor", "eduarteCustomTheme", "eduarteCustomColors"];
const HEX = /^#[0-9a-f]{6}$/i;

export function resolveTheme(data = {}) {
  const preset = findPreset(data.eduarteThemePreset || "dark");
  const custom = data.eduarteCustomColors;
  const useCustom = Boolean(data.eduarteCustomTheme && custom && HEX.test(custom.bg || ""));
  const pick = (key) => (useCustom && HEX.test(custom[key] || "") ? custom[key] : preset[key]);
  const bg = pick("bg");
  // Licht of donker volgt uit de achtergrond, zodat eigen kleuren ook kloppen
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
  const dark = useCustom ? (r * 299 + g * 587 + b * 114) / 1000 < 140 : preset.dark;
  return {
    dark,
    bg,
    surface: pick("surface"),
    text: pick("text"),
    border: pick("border"),
    accent: HEX.test(data.eduarteAccentColor || "") ? data.eduarteAccentColor : preset.accent,
  };
}

export function themeVariables({ dark, bg, surface, text, border, accent }) {
  const mix = (a, pct, b) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;
  return {
    "--color-surface": bg,
    "--color-surface-container-lowest": mix(bg, 88, dark ? "#000" : text),
    "--color-surface-container-low": mix(bg, 50, surface),
    "--color-surface-container": surface,
    "--color-surface-container-high": mix(surface, 93, text),
    "--color-surface-container-highest": mix(surface, 87, text),
    "--color-surface-variant": mix(surface, 80, text),
    "--color-on-surface": text,
    "--color-on-surface-variant": mix(text, 72, surface),
    "--color-outline": mix(text, 48, surface),
    "--color-outline-variant": border,
    "--color-primary": dark ? mix(accent, 78, "#fff") : accent,
    "--color-on-primary": dark ? mix(accent, 22, "#000") : "#fff",
    "--color-primary-container": mix(accent, dark ? 34 : 20, surface),
    "--color-on-primary-container": text,
    "--color-secondary": mix(accent, 55, text),
    "--color-on-secondary": dark ? mix(accent, 22, "#000") : "#fff",
    "--color-secondary-container": mix(accent, dark ? 22 : 14, surface),
    "--color-on-secondary-container": text,
  };
}

export function applyPopupTheme(data, root = document.documentElement) {
  const theme = resolveTheme(data);
  root.dataset.theme = theme.dark ? "dark" : "light";
  root.style.colorScheme = theme.dark ? "dark" : "light";
  for (const [name, value] of Object.entries(themeVariables(theme))) root.style.setProperty(name, value);
}

export function followPortalTheme() {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return;
  let current = {};
  chrome.storage.local.get(KEYS, (data) => {
    if (chrome.runtime.lastError) return;
    current = data || {};
    applyPopupTheme(current);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !KEYS.some((key) => changes[key])) return;
    for (const key of KEYS) if (changes[key]) current[key] = changes[key].newValue;
    applyPopupTheme(current);
  });
}
