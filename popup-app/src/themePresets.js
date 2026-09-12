export const presets = [
  { key: "dark", name: "Donker", dark: true, accent: "#3b82f6", bg: "#111827", surface: "#1f2937", text: "#f9fafb", border: "#374151" },
  { key: "blue", name: "Blauw", dark: true, accent: "#38bdf8", bg: "#0b192c", surface: "#13253f", text: "#f0f9ff", border: "#1e3a5f" },
  { key: "purple", name: "Paars", dark: true, accent: "#c084fc", bg: "#130e24", surface: "#20163b", text: "#faf5ff", border: "#3b2d64" },
  { key: "emerald", name: "Smaragd", dark: true, accent: "#34d399", bg: "#062319", surface: "#0b3829", text: "#ecfdf5", border: "#14533d" },
  { key: "sunset", name: "Sunset", dark: true, accent: "#fb923c", bg: "#1c0f0a", surface: "#2e1810", text: "#fff7ed", border: "#542d1f" },
  { key: "oled", name: "OLED Zwart", dark: true, accent: "#38bdf8", bg: "#000000", surface: "#09090b", text: "#ffffff", border: "#27272a" },
  { key: "nord", name: "Nord", dark: true, accent: "#88c0d0", bg: "#242933", surface: "#2e3440", text: "#eceff4", border: "#434c5e" },
  { key: "cyberpunk", name: "Cyberpunk", dark: true, accent: "#f43f5e", bg: "#090717", surface: "#140e2b", text: "#fdf4ff", border: "#2e1c59" },
  { key: "light", name: "Licht", dark: false, accent: "#2563eb", bg: "#f8fafc", surface: "#ffffff", text: "#0f172a", border: "#e2e8f0" },
];

export const accentSwatches = ["#2563eb", "#10b981", "#f97316", "#ec4899", "#a855f7", "#38bdf8", "#f43f5e"];

export function findPreset(key) {
  return presets.find((p) => p.key === key) || presets[0];
}
