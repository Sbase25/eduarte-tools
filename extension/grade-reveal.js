// Eduarte Tools - grade-reveal.js
// Nieuwe cijfers blijven op Resultaten verborgen tot je ze met een pack onthult.
// Wat je al eens gezien hebt blijft gewoon zichtbaar: de eerste keer geldt alles
// wat er staat als "al gezien". Uit te zetten bij Instellingen > Cijfers.
// Draait vanaf document_start zodat een nieuw cijfer niet even zichtbaar is.

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.EduarteGradeReveal = api;
    if (root.document && root.chrome?.storage?.local) api.start(root);
  }
})(globalThis, function () {
  const MAX_KEYS = 800;
  const HIDE_KEY = "eduarteHidePackGrades";
  const REVEALED_KEY = "eduarteRevealedGrades";
  const CACHE_KEY = "eduarteToolsHideGrades"; // localStorage: direct leesbaar bij het laden
  const TABLES = ":is(.result-overview--grades, .container-card table, table[id^='id'])";

  // Zelfde sleutel als de packpagina gebruikt (popup-app/src/pack-cards.js)
  function gradeKey(grade) {
    return `${String(grade?.title ?? "").trim()}|${Number(grade?.result)}`;
  }

  function splitGrades(grades, revealed) {
    const seen = new Set(revealed || []);
    const hidden = [];
    const visible = [];
    (grades || []).forEach((grade) => (seen.has(gradeKey(grade)) ? visible : hidden).push(grade));
    return { hidden, visible };
  }

  function addRevealed(revealed, keys) {
    const merged = [...new Set([...(Array.isArray(revealed) ? revealed : []), ...keys])];
    return merged.slice(Math.max(0, merged.length - MAX_KEYS));
  }

  function isResultsPath(pathname) {
    return /resultaten|cijfers/i.test(String(pathname || ""));
  }

  function start(win) {
    const doc = win.document;
    const chrome = win.chrome;
    if (win.top !== win || !isResultsPath(win.location.pathname)) return;

    const html = doc.documentElement;
    let enabled = true;
    try { enabled = win.localStorage.getItem(CACHE_KEY) !== "0"; } catch { /* geen opslag */ }
    let revealed; // undefined = nog niet geladen, null = nog nooit opgeslagen
    let loaded = false;
    let busy = false;

    const style = doc.createElement("style");
    style.id = "eduarte-tools-grade-reveal";
    style.textContent = `
      /* Tot de cijfers zijn nagekeken blijven de cellen even leeg */
      html[data-et-grades="wacht"] ${TABLES} tbody td { opacity: 0 !important; }
      .et-grade-hidden { position: relative !important; color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; cursor: pointer !important; user-select: none !important; }
      .et-grade-hidden > * { visibility: hidden !important; }
      .et-grade-hidden::after {
        content: "?"; position: absolute; inset: 3px; display: grid; place-items: center; min-width: 30px;
        border-radius: 10px; color: var(--color-text-primary, #fff); -webkit-text-fill-color: var(--color-text-primary, #fff); font-weight: 800; font-size: 14px;
        background: linear-gradient(110deg, color-mix(in srgb, var(--color-bg-fill-action, #3b82f6) 26%, transparent) 35%, color-mix(in srgb, var(--color-bg-fill-action, #3b82f6) 52%, transparent) 50%, color-mix(in srgb, var(--color-bg-fill-action, #3b82f6) 26%, transparent) 65%);
        background-size: 250% 100%; animation: et-grade-shine 2.4s linear infinite;
      }
      @keyframes et-grade-shine { from { background-position: 120% 0; } to { background-position: -120% 0; } }
      html[data-et-grades="verborgen"] #eduarte-tools-overlay { display: none !important; }
      #eduarte-tools-grade-banner {
        position: fixed; z-index: 2147482000; left: 50%; bottom: 22px; transform: translateX(-50%);
        display: flex; align-items: center; gap: 12px; max-width: calc(100vw - 24px); box-sizing: border-box; padding: 10px 10px 10px 18px;
        border: 1px solid color-mix(in srgb, var(--color-text-primary, #fff) 9%, transparent); border-radius: 999px;
        background: color-mix(in srgb, var(--color-bg-surface, #1f2937) 96%, var(--color-text-primary, #fff) 4%); color: var(--color-text-primary, #fff);
        box-shadow: 0 18px 44px rgba(0,0,0,.34), 0 2px 8px rgba(0,0,0,.18); font: 600 14px/1.3 system-ui, sans-serif;
        animation: et-grade-banner .45s cubic-bezier(.34, 1.4, .64, 1);
      }
      #eduarte-tools-grade-banner span { min-width: 0; }
      #eduarte-tools-grade-banner small { display: block; opacity: .7; font-weight: 500; font-size: 12px; }
      #eduarte-tools-grade-banner button { flex: none; height: 38px; padding: 0 16px; border: 0; border-radius: 999px; font: inherit; font-size: 13px; cursor: pointer; }
      #eduarte-tools-grade-banner .et-open { background: var(--color-bg-fill-action, #3b82f6); color: #fff; font-weight: 700; }
      #eduarte-tools-grade-banner .et-show { background: color-mix(in srgb, var(--color-text-primary, #fff) 10%, transparent); color: inherit; }
      #eduarte-tools-grade-banner button:focus-visible { outline: 2px solid var(--color-text-primary, #fff); outline-offset: 2px; }
      @keyframes et-grade-banner { from { opacity: 0; transform: translate(-50%, 24px); } }
      @media (max-width: 640px) {
        #eduarte-tools-grade-banner { flex-wrap: wrap; justify-content: flex-end; bottom: 12px; width: calc(100vw - 24px); padding: 14px; border-radius: 24px; }
        #eduarte-tools-grade-banner span { flex: 1 1 100%; }
      }
      @media (prefers-reduced-motion: reduce) { .et-grade-hidden::after, #eduarte-tools-grade-banner { animation: none; } }
    `;
    (doc.head || html).append(style);
    if (enabled) html.dataset.etGrades = "wacht";
    // Vangnet: gaat er iets mis, dan blijven de cijfers niet onzichtbaar
    win.setTimeout(() => { if (html.dataset.etGrades === "wacht") delete html.dataset.etGrades; }, 5000);

    const openPack = () => chrome.runtime.sendMessage({ type: "OPEN_EDUARTE_TOOLS_PAGE", page: "packs" }, () => void chrome.runtime.lastError);
    const saveRevealed = (keys) => {
      revealed = addRevealed(revealed, keys);
      chrome.storage.local.set({ [REVEALED_KEY]: revealed });
    };

    const banner = doc.createElement("div");
    banner.id = "eduarte-tools-grade-banner";
    banner.setAttribute("role", "status");
    banner.innerHTML = `<span>Er staan nieuwe cijfers klaar<small>Open een pack om ze te onthullen.</small></span>
      <button type="button" class="et-show">Toch tonen</button><button type="button" class="et-open">Pack openen</button>`;
    banner.querySelector(".et-open").addEventListener("click", openPack);
    banner.querySelector(".et-show").addEventListener("click", () => {
      const grades = win.EduarteApi ? win.EduarteApi.getGrades(doc) : [];
      saveRevealed(grades.map(gradeKey));
      apply();
    });
    doc.addEventListener("click", (event) => {
      const cell = event.target instanceof win.Element && event.target.closest(".et-grade-hidden");
      if (!cell) return;
      event.preventDefault();
      event.stopPropagation();
      openPack();
    }, true);

    function clear() {
      doc.querySelectorAll(".et-grade-hidden").forEach((cell) => cell.classList.remove("et-grade-hidden"));
      banner.remove();
      delete html.dataset.etGrades;
    }

    function apply() {
      if (busy || !loaded) return;
      if (!enabled) return clear();
      if (!win.EduarteApi || !doc.body) return;
      busy = true;
      try {
        const grades = win.EduarteApi.getGrades(doc);
        // Eerste keer: alles wat er nu staat heb je al gezien
        if (!grades.length) {
          // Nog niets om te verbergen; de tabel mag gewoon zichtbaar zijn
          banner.remove();
          delete html.dataset.etGrades;
          return;
        }
        if (revealed === null) saveRevealed(grades.map(gradeKey));
        const { hidden } = splitGrades(grades, revealed);
        const cells = new Set(hidden.map((grade) => grade.element));
        doc.querySelectorAll(".et-grade-hidden").forEach((cell) => { if (!cells.has(cell)) cell.classList.remove("et-grade-hidden"); });
        cells.forEach((cell) => cell.classList.add("et-grade-hidden"));
        if (cells.size) {
          html.dataset.etGrades = "verborgen";
          if (!banner.isConnected) doc.body.append(banner);
        } else {
          banner.remove();
          delete html.dataset.etGrades;
        }
      } finally {
        busy = false;
      }
    }

    chrome.storage.local.get([HIDE_KEY, REVEALED_KEY], (data) => {
      if (chrome.runtime.lastError) { loaded = true; enabled = false; return clear(); }
      enabled = data?.[HIDE_KEY] !== false;
      try { win.localStorage.setItem(CACHE_KEY, enabled ? "1" : "0"); } catch { /* geen opslag */ }
      revealed = Array.isArray(data?.[REVEALED_KEY]) ? data[REVEALED_KEY] : null;
      loaded = true;
      apply();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes[HIDE_KEY]) {
        enabled = changes[HIDE_KEY].newValue !== false;
        try { win.localStorage.setItem(CACHE_KEY, enabled ? "1" : "0"); } catch { /* geen opslag */ }
      }
      if (changes[REVEALED_KEY] && Array.isArray(changes[REVEALED_KEY].newValue)) revealed = changes[REVEALED_KEY].newValue;
      if (changes[HIDE_KEY] || changes[REVEALED_KEY]) apply();
    });

    // Eduarte laadt cijfers soms na: bij elke wijziging opnieuw nakijken, vóór het scherm tekent
    new win.MutationObserver(apply).observe(html, { childList: true, subtree: true, characterData: true });
    doc.addEventListener("DOMContentLoaded", apply);
    win.addEventListener("load", apply);
    let tries = 0;
    const timer = win.setInterval(() => { apply(); if (win.EduarteApi || ++tries > 40) win.clearInterval(timer); }, 150);
  }

  return { gradeKey, splitGrades, addRevealed, isResultsPath, start, HIDE_KEY, REVEALED_KEY };
});
