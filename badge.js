// Eduarte Tools - badge.js
// Zoekt naar bestaande "ongelezen/nieuw"-tellers in Eduarte's eigen
// header/navigatie (bijv. bij Berichten) en stuurt het totaal door naar
// background.js, dat dit als badge-cijfer op het extensie-icoon toont.
// Werkt "best effort": als Eduarte geen tellers toont (afhankelijk van
// schoolomgeving), blijft de badge gewoon leeg.
// De pure telllogica staat in badge-logic.js (getest via Vitest), dat als
// apart content-script vóór dit bestand wordt geladen.

(function () {
  if (location.hostname === "login.microsoftonline.com") return;

  let lastSent = -1;
  let scanTimer = null;

  function scan() {
    const elements = document.querySelectorAll(BADGE_SCAN_SELECTOR);
    const total = sumBadgeCounts(elements);
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
