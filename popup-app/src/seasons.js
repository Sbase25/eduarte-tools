// Seizoensthema's voor de Team-pagina (alleen kleuren, geen externe bestanden).
export const SEASONS = {
  autumn: { name: "Herfst", hue: 28, emoji: "🍂" },
  winter: { name: "Winter", hue: 205, emoji: "❄️" },
  spring: { name: "Lente", hue: 140, emoji: "🌱" },
  summer: { name: "Zomer", hue: 48, emoji: "☀️" },
  halloween: { name: "Halloween", hue: 275, emoji: "🎃" },
  sinterklaas: { name: "Sinterklaas", hue: 5, emoji: "🎁" },
};

export function seasonFor(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 10 && day >= 24) || (month === 11 && day <= 1)) return "halloween";
  if ((month === 11 && day >= 12) || (month === 12 && day <= 5)) return "sinterklaas";
  if (month === 12 || month <= 2) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}
