// Eduarte Tools - badge-logic.js
// Pure, testbare logica voor de meldingen-badge (los van chrome.* APIs en
// het DOM-event-model), zodat dit met Vitest getest kan worden. Wordt in de
// browser als los content-script vóór badge.js geladen (zelfde isolated
// world, dus de top-level functies/consts zijn daar gewoon beschikbaar),
// en in Node.js/tests via module.exports geïmporteerd.

var BADGE_SCAN_SELECTOR = [
  "header [class*='badge']",
  "header [class*='counter']",
  "header [class*='notification']",
  "nav [class*='badge']",
  "nav [class*='counter']",
  "nav [class*='notification']",
  "[aria-label*='ongelezen' i]",
  "[aria-label*='unread' i]",
].join(", ");

// Haalt een aantal (0 t/m 999) uit een enkel badge-/counter-element.
// Geeft prioriteit aan zuiver-numerieke tekstinhoud (bijv. "3") om valse
// positieven zoals statuspillen ("Actief") te vermijden, en valt terug op
// een getal binnen het aria-label (bijv. "5 ongelezen berichten").
function extractBadgeCount(el) {
  const text = (el.textContent || "").trim();
  if (/^\d{1,3}$/.test(text)) return Number(text);
  const label = el.getAttribute ? el.getAttribute("aria-label") || "" : "";
  const match = label.match(/\d{1,3}/);
  return match ? Number(match[0]) : 0;
}

// Telt het totaal aantal meldingen op basis van een lijst DOM-elementen die
// al met BADGE_SCAN_SELECTOR zijn opgehaald.
function sumBadgeCounts(elements) {
  let total = 0;
  for (const el of elements) {
    total += extractBadgeCount(el);
  }
  return total;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BADGE_SCAN_SELECTOR, extractBadgeCount, sumBadgeCounts };
}
