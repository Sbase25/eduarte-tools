// Eduarte Tools - badge.js
// Zoekt naar bestaande "ongelezen/nieuw"-tellers in Eduarte's eigen
// header/navigatie (bijv. bij Berichten) en stuurt het totaal door naar
// background.js, dat dit als badge-cijfer op het extensie-icoon toont.
// Werkt "best effort": als Eduarte geen tellers toont (afhankelijk van
// schoolomgeving), blijft de badge gewoon leeg.

(function () {
  if (location.hostname === "login.microsoftonline.com") return;

  const SCAN_SELECTOR = [
    "header [class*='badge']",
    "header [class*='counter']",
    "header [class*='notification']",
    "nav [class*='badge']",
    "nav [class*='counter']",
    "nav [class*='notification']",
    "[aria-label*='ongelezen' i]",
    "[aria-label*='unread' i]",
  ].join(", ");

  let lastSent = -1;
  let scanTimer = null;

  function extractCount(el) {
    const text = (el.textContent || "").trim();
    if (/^\d{1,3}$/.test(text)) return Number(text);
    const label = el.getAttribute("aria-label") || "";
    const match = label.match(/\d{1,3}/);
    return match ? Number(match[0]) : 0;
  }

  function scan() {
    let total = 0;
    document.querySelectorAll(SCAN_SELECTOR).forEach((el) => {
      total += extractCount(el);
    });
    if (total !== lastSent) {
      lastSent = total;
      chrome.runtime.sendMessage({ type: "EDUARTE_BADGE_COUNT", count: total });
    }
  }

  function scheduleScan() {
    if (scanTimer) return;
    scanTimer = setTimeout(() => {
      scanTimer = null;
      scan();
    }, 400);
  }

  chrome.storage.local.get(["eduarteBadgeEnabled"], (data) => {
    if (data.eduarteBadgeEnabled === false) return;

    scan();
    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    setTimeout(() => observer.disconnect(), 60000);
  });
})();
