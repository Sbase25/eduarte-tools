(function () {
  if (location.hostname === "login.microsoftonline.com") return;
  if (globalThis.EduarteApi && chrome.runtime?.onMessage) {
    const isResultsPage = () => Boolean(
      document.querySelector(".result-overview--grades, #id-grades")
      || /resultaten|cijfers/i.test(location.pathname)
    );
    const toPackGrades = (grades) => grades.map(
      ({ id, result, weight, hasWeight, title }) => ({ id, result, weight, hasWeight, title })
    );
    const readPackGrades = () => isResultsPage()
      ? toPackGrades(globalThis.EduarteApi.getGrades(document))
      : [];

    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request?.type !== "GET_EDUARTE_GRADES") return;
      sendResponse({ grades: readPackGrades() });
    });

    const cachePackGrades = (grades) => {
      if (!grades.length) return;
      chrome.runtime.sendMessage({ type: "CACHE_EDUARTE_GRADES", grades }, (response) => {
        const error = chrome.runtime.lastError;
        if (error) console.warn("Eduarte Tools kon de cijfersessie niet bijwerken.", error.message);
        else if (!response?.success) console.warn("Eduarte Tools kon de cijfersessie niet bijwerken.", response?.error);
      });
    };
    const initialGrades = readPackGrades();
    let previousGrades = JSON.stringify(initialGrades);
    if (initialGrades.length) cachePackGrades(initialGrades);
    if (isResultsPage()) {
      globalThis.EduarteApi.watchGrades(document, (grades) => {
        if (!grades.length) return;
        const packGrades = toPackGrades(grades);
        const signature = JSON.stringify(packGrades);
        if (signature === previousGrades) return;
        previousGrades = signature;
        cachePackGrades(packGrades);
      });
    }
  }

  // Material 3 Expressive: een veer die een klein beetje doorschiet (cubic-bezier als terugval)
  // en de geschulpte cirkel ("cookie") uit de vormenbibliotheek, als clip-path.
  const SPRING_FALLBACK = "cubic-bezier(.34, 1.45, .64, 1)";
  const SPRING = "linear(0, .13 6.2%, .397 12.5%, .671 18.8%, .885 25%, 1.019 31.2%, 1.082 37.5%, 1.094 43.8%, 1.079 50%, 1.052 56.2%, 1.027 62.5%, 1.008 68.8%, .997 75%, .992 81.2%, .993 93.8%, 1)";
  const springVars = (selector) => `
    ${selector} { --et-spring: ${SPRING_FALLBACK}; }
    @supports (transition-timing-function: linear(0, 1)) { ${selector} { --et-spring: ${SPRING}; } }`;

  function scallopedShape(lobes = 12, depth = 0.055, steps = 120) {
    const points = [];
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const radius = 50 * (1 - depth + depth * Math.cos(lobes * angle));
      points.push(`${(50 + radius * Math.cos(angle)).toFixed(1)}% ${(50 + radius * Math.sin(angle)).toFixed(1)}%`);
    }
    return `polygon(${points.join(", ")})`;
  }

  const WEATHER_CODES = {
    0: { text: "Zonnig / Helder", icon: "☀️", iconNight: "🌙" },
    1: { text: "Overwegend zonnig", icon: "🌤️", iconNight: "🌙" },
    2: { text: "Half bewolkt", icon: "⛅", iconNight: "☁️" },
    3: { text: "Geheel bewolkt", icon: "☁️", iconNight: "☁️" },
    45: { text: "Mist", icon: "🌫️", iconNight: "🌫️" },
    48: { text: "Rijpmist", icon: "🌫️", iconNight: "🌫️" },
    51: { text: "Lichte motregen", icon: "🌦️", iconNight: "🌧️" },
    53: { text: "Matige motregen", icon: "🌦️", iconNight: "🌧️" },
    55: { text: "Dichte motregen", icon: "🌧️", iconNight: "🌧️" },
    61: { text: "Lichte regen", icon: "🌧️", iconNight: "🌧️" },
    63: { text: "Regen", icon: "🌧️", iconNight: "🌧️" },
    65: { text: "Zware regen", icon: "🌧️", iconNight: "🌧️" },
    71: { text: "Lichte sneeuwval", icon: "🌨️", iconNight: "🌨️" },
    73: { text: "Sneeuw", icon: "🌨️", iconNight: "🌨️" },
    75: { text: "Zware sneeuw", icon: "❄️", iconNight: "❄️" },
    80: { text: "Lichte bui", icon: "🌦️", iconNight: "🌧️" },
    81: { text: "Regenbui", icon: "🌧️", iconNight: "🌧️" },
    82: { text: "Zware regenbui", icon: "⛈️", iconNight: "⛈️" },
    95: { text: "Onweersbui", icon: "⛈️", iconNight: "⛈️" },
    96: { text: "Onweer met lichte hagel", icon: "⛈️", iconNight: "⛈️" },
    99: { text: "Zwaar onweer met hagel", icon: "⛈️", iconNight: "⛈️" },
  };

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return { text: "Goedemorgen", icon: "☀️" };
    if (hour >= 12 && hour < 18) return { text: "Goedemiddag", icon: "🌤️" };
    if (hour >= 18 && hour < 23) return { text: "Goedenavond", icon: "🌙" };
    return { text: "Goedenacht", icon: "✨" };
  }

  // Lijn-iconen (Lucide-stijl) voor de startpagina
  const ICONS = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    sunrise: '<path d="M12 2v8M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M8 6l4-4 4 4M16 18a4 4 0 0 0-8 0"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    rain: '<path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24"/><path d="M16 14v6M8 14v6M12 16v6"/>',
    snow: '<path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24"/><path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01"/>',
    bolt: '<path d="M6 16.33A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.97"/><path d="m13 12-3 5h4l-3 5"/>',
    fog: '<path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24"/><path d="M16 17H7M17 21H9"/>',
    drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5 12 2c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  };

  function icon(name) {
    return `<svg class="et-i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  // Lijn-icoon bij een Open-Meteo weercode, zodat het weer bij de rest van de iconen past
  function weatherIconName(code, isDay) {
    if (code <= 1) return isDay ? "sun" : "moon";
    if (code <= 3) return "cloud";
    if (code <= 48) return "fog";
    if (code >= 71 && code <= 77) return "snow";
    if (code === 82 || code >= 95) return "bolt";
    return "rain";
  }

  // "over 45 min", "over 8u 48m", "over 2 dagen"
  function formatCountdown(minutes) {
    const m = Math.max(0, Math.round(minutes));
    if (m < 1) return "nu";
    if (m < 60) return `over ${m} min`;
    if (m < 24 * 60) return `over ${Math.floor(m / 60)}u ${String(m % 60).padStart(2, "0")}m`;
    const days = Math.round(m / (24 * 60));
    return `over ${days} ${days === 1 ? "dag" : "dagen"}`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  // Leest wat Eduarte zelf op de startpagina zet: begroeting, huidige les, "vrij over …" en "morgen begin je om …"
  function readNativeNow(wrapper) {
    const scope = wrapper.closest(".now--wrapper") || wrapper;
    const heading = Array.from(scope.querySelectorAll(":scope > h1, :scope > h2"))
      .find((el) => /^Goede(morgen|middag|navond|nacht)\s+\S/i.test(el.textContent.trim()));
    const items = Array.from(scope.querySelectorAll(":scope > ul:not(.d-none) > li"));
    const lessonItem = items.find((li) => li.querySelector(".now--body.is-now h4, h4"));
    let lesson = null;
    if (lessonItem) {
      const h4 = lessonItem.querySelector("h4");
      const label = h4.querySelector("strong")?.textContent || "";
      lesson = {
        title: h4.textContent.replace(label, "").trim(),
        meta: lessonItem.querySelector("p")?.textContent.trim().replace(/ met /, " · ") || "",
      };
    }
    const textOf = (li) => li.textContent.replace(/\s+/g, " ").trim();
    const free = items.filter((li) => li !== lessonItem && !li.classList.contains("now--tomorrow")).map(textOf).find(Boolean) || "";
    const tomorrowItem = items.find((li) => li.classList.contains("now--tomorrow"));
    return {
      greetingName: heading ? heading.textContent.trim().replace(/^\S+\s+/, "") : "",
      lesson,
      free,
      tomorrow: tomorrowItem ? textOf(tomorrowItem) : "",
    };
  }

  function getFormattedDate() {
    return new Intl.DateTimeFormat("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());
  }

  function isDashboardPage() {
    const path = (location.pathname || "").toLowerCase();
    // Exclude sub-pages that are clearly not the start/dashboard
    if (/^\/(resultaten|agenda|studiewijzers?|presentie|berichten|stages?|bpv|profiel|instellingen|documenten|login|absenties?|inschrijvingen|toetsen)/i.test(path)) {
      return false;
    }
    const hasNowWrapper = !!(document.querySelector(".now--wrapper") || document.querySelector("#iddf") || document.querySelector("li.now--soft") || document.querySelector("li.now--tomorrow"));
    const isHomePath = path === "/" || path === "" || path === "/vandaag" || path === "/start" || path === "/dashboard" || path.endsWith("/start") || path.endsWith("/home") || path.endsWith("/vandaag");
    return isHomePath || hasNowWrapper;
  }

  function initPortalToolbar() {
    const TOOLBAR_ID = "eduarte-tools-portal-actions";
    const STYLE_ID = "eduarte-tools-portal-actions-style";
    let updateFrame = 0;

    function findProfileLink() {
      return [...document.querySelectorAll("nav a[href], header a[href]")].find((link) =>
        /\b(profiel|profile|account)\b/i.test([
          link.textContent,
          link.getAttribute("aria-label"),
          link.getAttribute("title"),
          link.getAttribute("href"),
        ].filter(Boolean).join(" "))
      );
    }

    function findMessagesLink() {
      return [...document.querySelectorAll("nav a[href], header a[href]")].find((link) =>
        /\b(berichten|messages|meldingen|notifications)\b/i.test([
          link.textContent,
          link.getAttribute("aria-label"),
          link.getAttribute("title"),
          link.getAttribute("href"),
        ].filter(Boolean).join(" "))
      );
    }

    function getUnreadCount(actions) {
      if (typeof BADGE_SCAN_SELECTOR === "undefined" || typeof sumBadgeCounts !== "function") return 0;
      const badges = [...document.querySelectorAll(BADGE_SCAN_SELECTOR)]
        .filter((badge) => !actions.contains(badge));
      return sumBadgeCounts(badges);
    }

    function addStyles() {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        ${springVars(`#${TOOLBAR_ID}`)}
        #${TOOLBAR_ID} {
          --et-tb-surface: var(--color-bg-surface, #14171f);
          --et-tb-text: var(--color-text-primary, #eceef3);
          --et-tb-accent: var(--color-bg-fill-action, #ff7a59);
          position: relative;
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          padding: 0 10px;
          color: var(--et-tb-text);
          font: 500 13px/1.3 system-ui, sans-serif;
        }
        /* Ronde tonale icoonknoppen; indrukken of openen maakt ze hoekiger (vormverandering) */
        #${TOOLBAR_ID} .et-portal-action {
          position: relative;
          display: grid;
          flex: 0 0 auto;
          width: 40px;
          height: 40px;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 20px;
          background: color-mix(in srgb, var(--et-tb-surface) 91%, var(--et-tb-text));
          color: var(--et-tb-text);
          box-shadow: none;
          cursor: pointer;
          text-decoration: none;
          transition: border-radius 260ms var(--et-spring), background-color 150ms linear;
        }
        #${TOOLBAR_ID} .et-portal-action:hover {
          background: color-mix(in srgb, var(--et-tb-surface) 83%, var(--et-tb-text));
        }
        #${TOOLBAR_ID} .et-portal-action:active { border-radius: 12px; }
        #${TOOLBAR_ID} .et-portal-action[aria-expanded="true"] {
          border-radius: 14px;
          background: color-mix(in srgb, var(--et-tb-accent) 26%, var(--et-tb-surface));
        }
        #${TOOLBAR_ID} .et-portal-action:focus-visible {
          outline: 2px solid var(--color-bg-fill-action, #ff7a59);
          outline-offset: 3px;
        }
        #${TOOLBAR_ID} .et-portal-action svg { width: 20px; height: 20px; fill: currentColor; }
        #${TOOLBAR_ID} .et-portal-bell::after {
          position: absolute;
          top: 8px;
          right: 9px;
          width: 8px;
          height: 8px;
          border: 0;
          border-radius: 50%;
          background: var(--et-tb-accent);
          content: "";
        }
        #${TOOLBAR_ID} .et-portal-count {
          position: absolute;
          top: -4px;
          right: -4px;
          display: none;
          box-sizing: border-box;
          min-width: 20px;
          height: 20px;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--color-bg, #0c0e13);
          border-radius: 99px;
          background: #fb4b72;
          color: white;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
        }
        /* Profiel in dezelfde geschulpte vorm als het logo in het menu. De vorm zit op ::before
           en de foto, niet op de link zelf, zodat de focusrand zichtbaar blijft. */
        #${TOOLBAR_ID} .et-portal-avatar,
        #${TOOLBAR_ID} .et-portal-avatar:hover,
        #${TOOLBAR_ID} .et-portal-avatar:active {
          isolation: isolate;
          border-radius: 50%;
          background: transparent;
          color: #fff !important;
          color: oklch(from var(--et-tb-accent) calc((.62 - l) * 1000) 0 0) !important;
          font-size: 14px;
          font-weight: 750;
          letter-spacing: -.03em;
          box-shadow: none;
        }
        #${TOOLBAR_ID} .et-portal-avatar::before {
          position: absolute;
          inset: -2px;
          z-index: -1;
          background: var(--et-tb-accent);
          clip-path: ${scallopedShape()};
          content: "";
          transition: transform 500ms var(--et-spring);
        }
        #${TOOLBAR_ID} .et-portal-avatar:hover::before { transform: rotate(30deg) scale(1.06); }
        #${TOOLBAR_ID} .et-portal-avatar:active::before { transform: scale(.94); }
        #${TOOLBAR_ID} .et-portal-avatar img {
          position: absolute;
          inset: -2px;
          width: calc(100% + 4px);
          height: calc(100% + 4px);
          object-fit: cover;
          clip-path: ${scallopedShape()};
        }
        #${TOOLBAR_ID} .et-portal-popover {
          position: absolute;
          z-index: 2147483645;
          top: calc(100% + 10px);
          right: 8px;
          display: none;
          width: min(320px, calc(100vw - 32px));
          padding: 18px 20px;
          border: 1px solid color-mix(in srgb, var(--et-tb-text) 8%, transparent);
          border-radius: 24px;
          background: color-mix(in srgb, var(--et-tb-surface) 94%, var(--et-tb-text));
          color: var(--et-tb-text);
          box-shadow: 0 18px 48px rgba(0,0,0,.45);
        }
        #${TOOLBAR_ID} .et-portal-popover.open { display: block; animation: et-portal-pop-in 150ms ease both; }
        #${TOOLBAR_ID} .et-portal-popover h2 {
          margin: 0 0 6px;
          color: inherit;
          font: 700 15px/1.3 system-ui, sans-serif;
        }
        #${TOOLBAR_ID} .et-portal-popover p {
          margin: 0;
          color: color-mix(in srgb, var(--et-tb-text) 68%, transparent);
          font: 400 12px/1.5 system-ui, sans-serif;
        }
        /* Zoekvenster midden in beeld, boven alles (ook boven de filterbalk van de agenda) */
        #${TOOLBAR_ID} .et-portal-search {
          display: none;
          position: fixed;
          z-index: 2147483647;
          top: 12vh;
          left: 50%;
          width: min(560px, calc(100vw - 32px));
          box-sizing: border-box;
          padding: 12px;
          transform: translateX(-50%);
          border: 1px solid color-mix(in srgb, var(--color-text-primary, #eceef3) 12%, transparent);
          border-radius: 28px;
          background: var(--color-bg-surface, #14171f);
          color: var(--color-text-primary, #eceef3);
          box-shadow: 0 0 0 100vmax rgba(0,0,0,.45), 0 24px 60px rgba(0,0,0,.5);
          font: 500 13px system-ui, sans-serif;
        }
        #${TOOLBAR_ID} .et-portal-search.open { display: block; animation: et-portal-search-in 160ms ease both; }
        @keyframes et-portal-search-in { from { opacity: 0; transform: translate(-50%, -6px) scale(.98); } }
        #${TOOLBAR_ID} .et-portal-search input {
          box-sizing: border-box;
          width: 100%;
          min-height: 48px;
          padding: 0 18px 0 46px;
          border: 1px solid transparent;
          border-radius: 24px;
          outline: 0;
          background: color-mix(in srgb, var(--color-bg-surface, #14171f) 90%, var(--color-text-primary, #eceef3)) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a92a6' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E") no-repeat 17px 50% / 18px;
          color: inherit;
          font: 500 15px system-ui, sans-serif;
        }
        #${TOOLBAR_ID} .et-portal-search input:focus { border-color: var(--color-bg-fill-action, #ff7a59); }
        #${TOOLBAR_ID} .et-portal-search input::placeholder { color: color-mix(in srgb, currentColor 50%, transparent); }
        #${TOOLBAR_ID} .et-search-results { display: grid; gap: 2px; max-height: 50vh; margin: 8px 0 0; padding: 0; overflow-y: auto; list-style: none; }
        #${TOOLBAR_ID} .et-search-results:empty { display: none; }
        #${TOOLBAR_ID} .et-search-group { padding: 8px 10px 4px; color: color-mix(in srgb, currentColor 50%, transparent); font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
        #${TOOLBAR_ID} .et-search-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 16px; cursor: pointer; }
        #${TOOLBAR_ID} .et-search-item.is-active { background: color-mix(in srgb, var(--color-bg-fill-action, #ff7a59) 16%, transparent); }
        #${TOOLBAR_ID} .et-search-item i { flex: none; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: color-mix(in srgb, currentColor 8%, transparent); font-style: normal; font-size: 14px; }
        #${TOOLBAR_ID} .et-search-item b { display: block; font-weight: 600; }
        #${TOOLBAR_ID} .et-search-item small { display: block; overflow: hidden; color: color-mix(in srgb, currentColor 55%, transparent); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
        #${TOOLBAR_ID} .et-search-item span { min-width: 0; }
        #${TOOLBAR_ID} .et-search-hint { display: flex; justify-content: flex-end; gap: 12px; padding: 8px 6px 0; color: color-mix(in srgb, currentColor 45%, transparent); font-size: 11px; }
        #${TOOLBAR_ID} .et-search-hint kbd { padding: 1px 5px; border-radius: 4px; background: color-mix(in srgb, currentColor 10%, transparent); font: inherit; }
        #${TOOLBAR_ID} .et-portal-message-link {
          display: inline-flex;
          margin-top: 12px;
          padding: 8px 12px;
          border-radius: 999px;
          background: var(--et-tb-accent);
          color: #fff;
          font: 650 12px system-ui, sans-serif;
          text-decoration: none;
        }
        #${TOOLBAR_ID} .et-portal-message-link[hidden] { display: none; }
        @keyframes et-portal-pop-in {
          from { opacity: 0; transform: translateY(-4px) scale(.98); }
          to { opacity: 1; transform: none; }
        }
        @media (max-width: 520px) {
          #${TOOLBAR_ID} { gap: 5px; padding-inline: 5px; }
          #${TOOLBAR_ID} .et-portal-action { width: 36px; height: 36px; }
          #${TOOLBAR_ID} .et-portal-bell::after { top: 7px; right: 8px; }
        }
        @media (prefers-reduced-motion: reduce) {
          #${TOOLBAR_ID} *, #${TOOLBAR_ID} *::before, #${TOOLBAR_ID} *::after {
            animation-duration: 1ms !important;
            transition-duration: 1ms !important;
          }
        }
      `;
      document.head?.appendChild(style);
    }

    function mount() {
      const headerToolbar = document.querySelector("header.header .header-toolbar");
      if (!headerToolbar || headerToolbar.querySelector(`#${TOOLBAR_ID}`)) return;
      addStyles();

      const actions = document.createElement("div");
      actions.id = TOOLBAR_ID;
      actions.innerHTML = `
        <button class="et-portal-action et-portal-search-button" type="button" aria-label="Zoeken" title="Zoeken" aria-expanded="false">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M10.5 3a7.5 7.5 0 1 0 4.65 13.39l4.23 4.23 1.41-1.41-4.23-4.23A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z"/></svg>
        </button>
        <button class="et-portal-action et-portal-bell" type="button" aria-label="Meldingen" title="Meldingen" aria-expanded="false">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 22a2.25 2.25 0 0 0 2.2-1.75H9.8A2.25 2.25 0 0 0 12 22Zm7-5-1.6-2.1V10a5.4 5.4 0 0 0-4.4-5.3V4a1 1 0 0 0-2 0v.7A5.4 5.4 0 0 0 6.6 10v4.9L5 17v1h14v-1Z"/></svg>
          <span class="et-portal-count" aria-hidden="true"></span>
        </button>
        <a class="et-portal-action et-portal-avatar" aria-label="Profiel" title="Profiel"></a>
        <form class="et-portal-search" role="search" aria-label="Zoeken in Eduarte">
          <input type="search" placeholder="Zoek een pagina, les, docent of tekst…" aria-label="Zoekterm" autocomplete="off">
          <ul class="et-search-results" role="listbox"></ul>
          <div class="et-search-hint"><span><kbd>↑</kbd><kbd>↓</kbd> kiezen</span><span><kbd>Enter</kbd> openen</span><span><kbd>Ctrl</kbd>+<kbd>K</kbd> zoeken</span></div>
        </form>
        <section class="et-portal-popover" aria-label="Meldingen" aria-live="polite">
          <h2>Meldingen</h2>
          <p class="et-portal-notification-copy"></p>
          <a class="et-portal-message-link" hidden>Open berichten</a>
        </section>
      `;

      const searchButton = actions.querySelector(".et-portal-search-button");
      const searchForm = actions.querySelector(".et-portal-search");
      const searchInput = searchForm.querySelector("input");
      const notificationButton = actions.querySelector(".et-portal-bell");
      const notificationPanel = actions.querySelector(".et-portal-popover");
      const notificationCopy = actions.querySelector(".et-portal-notification-copy");
      const count = actions.querySelector(".et-portal-count");
      const profile = actions.querySelector(".et-portal-avatar");
      const messageLink = actions.querySelector(".et-portal-message-link");
      const profileLink = findProfileLink();
      const existingMessageLink = findMessagesLink();
      const profileImage = profileLink?.querySelector("img");
      const profileName = profileImage?.alt
        || profileLink?.textContent?.trim()
        || document.querySelector("[class*='user-name'], [class*='username']")?.textContent?.trim()
        || "";
      const initials = profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "•";
      if (profileLink?.href) profile.href = profileLink.href;
      else {
        profile.href = "#";
        profile.addEventListener("click", (event) => event.preventDefault());
      }
      if (profileImage?.src) {
        const image = document.createElement("img");
        image.src = profileImage.src;
        image.alt = "";
        profile.replaceChildren(image);
      } else {
        profile.textContent = initials;
      }
      if (existingMessageLink?.href) {
        messageLink.href = existingMessageLink.href;
        messageLink.hidden = false;
      }

      const updateUnreadCount = () => {
        const unread = getUnreadCount(actions);
        count.textContent = unread > 99 ? "99+" : String(unread);
        count.style.display = unread ? "flex" : "none";
        notificationButton.setAttribute("aria-label", unread ? `${unread} ongelezen meldingen` : "Meldingen");
        notificationCopy.textContent = unread
          ? `Eduarte toont ${unread} ongelezen ${unread === 1 ? "melding" : "meldingen"}.`
          : "Er zijn geen ongelezen meldingen gevonden.";
      };

      // Zoeken: pagina's uit het menu, lessen van deze week en tekst op de huidige pagina
      const resultsEl = searchForm.querySelector(".et-search-results");
      let results = [];
      let active = 0;
      let lessons = null;

      const pages = () => Array.from(document.querySelectorAll("nav.navigation a[href]"))
        .map((a) => ({ label: a.textContent.trim(), href: a.href }))
        .filter((p) => p.label && !/uitloggen|studentenportaal/i.test(p.label));

      const loadLessons = () => {
        const Agenda = globalThis.EduarteAgenda;
        if (lessons || !Agenda) return;
        lessons = [];
        const fromDoc = (doc) => { lessons = Agenda.getWeekLessons(doc).lessons; renderResults(); };
        if (document.querySelector(".agenda")) fromDoc(document);
        else Agenda.fetchAgendaDocument().then(fromDoc).catch(() => {});
      };

      const days = ["zo", "ma", "di", "wo", "do", "vr", "za"];
      const renderResults = () => {
        const term = searchInput.value.trim().toLowerCase();
        const matches = (...texts) => texts.some((t) => (t || "").toLowerCase().includes(term));
        const pageHits = pages().filter((p) => !term || matches(p.label)).slice(0, term ? 5 : 8)
          .map((p) => ({ group: "Pagina's", icon: "→", label: p.label, sub: "", run: () => { location.href = p.href; } }));
        const lessonHits = term ? (lessons || []).filter((l) => matches(l.title, l.subject, l.location, l.participants)).slice(0, 6)
          .map((l) => {
            const Agenda = globalThis.EduarteAgenda;
            const day = days[new Date(`${l.date}T12:00`).getDay()];
            return {
              group: "Lessen deze week",
              icon: "📅",
              label: l.title,
              sub: `${day} ${Agenda.formatTime(l.start)}–${Agenda.formatTime(l.end)} · ${[l.location, l.participants].filter(Boolean).join(" · ")}`,
              run: () => { location.href = "/agenda"; },
            };
          }) : [];
        const findHit = term ? [{
          group: "Op deze pagina",
          icon: "🔍",
          label: `Zoek "${searchInput.value.trim()}"`,
          sub: "Volgende treffer op deze pagina",
          keepOpen: true,
          run: () => window.find?.(searchInput.value.trim(), false, false, true, false, true, false),
        }] : [];
        // Zonder pagina- of lestreffer zoekt Enter meteen op de pagina
        results = [...findHit.filter(() => !pageHits.length && !lessonHits.length), ...pageHits, ...lessonHits, ...findHit.filter(() => pageHits.length || lessonHits.length)];
        active = Math.min(active, Math.max(results.length - 1, 0));
        let lastGroup = "";
        resultsEl.innerHTML = results.map((r, i) => {
          const header = r.group !== lastGroup ? `<li class="et-search-group" role="presentation">${escapeHtml(r.group)}</li>` : "";
          lastGroup = r.group;
          return `${header}<li class="et-search-item${i === active ? " is-active" : ""}" role="option" data-index="${i}"><i>${r.icon}</i><span><b>${escapeHtml(r.label)}</b>${r.sub ? `<small>${escapeHtml(r.sub)}</small>` : ""}</span></li>`;
        }).join("");
      };

      const runResult = (index) => {
        const result = results[index];
        if (!result) return;
        if (!result.keepOpen) closeSearch();
        result.run();
      };

      const openSearch = () => {
        searchForm.classList.add("open");
        notificationPanel.classList.remove("open");
        searchButton.setAttribute("aria-expanded", "true");
        notificationButton.setAttribute("aria-expanded", "false");
        active = 0;
        renderResults();
        loadLessons();
        searchInput.focus();
        searchInput.select();
      };

      const closeSearch = () => {
        searchForm.classList.remove("open");
        searchButton.setAttribute("aria-expanded", "false");
      };

      searchButton.addEventListener("click", () => {
        if (searchForm.classList.contains("open")) closeSearch();
        else openSearch();
      });
      searchInput.addEventListener("input", () => { active = 0; renderResults(); });
      searchInput.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        if (!results.length) return;
        active = (active + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length;
        renderResults();
        resultsEl.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
      });
      resultsEl.addEventListener("click", (event) => {
        const item = event.target.closest(".et-search-item");
        if (item) runResult(Number(item.dataset.index));
      });
      searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!searchInput.value.trim()) return;
        renderResults();
        runResult(active);
      });
      document.addEventListener("keydown", (event) => {
        const typing = event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable]");
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          openSearch();
        } else if (event.key === "/" && !typing) {
          event.preventDefault();
          openSearch();
        }
      });
      notificationButton.addEventListener("click", () => {
        const open = notificationPanel.classList.toggle("open");
        searchForm.classList.remove("open");
        notificationButton.setAttribute("aria-expanded", String(open));
        searchButton.setAttribute("aria-expanded", "false");
        updateUnreadCount();
      });
      document.addEventListener("pointerdown", (event) => {
        if (actions.contains(event.target)) return;
        searchForm.classList.remove("open");
        notificationPanel.classList.remove("open");
        searchButton.setAttribute("aria-expanded", "false");
        notificationButton.setAttribute("aria-expanded", "false");
      }, true);
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        searchForm.classList.remove("open");
        notificationPanel.classList.remove("open");
        searchButton.setAttribute("aria-expanded", "false");
        notificationButton.setAttribute("aria-expanded", "false");
      });

      updateUnreadCount();
      headerToolbar.appendChild(actions);
      const observer = new MutationObserver((records) => {
        if (!records.some((record) => !actions.contains(record.target))) return;
        if (updateFrame) return;
        updateFrame = requestAnimationFrame(() => {
          updateFrame = 0;
          if (actions.isConnected) updateUnreadCount();
        });
      });
      observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
      setTimeout(() => observer.disconnect(), 60000);
    }

    mount();
    const observer = new MutationObserver(mount);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }

  // --- STARTPAGINA DASHBOARD WIDGETS ---
  function initStartWidget() {
    const CONTAINER_ID = "eduarte-tools-widgets-container";

    function cleanIfWrongPage() {
      if (!isDashboardPage()) {
        const el = document.getElementById(CONTAINER_ID);
        if (el) el.remove();
        return false;
      }
      return true;
    }

    if (!cleanIfWrongPage()) return;
    if (document.getElementById(CONTAINER_ID)) return;

    chrome.storage.local.get(
      [
        "eduarteStartEnabled",
        "eduarteWeatherEnabled",
        "eduarteGreetingEnabled",
        "eduarteWeatherCity",
        "eduarteWeatherUseLocation",
        "eduarteWeatherCoordinates",
        "eduarteWeatherLocationLabel",
        "eduarteShortcutsEnabled",
        "eduartePomodoroEnabled",
        "eduarteQuickCalcEnabled",
        "eduarteTodayEnabled",
        "eduarteInstagramDismissed",
      ],
      (settings) => {
        if (settings.eduarteStartEnabled === false) return;

        const showWeather = settings.eduarteWeatherEnabled !== false;
        const showGreeting = settings.eduarteGreetingEnabled !== false;
        const showShortcuts = settings.eduarteShortcutsEnabled !== false;
        const showPomodoro = settings.eduartePomodoroEnabled !== false;
        const showQuickCalc = settings.eduarteQuickCalcEnabled !== false;
        const showToday = settings.eduarteTodayEnabled !== false;

        if (!showWeather && !showGreeting && !showShortcuts && !showPomodoro && !showQuickCalc && !showToday) return;

        function tryMount() {
          if (!isDashboardPage()) {
            const el = document.getElementById(CONTAINER_ID);
            if (el) el.remove();
            return;
          }
          if (document.getElementById(CONTAINER_ID)) return;

          const target = document.querySelector(".now--wrapper") ||
            document.querySelector("#iddf")?.parentElement ||
            document.querySelector(".l-flex-content main") ||
            document.querySelector(".content");

          if (!target) return;

          const container = document.createElement("div");
          container.id = CONTAINER_ID;
          const C = `#${CONTAINER_ID}`;
          const native = readNativeNow(target);
          const name = native.greetingName;
          const greetingText = name ? `${getGreeting().text}, ${escapeHtml(name)}` : getGreeting().text;
          const cityLabel = settings.eduarteWeatherUseLocation !== false && settings.eduarteWeatherCoordinates
            ? (settings.eduarteWeatherLocationLabel || "Huidige locatie")
            : (settings.eduarteWeatherCity || "Utrecht");

          container.innerHTML = `
            <style>
              ${springVars(C)}
              ${C} {
                --et-surface: var(--color-bg-surface, #14171f);
                --et-text: var(--color-text-primary, #eceef3);
                --et-muted: color-mix(in srgb, var(--et-text) 55%, transparent);
                --et-line: color-mix(in srgb, var(--et-text) 8%, transparent);
                --et-surface-2: color-mix(in srgb, var(--et-surface) 92%, var(--et-text));
                --et-accent: var(--color-bg-fill-action, #ff7a59);
                --et-accent-2: color-mix(in oklch, var(--et-accent), #a855f7 55%);
                --et-accent-soft: color-mix(in srgb, var(--et-accent) 14%, transparent);
                --et-accent-tonal: color-mix(in srgb, var(--et-accent) 26%, var(--et-surface));
                --et-ok: #34d399;
                display: grid;
                grid-template-columns: repeat(12, minmax(0, 1fr));
                gap: 14px;
                margin-bottom: 24px;
                color: var(--et-text);
                font-family: "Segoe UI Variable Text", "Segoe UI Variable", "Inter", system-ui, sans-serif;
                font-size: 13.5px;
                line-height: 1.45;
                -webkit-font-smoothing: antialiased;
              }
              ${C} > * { animation: et-in 360ms cubic-bezier(.2, .8, .2, 1) both; }
              ${C} > :nth-child(3) { animation-delay: 40ms; }
              ${C} > :nth-child(4) { animation-delay: 80ms; }
              ${C} > :nth-child(5) { animation-delay: 120ms; }
              ${C} > :nth-child(6) { animation-delay: 160ms; }
              ${C} > :nth-child(7) { animation-delay: 200ms; }
              ${C} > :nth-child(8) { animation-delay: 240ms; }
              @keyframes et-in { from { opacity: 0; transform: translateY(8px) scale(.99); } }
              @media (prefers-reduced-motion: reduce) { ${C} > * { animation: none; } }
              .now--wrapper:has(> ${C}) { max-width: min(1160px, 100%) !important; }
              .now--wrapper:has(> ${C}.et-replaces-native) > h1,
              .now--wrapper:has(> ${C}.et-replaces-native) > ul:not(.d-none) { display: none !important; }

              ${C} svg.et-i { width: 16px; height: 16px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

              ${C} .et-card {
                position: relative;
                grid-column: span 12;
                box-sizing: border-box;
                min-width: 0;
                padding: 20px 22px;
                border: 1px solid var(--et-line);
                border-radius: 28px;
                background:
                  linear-gradient(180deg, color-mix(in srgb, var(--et-text) 3%, transparent), transparent 60%),
                  var(--et-surface);
                box-shadow: 0 1px 0 color-mix(in srgb, var(--et-text) 5%, transparent) inset, 0 10px 30px -18px rgba(0,0,0,.6);
                transition: border-color .2s ease, transform .2s ease;
              }
              ${C} .et-card:hover { border-color: color-mix(in srgb, var(--et-text) 14%, transparent); }
              ${C} .et-label {
                display: flex; align-items: center; gap: 8px;
                margin: 0 0 14px;
                color: var(--et-muted);
                font-size: 12px; font-weight: 600; letter-spacing: .02em;
              }
              ${C} .et-label svg.et-i { width: 15px; height: 15px; color: var(--et-accent); }
              ${C} .et-label a { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; color: var(--et-text) !important; font-weight: 600; text-decoration: none !important; opacity: .7; transition: opacity .15s; }
              ${C} .et-label a:hover { opacity: 1; }

              /* Hero */
              ${C} .et-hello {
                grid-column: span 7;
                display: flex; flex-direction: column; justify-content: space-between; gap: 22px;
                overflow: hidden;
                padding: 24px 26px;
                background:
                  radial-gradient(60% 90% at 100% 0%, color-mix(in srgb, var(--et-accent) 28%, transparent), transparent 70%),
                  radial-gradient(50% 80% at 75% 120%, color-mix(in srgb, var(--et-accent-2) 22%, transparent), transparent 70%),
                  var(--et-surface);
              }
              ${C} .et-hello small { color: var(--et-muted); font-size: 13px; font-weight: 500; }
              ${C} .et-hello small::first-letter { text-transform: uppercase; }
              ${C} .et-hello h2 { margin: 4px 0 0; color: var(--et-text); font-size: 32px; font-weight: 700; line-height: 1.1; letter-spacing: -.035em; }
              ${C} .et-hello h2 span { background: linear-gradient(90deg, var(--et-accent), var(--et-accent-2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
              ${C} .et-chips { display: flex; flex-wrap: wrap; gap: 8px; }
              ${C} .et-chip {
                display: inline-flex; align-items: center; gap: 7px;
                padding: 6px 12px; border: 1px solid var(--et-line); border-radius: 99px;
                background: color-mix(in srgb, var(--et-surface) 60%, transparent);
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
                color: var(--et-text); font-size: 12.5px; font-weight: 500; white-space: nowrap;
              }
              ${C} .et-chip b { font-weight: 700; }
              ${C} .et-chip svg.et-i { width: 14px; height: 14px; opacity: .75; }
              ${C} button.et-chip { cursor: pointer; font-family: inherit; }
              ${C} button.et-chip:hover { border-color: color-mix(in srgb, var(--et-accent) 50%, transparent); }

              /* Nu bezig */
              ${C} .et-now { grid-column: span 5; display: flex; flex-direction: column; padding: 22px 24px; }
              ${C} .et-tag {
                align-self: flex-start;
                display: inline-flex; align-items: center; gap: 7px;
                padding: 4px 10px; border-radius: 99px;
                background: var(--et-accent-soft); color: var(--et-accent);
                font-size: 11.5px; font-weight: 700;
              }
              ${C} .et-tag::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
              ${C} .et-now.is-live .et-tag::before { animation: et-pulse 1.6s infinite; }
              ${C} .et-now.is-free .et-tag { background: color-mix(in srgb, var(--et-ok) 14%, transparent); color: var(--et-ok); }
              @keyframes et-pulse { 0% { box-shadow: 0 0 0 0 currentColor; } 70%, 100% { box-shadow: 0 0 0 6px transparent; } }
              ${C} .et-now h4 { margin: 14px 0 2px; color: var(--et-text); font-size: 22px; font-weight: 700; letter-spacing: -.025em; }
              ${C} .et-now .et-meta { color: var(--et-muted); }
              ${C} .et-now.is-next .et-tag { background: color-mix(in srgb, var(--et-text) 8%, transparent); color: var(--et-text); }
              ${C} .et-now.is-next .et-tag::before { background: var(--et-accent); }
              ${C} .et-after { display: flex; align-items: center; gap: 6px; margin-top: 10px; color: var(--et-muted); font-size: 12.5px; }
              ${C} .et-after b { color: var(--et-text); font-weight: 600; }
              ${C} .et-after[hidden], ${C} .et-when[hidden] { display: none; }
              ${C} .et-when { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 14px; border-top: 1px solid var(--et-line); color: var(--et-muted); font-variant-numeric: tabular-nums; }
              ${C} .et-when span { display: inline-flex; align-items: center; gap: 7px; }
              ${C} .et-when svg.et-i { width: 15px; height: 15px; color: var(--et-accent); }
              ${C} .et-when b { color: var(--et-text); font-size: 15px; font-weight: 700; letter-spacing: -.01em; }
              ${C} .et-now .et-meta:empty { display: none; }
              ${C} .et-now.is-next .et-meta { margin-bottom: 18px; }
              ${C} .et-progress { margin-top: auto; padding-top: 18px; }
              ${C} .et-bar { position: relative; height: 8px; margin-bottom: 8px; border-radius: 99px; background: var(--et-surface-2); }
              ${C} .et-bar > div { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--et-accent), var(--et-accent-2)); box-shadow: 0 0 16px color-mix(in srgb, var(--et-accent) 45%, transparent); transition: width .6s ease; }
              ${C} .et-bar-row { display: flex; justify-content: space-between; align-items: baseline; color: var(--et-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
              ${C} .et-bar-row b { color: var(--et-text); font-size: 13px; }

              /* Snelkoppelingen */
              ${C} .et-links { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; padding: 10px; }
              ${C} .et-link {
                display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 0;
                padding: 12px 6px 10px; border-radius: 20px;
                color: var(--et-text) !important; font-size: 12.5px; font-weight: 600; text-decoration: none !important;
                transition: background-color .15s ease;
              }
              ${C} .et-link:hover { background: var(--et-surface-2); }
              ${C} .et-link span {
                display: grid; place-items: center; width: 42px; height: 42px; border-radius: 14px;
                background: var(--tile); color: #fff;
                box-shadow: 0 6px 16px -6px var(--tile), inset 0 1px rgba(255,255,255,.25);
                transition: border-radius 320ms var(--et-spring), transform 320ms var(--et-spring);
              }
              ${C} .et-link:hover span { border-radius: 21px; transform: scale(1.08) rotate(-6deg); }
              ${C} .et-link:active span { border-radius: 10px; transform: scale(.94); }
              ${C} .et-link span svg.et-i { width: 20px; height: 20px; }
              ${C} .et-link em { max-width: 100%; overflow: hidden; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }

              /* Vandaag */
              ${C} .et-today { grid-column: span 5; }
              ${C} .et-tl { position: relative; display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
              ${C} .et-tl li { position: relative; display: grid; grid-template-columns: 42px 14px minmax(0, 1fr); align-items: center; gap: 10px; padding: 8px 10px 8px 4px; border-radius: 16px; transition: background-color .15s; }
              ${C} .et-tl li:not(.et-empty)::after { content: ""; position: absolute; left: 62px; top: 50%; bottom: -50%; width: 2px; background: var(--et-line); }
              ${C} .et-tl li:last-child::after { display: none; }
              ${C} .et-tl li.is-current { background: var(--et-surface-2); }
              ${C} .et-tl li.is-past { opacity: .6; }
              ${C} .et-tl li.is-past strong { font-weight: 500; }
              ${C} .et-tl time { color: var(--et-muted); font-size: 12px; font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
              ${C} .et-tl i { position: relative; z-index: 1; width: 12px; height: 12px; margin-left: 1px; border: 3px solid var(--et-surface); border-radius: 50%; box-shadow: 0 0 0 2px currentColor; background: currentColor; }
              ${C} .et-tl li.is-current i { box-shadow: 0 0 0 2px currentColor, 0 0 12px currentColor; }
              ${C} .et-tl strong { display: block; overflow: hidden; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
              ${C} .et-tl small { display: block; overflow: hidden; color: var(--et-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
              ${C} .et-tl-foot { display: inline-flex; align-items: center; gap: 6px; margin: 10px 0 0 4px; padding: 5px 11px; border-radius: 99px; background: color-mix(in srgb, var(--et-ok) 12%, transparent); color: var(--et-ok); font-size: 12px; font-weight: 600; }
              ${C} .et-tl-foot[hidden] { display: none; }
              ${C} .et-empty { color: var(--et-muted); }

              /* Timer */
              ${C} .et-timer { grid-column: span 3; display: flex; flex-direction: column; align-items: center; }
              ${C} .et-timer .et-label { align-self: stretch; }
              /* Verbonden knoppengroep: de gekozen duur wordt een volle pil, de rest blijft hoekiger */
              ${C} .et-seg { display: flex; gap: 2px; width: 100%; box-sizing: border-box; }
              ${C} .et-seg button { flex: 1; height: 36px; padding: 0; border: 0; border-radius: 8px; background: var(--et-surface-2); color: var(--et-muted); font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: border-radius 260ms var(--et-spring), background-color .15s, color .15s; }
              ${C} .et-seg button:first-child { border-radius: 18px 8px 8px 18px; }
              ${C} .et-seg button:last-child { border-radius: 8px 18px 18px 8px; }
              ${C} .et-seg button:hover { color: var(--et-text); }
              ${C} .et-seg button:active { border-radius: 6px; }
              ${C} .et-seg button.is-on { border-radius: 18px; background: var(--et-accent-tonal); color: var(--et-text); }
              ${C} .et-ring { position: relative; width: 132px; height: 132px; margin: 14px 0; }
              ${C} .et-ring svg { display: block; transform: rotate(-90deg); overflow: visible; }
              ${C} .et-ring circle { fill: none; stroke-width: 9; }
              ${C} .et-ring .et-ring-bg { stroke: var(--et-surface-2); }
              ${C} .et-ring .et-ring-fg { stroke: url(#et-ring-grad); stroke-linecap: round; filter: drop-shadow(0 0 6px color-mix(in srgb, var(--et-accent) 50%, transparent)); transition: stroke-dashoffset 1s linear; }
              ${C} .et-ring-text { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
              ${C} .et-ring-text b { font-size: 28px; font-weight: 700; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
              ${C} .et-ring-text small { margin-top: -2px; color: var(--et-muted); font-size: 11.5px; font-weight: 500; }
              ${C} .et-ring.is-done .et-ring-fg { stroke: var(--et-ok); }
              ${C} .et-row { display: flex; gap: 8px; width: 100%; }
              ${C} .et-primary {
                flex: 1; min-height: 44px; padding: 0 16px; border: 0; border-radius: 22px;
                background: linear-gradient(135deg, var(--et-accent), var(--et-accent-2)); color: #fff;
                font: inherit; font-size: 14px; font-weight: 700; cursor: pointer;
                box-shadow: 0 8px 20px -8px var(--et-accent);
                transition: border-radius 260ms var(--et-spring), transform 260ms var(--et-spring), filter .15s ease;
              }
              ${C} .et-primary:hover { filter: brightness(1.08); }
              ${C} .et-primary:active { border-radius: 12px; transform: scale(.98); }
              ${C} .et-ghost { flex: none; display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 22px; background: var(--et-surface-2); color: var(--et-text); cursor: pointer; transition: border-radius 260ms var(--et-spring), background-color .15s; }
              ${C} .et-ghost:hover { background: color-mix(in srgb, var(--et-surface) 84%, var(--et-text)); }
              ${C} .et-ghost:active { border-radius: 12px; }

              /* Calculator */
              ${C} .et-calc { grid-column: span 4; display: flex; flex-direction: column; }
              ${C} .et-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
              ${C} .et-fields label { display: block; color: var(--et-muted); font-size: 12px; font-weight: 500; }
              ${C} .et-fields input {
                box-sizing: border-box; width: 100%; margin-top: 5px; padding: 9px 12px;
                border: 1px solid transparent; border-radius: 14px; outline: none;
                background: var(--et-surface-2); color: var(--et-text);
                font: inherit; font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums;
                transition: border-color .15s, box-shadow .15s;
              }
              ${C} .et-fields input:focus { border-color: var(--et-accent); box-shadow: 0 0 0 3px var(--et-accent-soft); }
              ${C} .et-need {
                flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 12px;
                min-height: 56px; padding: 12px 18px; border: 1px solid color-mix(in srgb, var(--et-accent) 25%, transparent); border-radius: 20px;
                background: linear-gradient(120deg, color-mix(in srgb, var(--et-accent) 16%, transparent), color-mix(in srgb, var(--et-accent-2) 12%, transparent));
              }
              ${C} .et-need span { color: var(--et-text); font-weight: 600; }
              ${C} .et-need span small { display: block; margin-top: 1px; color: var(--et-muted); font-size: 12px; font-weight: 500; }
              ${C} .et-need b { font-size: 32px; font-weight: 700; letter-spacing: -.03em; font-variant-numeric: tabular-nums; background: linear-gradient(90deg, var(--et-accent), var(--et-accent-2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
              ${C} .et-need b { flex: none; white-space: nowrap; }
              ${C} .et-need span { min-width: 0; }
              ${C} .et-need b.is-bad { background: none; color: #f87171; }
              ${C} .et-need b.is-ok { background: none; color: var(--et-ok); }
              ${C} .et-need b.is-empty { background: none; color: var(--et-muted); }
              ${C} .et-fields input.is-invalid { border-color: #f87171; box-shadow: 0 0 0 3px color-mix(in srgb, #f87171 22%, transparent); }

              /* Instagram */
              ${C} .et-ig { display: flex; align-items: center; gap: 12px; padding: 8px 10px 8px 10px; border-radius: 24px; }
              ${C} .et-ig > span { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #f58529, #dd2a7b 50%, #8134af); color: #fff; }
              ${C} .et-ig div { flex: 1; min-width: 0; color: var(--et-muted); font-size: 12.5px; }
              ${C} .et-ig div b { color: var(--et-text); font-weight: 600; }
              ${C} .et-ig a { flex: none; padding: 5px 12px; border-radius: 99px; background: var(--et-text); color: var(--et-surface) !important; font-size: 12px; font-weight: 700; text-decoration: none !important; }
              ${C} .et-ig button { flex: none; display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--et-muted); cursor: pointer; }
              ${C} .et-ig button:hover { background: var(--et-surface-2); color: var(--et-text); }

              ${C} button:focus-visible, ${C} a:focus-visible, ${C} input:focus-visible { outline: 2px solid var(--et-accent); outline-offset: 2px; }

              @media (max-width: 1100px) {
                ${C} .et-hello, ${C} .et-now, ${C} .et-today { grid-column: span 12; }
                ${C} .et-timer, ${C} .et-calc { grid-column: span 6; }
                ${C} .et-links { grid-template-columns: repeat(4, minmax(0, 1fr)); }
              }
              @media (max-width: 640px) {
                ${C} .et-timer, ${C} .et-calc { grid-column: span 12; }
                ${C} .et-links { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                ${C} .et-hello h2 { font-size: 26px; }
              }
            </style>

            ${settings.eduarteInstagramDismissed ? "" : `
              <div class="et-card et-ig" id="et-ig-card">
                <span>${icon("instagram")}</span>
                <div><b>Eduarte Tools staat op Instagram</b> · nieuws, tips en updates</div>
                <a href="https://www.instagram.com/eduartetools/" target="_blank" rel="noopener noreferrer">Volgen</a>
                <button type="button" title="Sluiten" aria-label="Sluiten">${icon("x")}</button>
              </div>
            `}

            ${(showGreeting || showWeather) ? `
              <section class="et-card et-hello">
                <div>
                  <small>${getFormattedDate()}</small>
                  <h2>${showGreeting ? (name ? `${getGreeting().text}, <span>${escapeHtml(name)}</span>` : getGreeting().text) : "Vandaag"}</h2>
                </div>
                <div class="et-chips">
                  ${showWeather ? `<button type="button" class="et-chip et-weather" title="Ververs weerbericht">${icon("cloud")} <span>Weer laden…</span></button>` : ""}
                  ${showToday ? `<span class="et-chip et-lesson-count" hidden></span>` : ""}
                  ${native.tomorrow && !showToday ? `<span class="et-chip">${icon("sunrise")} ${escapeHtml(native.tomorrow.replace(/\.$/, ""))}</span>` : ""}
                </div>
              </section>
            ` : ""}

            ${showToday ? `
              <section class="et-card et-now ${native.lesson ? "is-live" : "is-free"}">
                <span class="et-tag">${native.lesson ? "Nu bezig" : "Vrij"}</span>
                <h4>${escapeHtml(native.lesson ? native.lesson.title : (native.free || native.tomorrow || "Geen les op dit moment"))}</h4>
                <div class="et-meta">${escapeHtml(native.lesson ? native.lesson.meta : (native.free && native.tomorrow ? native.tomorrow : ""))}</div>
                <div class="et-after" hidden></div>
                <div class="et-progress" hidden>
                  <div class="et-bar"><div></div></div>
                  <div class="et-bar-row"><span class="et-from"></span><span class="et-left"></span><span class="et-to"></span></div>
                </div>
                <div class="et-when" hidden></div>
              </section>
            ` : ""}

            ${showShortcuts ? `
              <nav class="et-card et-links" aria-label="Eduarte snelkoppelingen">
                <a class="et-link" href="https://teams.microsoft.com" target="_blank" rel="noreferrer"><span style="--tile:#6264a7">${icon("users")}</span><em>Teams</em></a>
                <a class="et-link" href="https://outlook.office.com/mail" target="_blank" rel="noreferrer"><span style="--tile:#0f6cbd">${icon("mail")}</span><em>Outlook</em></a>
                <a class="et-link" href="https://onedrive.live.com" target="_blank" rel="noreferrer"><span style="--tile:#0ea5e9">${icon("cloud")}</span><em>OneDrive</em></a>
                <a class="et-link" href="https://www.office.com" target="_blank" rel="noreferrer"><span style="--tile:#ea580c">${icon("grid")}</span><em>Office 365</em></a>
                <a class="et-link" href="https://mbowebshop.nl/Gebruikers/Licenties/" target="_blank" rel="noreferrer"><span style="--tile:#d97706">${icon("book")}</span><em>MboWebshop</em></a>
                <a class="et-link" href="/resultaten"><span style="--tile:#059669">${icon("chart")}</span><em>Cijfers</em></a>
                <a class="et-link" href="/agenda"><span style="--tile:#db2777">${icon("calendar")}</span><em>Agenda</em></a>
              </nav>
            ` : ""}

            ${showToday ? `
              <section class="et-card et-today">
                <h3 class="et-label">${icon("list")} <span class="et-today-title">Vandaag</span> <a href="/agenda">Hele week ${icon("arrow")}</a></h3>
                <ul class="et-tl"><li class="et-empty" style="display:block">Lessen laden…</li></ul>
                <div class="et-tl-foot" hidden></div>
              </section>
            ` : ""}

            ${showPomodoro ? `
              <section class="et-card et-timer">
                <h3 class="et-label">${icon("timer")} Focus</h3>
                <div class="et-seg" role="group" aria-label="Duur">
                  <button type="button" class="is-on" data-time="1500">25m</button>
                  <button type="button" data-time="300">5m</button>
                  <button type="button" data-time="900">15m</button>
                </div>
                <div class="et-ring">
                  <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
                    <defs><linearGradient id="et-ring-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" style="stop-color: var(--et-accent)"></stop>
                      <stop offset="100%" style="stop-color: var(--et-accent-2)"></stop>
                    </linearGradient></defs>
                    <circle class="et-ring-bg" cx="66" cy="66" r="56"></circle>
                    <circle class="et-ring-fg" cx="66" cy="66" r="56"></circle>
                  </svg>
                  <div class="et-ring-text"><b id="et-pomo-time">25:00</b><small class="et-pomo-mode">focus</small></div>
                </div>
                <div class="et-row">
                  <button type="button" class="et-primary" id="et-pomo-toggle">Start</button>
                  <button type="button" class="et-ghost" id="et-pomo-reset" title="Reset" aria-label="Reset">${icon("reset")}</button>
                </div>
              </section>
            ` : ""}

            ${showQuickCalc ? `
              <section class="et-card et-calc">
                <h3 class="et-label">${icon("target")} Wat moet ik halen?</h3>
                <div class="et-fields">
                  <label>Huidig gemiddelde<input type="text" inputmode="decimal" autocomplete="off" id="et-calc-avg" value="6,5"></label>
                  <label title="Alle wegingen van je cijfers tot nu toe bij elkaar opgeteld">Totale weging tot nu<input type="text" inputmode="decimal" autocomplete="off" id="et-calc-weights" value="3"></label>
                  <label>Gewenst gemiddelde<input type="text" inputmode="decimal" autocomplete="off" id="et-calc-target" value="7,0"></label>
                  <label>Weging volgende toets<input type="text" inputmode="decimal" autocomplete="off" id="et-calc-future" value="1"></label>
                </div>
                <div class="et-need"><span>Je hebt nodig<small id="et-calc-hint"></small></span><b id="et-calc-needed" aria-live="polite">8,5</b></div>
              </section>
            ` : ""}
          `;

          if (showToday) container.classList.add("et-replaces-native");

          if (target.firstChild) {
            target.insertBefore(container, target.firstChild);
          } else {
            target.appendChild(container);
          }

          container.querySelector("#et-ig-card button")?.addEventListener("click", () => {
            container.querySelector("#et-ig-card")?.remove();
            try { chrome.storage.local.set({ eduarteInstagramDismissed: true }); } catch (e) { /* ignore */ }
          });

          // Lessen van vandaag (uit de agenda) voor de tijdlijn en de voortgang van de huidige les
          if (showToday && globalThis.EduarteAgenda) {
            const Agenda = globalThis.EduarteAgenda;
            const listEl = container.querySelector(".et-tl");
            const footEl = container.querySelector(".et-tl-foot");
            const countEl = container.querySelector(".et-lesson-count");
            const nowCard = container.querySelector(".et-now");
            const nowHours = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };

            const titleEl = container.querySelector(".et-today-title");
            const afterEl = nowCard?.querySelector(".et-after");
            const whenEl = nowCard?.querySelector(".et-when");
            const progress = nowCard?.querySelector(".et-progress");
            const metaOf = (l) => [l.location, l.participants].filter(Boolean).join(" · ");
            const dayName = (date) => {
              const d = Agenda.lessonDate(date, 12);
              const t = new Date();
              const tomorrow = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
              if (d.toDateString() === tomorrow.toDateString()) return "Morgen";
              const name = new Intl.DateTimeFormat("nl-NL", { weekday: "long" }).format(d);
              return name.charAt(0).toUpperCase() + name.slice(1);
            };
            const row = (l, state) => `<li class="${state}"><time>${Agenda.formatTime(l.start)}</time><i style="color:${Agenda.courseColor(l.title)}"></i>`
              + `<div><strong title="${escapeHtml(l.subject)}">${escapeHtml(l.title)}</strong><small>${escapeHtml(metaOf(l))} · tot ${Agenda.formatTime(l.end)}</small></div></li>`;

            // Kaart rechtsboven: de les van nu, of anders de eerstvolgende les met aftelling
            const renderNow = (current, next, nextLabel, minutesUntil) => {
              if (!nowCard) return;
              const set = (state, tag, title, meta) => {
                nowCard.classList.remove("is-live", "is-free", "is-next");
                nowCard.classList.add(state);
                nowCard.querySelector(".et-tag").textContent = tag;
                nowCard.querySelector("h4").textContent = title;
                nowCard.querySelector(".et-meta").textContent = meta;
              };
              progress.hidden = true;
              afterEl.hidden = true;
              whenEl.hidden = true;
              if (current) {
                const now = nowHours();
                const pct = Math.min(100, Math.max(0, ((now - current.start) / (current.end - current.start)) * 100));
                const left = Math.max(0, Math.round((current.end - now) * 60));
                set("is-live", "Nu bezig", current.title, metaOf(current));
                progress.hidden = false;
                progress.querySelector(".et-bar > div").style.width = `${pct}%`;
                progress.querySelector(".et-from").textContent = Agenda.formatTime(current.start);
                progress.querySelector(".et-to").textContent = Agenda.formatTime(current.end);
                progress.querySelector(".et-left").innerHTML = `nog <b>${left >= 60 ? `${Math.floor(left / 60)}u ${left % 60}m` : `${left}m`}</b>`;
                if (next && nextLabel === "Volgende les") {
                  afterEl.hidden = false;
                  afterEl.innerHTML = `Hierna <b>${escapeHtml(next.title)}</b> · ${Agenda.formatTime(next.start)}`;
                }
              } else if (next) {
                set("is-next", nextLabel, next.title, metaOf(next));
                whenEl.hidden = false;
                whenEl.innerHTML = `<span>${icon("clock")} ${Agenda.formatTime(next.start)} – ${Agenda.formatTime(next.end)}</span><b>${formatCountdown(minutesUntil)}</b>`;
              } else if (!native.lesson) {
                set("is-free", "Vrij", native.free || native.tomorrow || "Geen les op dit moment", native.free && native.tomorrow ? native.tomorrow : "");
              }
            };

            const renderToday = (lessons, week = []) => {
              const now = nowHours();
              const d = new Date();
              const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              const done = !lessons.length || lessons[lessons.length - 1].end <= now;
              const nextDate = week.map((l) => l.date).filter((date) => date > todayKey).sort()[0];
              const nextDay = nextDate ? week.filter((l) => l.date === nextDate).sort((a, b) => a.start - b.start) : [];

              if (countEl && lessons.length) {
                countEl.hidden = false;
                countEl.innerHTML = `${icon("book")} <b>${lessons.length}</b> ${lessons.length === 1 ? "les" : "lessen"} ${done ? "gehad" : "vandaag"}`;
              }

              // Is vandaag klaar, dan toont de lijst alvast de eerstvolgende lesdag
              if (done && nextDay.length) {
                if (titleEl) titleEl.textContent = dayName(nextDate);
                listEl.innerHTML = nextDay.map((l) => row(l, "")).join("");
                footEl.hidden = !lessons.length;
                footEl.innerHTML = `${icon("check")} Klaar voor vandaag`;
              } else if (!lessons.length) {
                if (titleEl) titleEl.textContent = "Vandaag";
                listEl.innerHTML = `<li class="et-empty" style="display:block">Geen lessen vandaag</li>`;
                footEl.hidden = true;
              } else {
                if (titleEl) titleEl.textContent = "Vandaag";
                listEl.innerHTML = lessons.map((l) => row(l, l.end <= now ? "is-past" : (l.start <= now ? "is-current" : ""))).join("");
                const last = lessons[lessons.length - 1];
                footEl.hidden = false;
                footEl.innerHTML = last.end <= now ? `${icon("check")} Klaar voor vandaag` : `${icon("check")} Vrij vanaf ${Agenda.formatTime(last.end)}`;
              }

              const current = lessons.find((l) => l.start <= now && l.end > now);
              const laterToday = lessons.find((l) => l.start > now);
              if (laterToday) {
                renderNow(current, laterToday, "Volgende les", (laterToday.start - now) * 60);
              } else if (nextDay.length) {
                const first = nextDay[0];
                renderNow(current, first, dayName(nextDate), (Agenda.lessonDate(first.date, first.start) - d) / 60000);
              } else {
                renderNow(current, null, "", 0);
              }
            };

            let todayLessons = [];
            let weekLessons = [];
            let loaded = false;
            Agenda.fetchAgendaDocument()
              .then((doc) => {
                todayLessons = Agenda.getTodayLessons(doc);
                weekLessons = Agenda.getWeekLessons(doc).lessons;
                loaded = true;
                renderToday(todayLessons, weekLessons);
              })
              .catch(() => { listEl.innerHTML = `<li class="et-empty" style="display:block">Kon de agenda niet laden.</li>`; });
            const refresh = window.setInterval(() => {
              if (!container.isConnected) return window.clearInterval(refresh);
              if (loaded) renderToday(todayLessons, weekLessons);
            }, 60 * 1000);
          }

          // Weer data ophalen
          if (showWeather) {
            const useLocation = settings.eduarteWeatherUseLocation !== false;
            const city = settings.eduarteWeatherCity || "Utrecht";
            const coordinates = useLocation ? settings.eduarteWeatherCoordinates : null;
            const locationLabel = settings.eduarteWeatherLocationLabel;
            const weatherEl = container.querySelector(".et-weather");

            function fetchWeatherData() {
              if (!weatherEl) return;
              weatherEl.innerHTML = `${icon("cloud")} <span>Weer laden…</span>`;

              chrome.runtime.sendMessage({
                type: "FETCH_WEATHER",
                city,
                coordinates,
                locationLabel,
              }, (res) => {
                if (chrome.runtime.lastError || !res || !res.success) {
                  weatherEl.innerHTML = `${icon("cloud")} <span>${escapeHtml(res?.error || "Weer niet beschikbaar")}</span>`;
                  return;
                }
                const info = WEATHER_CODES[res.weathercode] || { text: "Onbekend", icon: "⛅" };
                const weatherIcon = icon(weatherIconName(Number(res.weathercode), !!res.is_day));
                const rain = res.precipitation > 0 ? ` · ${icon("drop")} ${res.precipitation}%` : "";
                weatherEl.innerHTML = `${weatherIcon} <b>${Math.round(res.temp)}°</b> ${escapeHtml(info.text)} · ${escapeHtml(res.city || cityLabel)}${rain}`;
              });
            }

            weatherEl?.addEventListener("click", fetchWeatherData);
            fetchWeatherData();
            window.setInterval(fetchWeatherData, 15 * 60 * 1000);
            chrome.storage.onChanged.addListener((changes, areaName) => {
              if (areaName === "local" && changes.eduarteWeatherCoordinates && container.isConnected) {
                fetchWeatherData();
              }
            });
          }

          // Pomodoro Focus Timer logica
          if (showPomodoro) {
            const displayEl = container.querySelector("#et-pomo-time");
            const modeEl = container.querySelector(".et-pomo-mode");
            const ringEl = container.querySelector(".et-ring");
            const arcEl = container.querySelector(".et-ring-fg");
            const toggleBtn = container.querySelector("#et-pomo-toggle");
            const resetBtn = container.querySelector("#et-pomo-reset");
            const tabs = container.querySelectorAll(".et-seg button");
            const circumference = 2 * Math.PI * 56;
            const modes = { 1500: "focus", 300: "pauze", 900: "lange pauze" };

            let currentDuration = 1500;
            let timeLeft = 1500;
            let timerId = null;
            arcEl.style.strokeDasharray = String(circumference);

            function formatPomo(seconds) {
              const m = Math.floor(seconds / 60).toString().padStart(2, "0");
              const s = (seconds % 60).toString().padStart(2, "0");
              return `${m}:${s}`;
            }

            function updateDisplay() {
              displayEl.textContent = timeLeft > 0 ? formatPomo(timeLeft) : "Klaar!";
              modeEl.textContent = modes[currentDuration] || "focus";
              ringEl.classList.toggle("is-done", timeLeft === 0);
              arcEl.style.strokeDashoffset = String(circumference * (1 - timeLeft / currentDuration));
            }

            function stop(label) {
              clearInterval(timerId);
              timerId = null;
              toggleBtn.textContent = label;
            }

            tabs.forEach((tab) => {
              tab.addEventListener("click", () => {
                tabs.forEach((t) => t.classList.toggle("is-on", t === tab));
                stop("Start");
                currentDuration = Number(tab.dataset.time);
                timeLeft = currentDuration;
                updateDisplay();
              });
            });

            toggleBtn.addEventListener("click", () => {
              if (timerId) return stop("Hervat");
              if (timeLeft === 0) timeLeft = currentDuration;
              toggleBtn.textContent = "Pauze";
              timerId = setInterval(() => {
                if (timeLeft > 0) timeLeft--;
                if (timeLeft === 0) stop("Opnieuw");
                updateDisplay();
              }, 1000);
            });

            resetBtn.addEventListener("click", () => {
              stop("Start");
              timeLeft = currentDuration;
              updateDisplay();
            });
            updateDisplay();
          }

          // Snelle Cijfercalculator logica
          if (showQuickCalc) {
            const avgInput = container.querySelector("#et-calc-avg");
            const weightsInput = container.querySelector("#et-calc-weights");
            const targetInput = container.querySelector("#et-calc-target");
            const futureInput = container.querySelector("#et-calc-future");
            const neededOutput = container.querySelector("#et-calc-needed");
            const hintOutput = container.querySelector("#et-calc-hint");

            // Komma en punt werken allebei ("6,5" en "6.5")
            const readNumber = (input) => {
              const raw = input.value.trim().replace(",", ".");
              return /^\d+(\.\d*)?$|^\.\d+$/.test(raw) ? Number(raw) : NaN;
            };
            const nl = (value, digits = 1) => value.toLocaleString("nl-NL", { minimumFractionDigits: digits, maximumFractionDigits: digits });
            const STORE_KEY = "eduarteToolsQuickCalc";
            const fields = { avg: avgInput, weights: weightsInput, target: targetInput, future: futureInput };

            // Onthoud wat je invulde tot je volgende bezoek
            try {
              const saved = JSON.parse(window.localStorage.getItem(STORE_KEY) || "null");
              if (saved) Object.entries(fields).forEach(([key, input]) => { if (typeof saved[key] === "string" && saved[key]) input.value = saved[key]; });
            } catch { /* opslag niet beschikbaar: standaardwaarden blijven staan */ }

            function calcNeeded() {
              const curAvg = readNumber(avgInput);
              const curWeights = readNumber(weightsInput);
              const target = readNumber(targetInput);
              const futureWeight = readNumber(futureInput);
              const valid = {
                avg: curAvg >= 1 && curAvg <= 10,
                weights: curWeights > 0,
                target: target >= 1 && target <= 10,
                future: futureWeight > 0,
              };
              Object.entries(fields).forEach(([key, input]) => input.classList.toggle("is-invalid", input.value.trim() !== "" && !valid[key]));
              neededOutput.className = "";

              if (!Object.values(valid).every(Boolean)) {
                neededOutput.textContent = "—";
                neededOutput.className = "is-empty";
                hintOutput.textContent = !valid.avg || !valid.target ? "vul cijfers tussen 1 en 10 in" : "vul een weging groter dan 0 in";
                return;
              }

              try {
                window.localStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value.trim()]))));
              } catch { /* niet erg */ }

              const needed = (target * (curWeights + futureWeight) - curAvg * curWeights) / futureWeight;
              // Naar boven afronden op één decimaal: met een 8,4 haal je een benodigde 8,41 net niet
              const rounded = Math.ceil((needed - 1e-9) * 10) / 10;
              const goal = `voor een ${nl(target)} gemiddeld`;
              if (rounded > 10) {
                const best = (curAvg * curWeights + 10 * futureWeight) / (curWeights + futureWeight);
                neededOutput.textContent = nl(rounded);
                neededOutput.className = "is-bad";
                hintOutput.textContent = `niet haalbaar met één toets · met een 10 kom je op ${nl(Math.floor(best * 10 + 1e-9) / 10)}`;
              } else if (rounded <= 1) {
                neededOutput.textContent = nl(1);
                neededOutput.className = "is-ok";
                hintOutput.textContent = `elk cijfer is genoeg ${goal}`;
              } else {
                neededOutput.textContent = nl(rounded);
                hintOutput.textContent = goal;
              }
            }

            [avgInput, weightsInput, targetInput, futureInput].forEach((inp) => inp.addEventListener("input", calcNeeded));
            calcNeeded();
          }
        }

        tryMount();
        const obs = new MutationObserver(() => tryMount());
        obs.observe(document.documentElement, { childList: true, subtree: true });
        setTimeout(() => obs.disconnect(), 15000);
      }
    );
  }

  // --- CIJFEROVERZICHT & CALCULATOR OVERLAY ---
  function initGradesOverlay() {
    if (!/\/resultaten(?:\/|$)/i.test(location.pathname)) return;
    const ROOT_ID = "eduarte-tools-overlay";
    if (document.getElementById(ROOT_ID)) return;

    chrome.storage.local.get(
      ["eduarteGradesEnabled", "eduarteGradeMinimum", "eduarteGradeMaximum", "eduartePassThreshold"],
      (settings) => {
        if (settings.eduarteGradesEnabled === false) return;
        createOverlay(settings);
      }
    );

    function createOverlay(settings) {
      const clampGrade = (grade) => Math.max(0, Math.min(10, grade));
      const gradeMinimum = clampGrade(Number.isFinite(Number(settings.eduarteGradeMinimum)) ? Number(settings.eduarteGradeMinimum) : 1);
      const gradeMaximum = Math.max(gradeMinimum, clampGrade(Number.isFinite(Number(settings.eduarteGradeMaximum)) ? Number(settings.eduarteGradeMaximum) : 10));
      const passThreshold = Math.max(gradeMinimum, Math.min(gradeMaximum,
        Number.isFinite(Number(settings.eduartePassThreshold)) ? Number(settings.eduartePassThreshold) : 5.5));
      const root = document.createElement("div");
      root.id = ROOT_ID;
      const shadow = root.attachShadow({ mode: "closed" });
      document.documentElement.appendChild(root);

      shadow.innerHTML = `
        <style>
          :host {
            all: initial;
            --grade-primary: var(--md-sys-color-primary, #2563eb);
            --grade-on-primary: var(--md-sys-color-on-primary, #fff);
            --grade-primary-container: var(--md-sys-color-primary-container, #dbeafe);
            --grade-surface: var(--md-sys-color-surface-container, #1f2937);
            --grade-surface-high: var(--md-sys-color-surface-container-high, #273449);
            --grade-on-surface: var(--md-sys-color-on-surface, #f8fafc);
            --grade-on-surface-variant: var(--md-sys-color-on-surface-variant, #94a3b8);
            --grade-outline: var(--md-sys-color-outline-variant, #475569);
          }
          * { box-sizing: border-box; }
          .toggle {
            position: fixed; z-index: 2147483646; right: 18px; bottom: 20px;
            display: grid; place-items: center;
            width: 48px; height: 48px; border: 0; border-radius: 14px;
            color: var(--grade-on-primary); background: var(--grade-primary);
            box-shadow: 0 3px 10px rgba(0,0,0,.2); cursor: pointer;
            transition: box-shadow .18s ease, background-color .18s ease, transform .18s ease;
          }
          .toggle svg { width: 24px; height: 24px; fill: currentColor; }
          .toggle:hover { box-shadow: 0 5px 14px rgba(0,0,0,.24); transform: scale(1.04); }
          .panel {
            position: fixed; z-index: 2147483645; top: 16px; right: 16px; bottom: 16px;
            width: min(360px, calc(100vw - 32px)); padding: 22px; overflow: auto;
            color: var(--grade-on-surface); background: var(--grade-surface); border: 1px solid var(--grade-outline);
            border-radius: 26px 26px 8px 26px; box-shadow: 0 8px 24px rgba(0,0,0,.3);
            backdrop-filter: blur(22px); font: 14px/1.45 system-ui, sans-serif;
            transform: translateX(calc(100% + 32px)); opacity: 0;
            transition: transform .32s cubic-bezier(.22,1,.36,1), opacity .2s ease;
          }
          .panel.open { transform: translateX(0); opacity: 1; }
          .head { display:flex; align-items:center; justify-content:space-between; gap: 12px; margin-bottom: 18px; }
          h2 { margin: 0; font-size: 20px; letter-spacing: -.03em; }
          .eyebrow { margin: 0 0 3px; color: var(--grade-primary); font-size: 11px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
          .close, .icon { border: 0; color: var(--grade-on-surface-variant); background: var(--grade-surface-high); cursor:pointer; }
          .close { width: 36px; height: 36px; border-radius: 50%; font-size: 18px; }
          .close:hover, .icon:hover { background: var(--grade-primary-container); color: var(--grade-on-surface); }
          .intro, .message { color: var(--grade-on-surface-variant); font-size: 12px; }
          .intro { margin: 0 0 16px; }
          .tabs { display:flex; gap:4px; padding:4px; margin-bottom:14px; border-radius:999px; background:var(--grade-surface-high); }
          .tab { flex:1; min-width:0; min-height:36px; border:0; border-radius:999px; color:var(--grade-on-surface-variant); background:transparent; cursor:pointer; font:600 11px system-ui,sans-serif; }
          .tab[aria-selected="true"] { color:var(--grade-on-primary); background:var(--grade-primary); }
          .view[hidden] { display:none; }
          .rows { display: none; }
          .cc-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
          .cc-title { margin: 0; color: var(--grade-on-surface); font-size: 15px; font-weight: 700; }
          .cc-add { display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: 1px solid var(--grade-outline); border-radius: 50%; background: var(--grade-surface-high); color: var(--grade-on-surface); font: 400 22px/1 inherit; cursor: pointer; transition: border-radius .2s, background-color .15s, transform .2s; }
          .cc-add:hover { border-color: var(--grade-primary); }
          .cc-add[aria-expanded="true"] { border-radius: 12px; background: var(--grade-primary); color: var(--grade-on-primary); transform: rotate(45deg); }
          .cc-empty { margin: 4px 0 12px; color: var(--grade-on-surface-variant); font-size: 13px; line-height: 1.5; }
          .cc-empty[hidden], .cc-form[hidden], .cc-body[hidden], .cc-error[hidden] { display: none; }
          .cc-form { margin: 4px 0 12px; padding: 12px; border: 1px solid var(--grade-outline); border-radius: 20px; background: var(--grade-surface-high); }
          .cc-form p { margin: 0 0 8px; color: var(--grade-on-surface-variant); font-size: 12px; }
          .cc-form > div { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; }
          .cc-form .cc-error { margin: 8px 0 0; color: #f87171; }
          .entries { display: grid; gap: 2px; max-height: 240px; overflow: auto; }
          .entry { display: block; width: 100%; margin: 0; padding: 7px 10px; overflow: hidden; border: 0; border-radius: 10px; background: transparent; color: var(--grade-on-surface); font: inherit; font-size: 13px; text-align: left; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
          .entry b { font-variant-numeric: tabular-nums; }
          .entry span { color: var(--grade-on-surface-variant); }
          .entry:hover, .entry:focus-visible { background: color-mix(in srgb, #f87171 18%, transparent); text-decoration: line-through; outline: none; }
          hr { height: 1px; margin: 14px 0; border: 0; background: var(--grade-outline); }
          .cc-body .metrics { display: flex; gap: 8px; margin-top: 0; }
          .cc-body .metric { flex: 1; padding: 0; border: 0; border-radius: 0; background: transparent; }
          .cc-body .metric span { display: block; margin-bottom: 2px; font-size: 11px; }
          .cc-body .metric b { font-size: 20px; }
          .cc-body .metrics.two { margin-top: 14px; }
          .cc-question { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--grade-on-surface); font-size: 13px; line-height: 1.35; }
          .cc-question + .cc-question { margin-top: 8px; }
          .cc-question span { flex: 2; text-wrap: balance; }
          .cc-question input { flex: 1; min-width: 0; margin: 0; }
          .cc-body .prediction { margin-top: 0; }
          .row { display:grid; grid-template-columns: 1fr 1fr 32px; gap: 7px; animation: enter .25s both; }
          input { width:100%; min-width: 0; min-height: 40px; padding: 9px 10px; border: 1px solid var(--grade-outline); border-radius: 14px 14px 5px 14px; outline: 0; color:var(--grade-on-surface); background: var(--grade-surface-high); font: inherit; }
          input:focus { border: 2px solid var(--grade-primary); padding: 8px 9px; }
          .icon { border-radius: 12px; font-size: 16px; }
          .actions { display:flex; flex-wrap:wrap; align-items:center; gap: 8px; margin: 12px 0 16px; }
          button.action { display:inline-flex; flex:0 1 auto; align-items:center; justify-content:center; min-height: 40px; padding: 0 18px; border: 1px solid var(--grade-outline); border-radius: 999px; color:var(--grade-on-surface); background: var(--grade-surface-high); cursor:pointer; font: 600 12px system-ui; transition: background-color .16s ease, border-color .16s ease, box-shadow .16s ease; }
          button.action.primary { border-color: transparent; color: var(--grade-on-primary); background: var(--grade-primary); }
          button.action:hover { border-color: var(--grade-primary); box-shadow: 0 1px 3px rgba(0,0,0,.2); }
          button.action.primary:hover { filter: brightness(1.08); }
          .settings { display:grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          label { color:var(--grade-on-surface-variant); font-size: 11px; }
          label input { display:block; margin-top: 5px; }
          .metrics { display:grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
          .metric { min-width: 0; padding: 12px; border:1px solid var(--grade-outline); border-radius: 22px; background: var(--grade-surface-high); }
          .metric b { display:block; color:var(--grade-on-surface); font-size: 20px; letter-spacing:-.03em; }
          .metric span { color:var(--grade-on-surface-variant); font-size: 10px; }
          .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
          .stats-grid .metric { border-radius:22px; }
          .histogram { display:grid; gap:6px; margin-top:14px; }
          .histogram-row { display:grid; grid-template-columns:28px 1fr 28px; align-items:center; gap:8px; color:var(--grade-on-surface-variant); font-size:11px; }
          .histogram-track { height:8px; overflow:hidden; border-radius:999px; background:var(--grade-surface-high); }
          .histogram-bar { height:100%; min-width:0; border-radius:inherit; background:var(--grade-primary); }
          .grade-list { display:grid; gap:6px; margin-top:10px; }
          .grade-list-item { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px; border:1px solid var(--grade-outline); border-radius:18px; background:var(--grade-surface-high); }
          .grade-list-item span { min-width:0; overflow:hidden; color:var(--grade-on-surface-variant); text-overflow:ellipsis; white-space:nowrap; }
          .grade-list-item b { color:var(--grade-on-surface); font-variant-numeric:tabular-nums; }
          .sort { min-height:38px; padding:0 12px; border:1px solid var(--grade-outline); border-radius:999px; color:var(--grade-on-surface); background:var(--grade-surface-high); font:inherit; }
          .prediction { margin-top: 14px; }
          .prediction[hidden] { display: none; }
          .advice { margin: 0 0 10px; color: var(--grade-on-surface); font-size: 13px; line-height: 1.45; text-wrap: balance; }
          .advice.is-warn { color: #f87171; }
          .chart { position: relative; height: 150px; overflow: hidden; border: 1px solid var(--grade-outline); border-radius: 22px; background: var(--grade-surface-high); cursor: crosshair; touch-action: none; }
          .chart svg { position: absolute; inset: 0; width: 100%; height: 100%; }
          .chart-dot { position: absolute; z-index: 1; display: none; width: 10px; height: 10px; border-radius: 50%; background: var(--grade-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--grade-primary) 30%, transparent); transform: translate(-50%, -50%); pointer-events: none; }
          .chart-tip { position: absolute; z-index: 2; display: none; padding: 3px 8px; border-radius: 999px; background: var(--grade-surface); color: var(--grade-on-surface); font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; pointer-events: none; }
          .chart-tip.is-ok { color: #34d399; }
          .chart-tip.is-warn { color: #f87171; }
          .chart-axis { display: flex; justify-content: space-between; gap: 8px; margin-top: 5px; color: var(--grade-on-surface-variant); font-size: 10px; font-variant-numeric: tabular-nums; }
          .backup-description { color:var(--grade-on-surface-variant); font-size:12px; line-height:1.5; }
          .message { min-height: 36px; margin: 13px 0 0; }
          @keyframes enter { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }
          @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
        </style>
        <button class="toggle" aria-label="Open cijfercalculator" title="Cijfercalculator" aria-expanded="false">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 2v4h10V4H7Zm0 6v2h2v-2H7Zm4 0v2h2v-2h-2Zm4 0v2h2v-2h-2ZM7 14v2h2v-2H7Zm4 0v2h2v-2h-2Zm4 0v6h2v-6h-2ZM7 18v2h2v-2H7Zm4 0v2h2v-2h-2Z"/></svg>
        </button>
        <aside class="panel" aria-hidden="true">
          <div class="head"><div><p class="eyebrow">Eduarte Tools</p><h2>Cijferoverzicht</h2></div><button class="close" aria-label="Sluiten">×</button></div>
          <p class="intro">Selecteer cijfers uit je cijferlijst of voeg ze hieronder toe. De berekening wordt meteen bijgewerkt.</p>
          <div class="tabs" role="tablist" aria-label="Cijfertools">
            <button class="tab" type="button" role="tab" data-tab="calculator" aria-selected="true">Rekenen</button>
            <button class="tab" type="button" role="tab" data-tab="statistics" aria-selected="false">Stats</button>
            <button class="tab" type="button" role="tab" data-tab="list" aria-selected="false">Lijst</button>
            <button class="tab" type="button" role="tab" data-tab="backup" aria-selected="false">Back-up</button>
          </div>
          <section class="view" data-view="calculator">
            <div class="cc-head">
              <h3 class="cc-title">Cijfercalculator</h3>
              <button class="cc-add" type="button" data-action="add" title="Cijfer handmatig toevoegen" aria-label="Cijfer handmatig toevoegen" aria-expanded="false">+</button>
            </div>
            <p class="cc-empty">Bereken hier welk cijfer je moet halen of wat je gemiddelde zal zijn.<br><br>Klik op cijfers in je cijferlijst of voeg ze met + handmatig toe om te beginnen.</p>
            <form class="cc-form" hidden novalidate>
              <p>Voer het cijfer en de weging in.</p>
              <div><input class="cc-grade" type="text" inputmode="decimal" autocomplete="off" placeholder="Cijfer" aria-label="Cijfer"><input class="cc-weight" type="text" inputmode="decimal" autocomplete="off" placeholder="Weging" aria-label="Weging"><button class="action primary" type="submit">Toevoegen</button></div>
              <p class="cc-error" role="alert" hidden></p>
            </form>
            <div class="entries"></div>
            <div class="rows" hidden></div>
            <div class="actions"><button class="action" data-action="scan">Cijferlijst scannen</button></div>
            <div class="cc-body" hidden>
              <hr>
              <div class="metrics"><div class="metric"><span title="Gewogen gemiddelde">Gemiddelde</span><b class="average">—</b></div><div class="metric"><span>Mediaan</span><b class="median">—</b></div><div class="metric"><span>Totale weging</span><b class="total-weight">—</b></div></div>
              <hr>
              <label class="cc-question"><span>Hoe vaak telt het volgende cijfer mee?</span><input class="future" type="number" min=".1" step=".1" placeholder="1x"></label>
              <label class="cc-question"><span>Welk gemiddelde wil je halen?</span><input class="target" type="number" min="${gradeMinimum}" max="${gradeMaximum}" step=".1" value="${passThreshold}"></label>
              <hr>
            <div class="prediction" hidden>
              <p class="advice"></p>
              <div class="chart" role="img" aria-label="Grafiek: cijfer voor je volgende toets tegen je nieuwe gemiddelde">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
                <i class="chart-dot"></i><span class="chart-tip"></span>
              </div>
              <div class="chart-axis"><span class="axis-min"></span><span>volgend cijfer → nieuw gemiddelde</span><span class="axis-max"></span></div>
            </div>
              <div class="metrics two"><div class="metric"><span>Benodigd cijfer</span><b class="needed">—</b></div><div class="metric"><span>Nieuw gemiddelde</span><b class="result">—</b></div></div>
            </div>
            <div class="actions"><button class="action" data-action="export">CSV exporteren</button></div>
          </section>
          <section class="view" data-view="statistics" hidden>
            <div class="stats-grid">
              <div class="metric"><b class="stat-mean">—</b><span>Gemiddelde</span></div>
              <div class="metric"><b class="stat-median">—</b><span>Mediaan</span></div>
              <div class="metric"><b class="stat-mode">—</b><span>Modus</span></div>
              <div class="metric"><b class="stat-deviation">—</b><span>Standaardafwijking</span></div>
              <div class="metric"><b class="stat-range">—</b><span>Laagste – hoogste</span></div>
              <div class="metric"><b class="stat-pass">—</b><span>Voldoende / onvoldoende</span></div>
            </div>
            <div class="histogram" aria-label="Cijferverdeling"></div>
          </section>
          <section class="view" data-view="list" hidden>
            <label>Sorteren
              <select class="sort">
                <option value="source">Volgorde cijferlijst</option>
                <option value="asc">Cijfer oplopend</option>
                <option value="desc">Cijfer aflopend</option>
              </select>
            </label>
            <div class="grade-list"></div>
          </section>
          <section class="view" data-view="backup" hidden>
            <p class="backup-description">Bewaar je geselecteerde cijfers en wegingen lokaal als bestand, of zet eerder opgeslagen cijfers terug. Er worden geen gegevens geüpload.</p>
            <div class="actions">
              <button class="action primary" data-action="backup-export">Back-up downloaden</button>
              <button class="action" data-action="backup-import">Back-up importeren</button>
              <input class="backup-file" type="file" accept=".json,.stgrades,application/json" hidden>
            </div>
            <div class="actions"><button class="action" data-action="export">CSV exporteren</button></div>
          </section>
          <p class="message">Scan de cijferlijst en klik op de cijfers die je wilt meenemen.</p>
        </aside>
      `;

      const panel = shadow.querySelector(".panel");
      const rows = shadow.querySelector(".rows");
      const message = shadow.querySelector(".message");
      const input = (className) => shadow.querySelector(`.${className}`);
      const format = (value) => Number.isFinite(value) ? value.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
      const sourceElements = new Map();

      // Lijst "Cijfers in berekening", zoals in Study Tools: klik op een regel om het cijfer te verwijderen
      function renderEntries(entries) {
        const list = shadow.querySelector(".entries");
        shadow.querySelector(".cc-title").textContent = entries.length ? `Cijfers in berekening (${entries.length})` : "Cijfercalculator";
        shadow.querySelector(".cc-empty").hidden = entries.length > 0;
        shadow.querySelector(".cc-body").hidden = entries.length === 0;
        list.replaceChildren(...entries.map(({ result, weight, row, manual, title }) => {
          const entry = document.createElement("button");
          entry.type = "button";
          entry.className = "entry";
          entry.title = "Verwijderen";
          const grade = document.createElement("b");
          grade.textContent = result.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
          const rest = document.createElement("span");
          rest.textContent = ` (${weight.toLocaleString("nl-NL", { maximumFractionDigits: 2 })}x) — ${manual ? "Handmatig toegevoegd" : title}`;
          entry.append(grade, rest);
          entry.addEventListener("click", () => row.querySelector(".icon").click());
          return entry;
        }));
      }

      function addRow(grade = "", weight = "1", sourceKey = "", title = "") {
        const row = document.createElement("div");
        row.className = "row";
        row.dataset.source = sourceKey;
        row.dataset.title = title;
        row.innerHTML = `<input class="grade" type="number" min="${gradeMinimum}" max="${gradeMaximum}" step=".1" placeholder="Cijfer" value="${grade}"><input class="weight" type="number" min=".1" step=".1" placeholder="Weging" value="${weight}"><button class="icon" aria-label="Verwijderen">×</button>`;
        row.querySelector(".icon").addEventListener("click", () => {
          if (row.dataset.source) sourceElements.get(row.dataset.source)?.classList.remove("eduarte-tools-grade-selected");
          row.remove();
          calculate();
        });
        row.querySelectorAll("input").forEach((field) => field.addEventListener("input", calculate));
        rows.appendChild(row);
      }

      function calculate() {
        const values = [...rows.querySelectorAll(".row")].map((row, index) => ({
          result: row.querySelector(".grade").value.trim() === "" ? NaN : Number(row.querySelector(".grade").value),
          weight: row.querySelector(".weight").value.trim() === "" ? NaN : Number(row.querySelector(".weight").value),
          title: row.dataset.title || `Cijfer ${index + 1}`,
          manual: !row.dataset.title,
          row,
          index,
        }));
        const validValues = values.filter(({ result, weight }) =>
          Number.isFinite(result) && result >= gradeMinimum && result <= gradeMaximum &&
          Number.isFinite(weight) && weight > 0
        );
        renderStatistics(validValues);
        renderList(validValues);
        renderEntries(validValues);
        if (!validValues.length) {
          ["average", "median", "total-weight", "needed", "result"].forEach((name) => input(name).textContent = "—");
          message.textContent = "Voeg cijfers toe of scan je cijferlijst.";
          renderPrediction(null, 0, passThreshold);
          return;
        }
        const target = Number(input("target").value);
        const calculator = globalThis.EduarteGradeCalculator;
        const preliminary = calculator.calculateGradeSummary(validValues, target, 1, gradeMinimum, gradeMaximum);
        const futureInput = input("future").value.trim();
        const future = futureInput ? Number(futureInput) : (preliminary.medianWeight || 1);
        input("future").placeholder = `${(preliminary.medianWeight || 1).toLocaleString("nl-NL", { maximumFractionDigits: 2 })}x`;
        const summary = calculator.calculateGradeSummary(validValues, target, future, gradeMinimum, gradeMaximum);
        input("average").textContent = format(summary.weightedAverage);
        input("median").textContent = format(summary.median);
        input("total-weight").textContent = `${format(summary.totalWeight)}×`;
        renderPrediction(
          summary,
          Number.isFinite(future) && future > 0 ? future : 0,
          Number.isFinite(target) && target >= gradeMinimum && target <= gradeMaximum ? target : passThreshold
        );
        if (summary.needed === undefined) {
          input("needed").textContent = "—";
          input("result").textContent = "—";
          message.textContent = `Vul een doel tussen ${format(gradeMinimum)} en ${format(gradeMaximum)} en een weging groter dan 0 in.`;
          return;
        }
        input("needed").textContent = summary.needed <= gradeMinimum
          ? `≤ ${format(gradeMinimum)}`
          : format(summary.roundedNeeded);
        input("result").textContent = format(summary.projectedAverage);
        message.textContent = !summary.achievable
          ? `Met een ${format(gradeMaximum)} wordt je gemiddelde ${format(summary.projectedAverage)}; je doel is niet haalbaar met één cijfer.`
          : summary.needed <= gradeMinimum
            ? `Je ligt op koers voor een gemiddelde van ${format(target)}; een ${format(gradeMinimum)} is voldoende.`
            : `${summary.currentlyPassing ? "Je staat voldoende. " : ""}Je hebt minimaal een ${format(summary.roundedNeeded)} nodig voor ${format(target)}.`;
      }

      // Voorspelling met grafiek, overgenomen van de cijfercalculator van Study Tools (MIT, Quinten Althues):
      // nieuw gemiddelde = helling × volgend cijfer + snijpunt
      const chart = shadow.querySelector(".chart");
      let line = null;
      function renderPrediction(summary, future, goal) {
        const box = shadow.querySelector(".prediction");
        const advice = shadow.querySelector(".advice");
        if (!summary || !(future > 0)) {
          box.hidden = true;
          line = null;
          return;
        }
        const weightedTotal = summary.weightedAverage * summary.totalWeight;
        const slope = future / (summary.totalWeight + future);
        const intercept = weightedTotal / (summary.totalWeight + future);
        const span = gradeMaximum - gradeMinimum;
        const norm = (value) => ((value - gradeMinimum) / span) * 100;
        line = { slope, intercept };
        box.hidden = false;

        const one = (value) => value.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        const weight = future.toLocaleString("nl-NL", { maximumFractionDigits: 2 });
        const needed = (goal * (summary.totalWeight + future) - weightedTotal) / future;
        const goalText = goal === passThreshold ? "voldoende" : `op een ${one(goal)}`;
        advice.className = "advice";
        if (needed > gradeMaximum) {
          advice.textContent = `Met een cijfer dat ${weight}× meetelt, kun je niet hoger dan een ${format(slope * gradeMaximum + intercept)} komen te staan.`;
          advice.classList.add("is-warn");
        } else if (needed < gradeMinimum) {
          advice.textContent = `Met een cijfer dat ${weight}× meetelt, kun je niet lager dan een ${format(slope * gradeMinimum + intercept)} komen te staan.`;
        } else {
          const atLeast = one(Math.ceil((needed - 1e-9) * 10) / 10);
          advice.textContent = `Haal ten minste een ${atLeast} die ${weight}× meetelt om ${goalText} ${summary.weightedAverage < goal ? "te komen" : "te blijven"} staan.`;
        }

        const grid = Array.from({ length: Math.max(0, Math.round(span) - 1) }, (_, index) => {
          const at = ((index + 1) / Math.round(span)) * 100;
          return `<line x1="${at}" y1="0" x2="${at}" y2="100"/><line x1="0" y1="${at}" x2="100" y2="${at}"/>`;
        }).join("");
        const threshold = norm(goal);
        line.goal = goal;
        chart.querySelector("svg").innerHTML = `
          <g stroke="var(--grade-outline)" stroke-width=".5" vector-effect="non-scaling-stroke" opacity=".6">${grid}</g>
          <rect x="0" y="0" width="${threshold}" height="100" fill="#f87171" fill-opacity=".07"/>
          <rect x="0" y="${100 - threshold}" width="100" height="${threshold}" fill="#f87171" fill-opacity=".07"/>
          <line x1="0" y1="${100 - norm(slope * gradeMinimum + intercept)}" x2="100" y2="${100 - norm(slope * gradeMaximum + intercept)}"
            stroke="var(--grade-primary)" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
        shadow.querySelector(".axis-min").textContent = one(gradeMinimum);
        shadow.querySelector(".axis-max").textContent = one(gradeMaximum);
        hideChartTip();
      }

      function hideChartTip() {
        chart.querySelector(".chart-dot").style.display = "none";
        chart.querySelector(".chart-tip").style.display = "none";
      }

      function showChartTip(clientX) {
        if (!line) return;
        const rect = chart.getBoundingClientRect();
        if (!rect.width) return;
        const span = gradeMaximum - gradeMinimum;
        // Op tienden van een cijfer vastklikken
        const raw = gradeMinimum + Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * span;
        const grade = Math.round(raw * 10) / 10;
        const average = line.slope * grade + line.intercept;
        const x = ((grade - gradeMinimum) / span) * 100;
        const y = 100 - ((average - gradeMinimum) / span) * 100;
        const dot = chart.querySelector(".chart-dot");
        const tip = chart.querySelector(".chart-tip");
        dot.style.display = "block";
        dot.style.left = `${x}%`;
        dot.style.top = `${y}%`;
        tip.style.display = "block";
        tip.textContent = `${grade.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ➜ ${format(average)}`;
        tip.className = `chart-tip ${average >= line.goal - 1e-9 ? "is-ok" : "is-warn"}`;
        const half = (tip.offsetWidth / 2 / rect.width) * 100;
        tip.style.left = `${Math.min(100 - half, Math.max(half, x))}%`;
        tip.style.top = `${y}%`;
        tip.style.transform = (y / 100) * rect.height - tip.offsetHeight - 12 < 0 ? "translate(-50%, 40%)" : "translate(-50%, -140%)";
      }

      chart.addEventListener("pointermove", (event) => showChartTip(event.clientX));
      chart.addEventListener("pointerdown", (event) => showChartTip(event.clientX));
      chart.addEventListener("pointerleave", hideChartTip);

      function renderStatistics(entries) {
        const statistics = globalThis.EduarteGradeCalculator.calculateGradeStatistics(
          entries, passThreshold
        );
        if (!statistics) {
          ["stat-mean", "stat-median", "stat-mode", "stat-deviation", "stat-range", "stat-pass"]
            .forEach((name) => input(name).textContent = "—");
          shadow.querySelector(".histogram").replaceChildren();
          return;
        }
        input("stat-mean").textContent = format(statistics.mean);
        input("stat-median").textContent = format(statistics.median);
        input("stat-mode").textContent = statistics.modes.length
          ? `${statistics.modes.map(format).join(", ")} (${statistics.modeCount}×)`
          : "Geen";
        input("stat-deviation").textContent = format(statistics.standardDeviation);
        input("stat-range").textContent = `${format(statistics.minimum)} – ${format(statistics.maximum)}`;
        input("stat-pass").textContent = `${statistics.sufficient} / ${statistics.insufficient}`;

        const histogram = shadow.querySelector(".histogram");
        histogram.replaceChildren();
        const maxCount = Math.max(1, ...statistics.distribution.map(({ count }) => count));
        statistics.distribution.forEach(({ grade, count }) => {
          const item = document.createElement("div");
          item.className = "histogram-row";
          const label = document.createElement("span");
          label.textContent = String(grade);
          const track = document.createElement("div");
          track.className = "histogram-track";
          const bar = document.createElement("div");
          bar.className = "histogram-bar";
          bar.style.width = `${(count / maxCount) * 100}%`;
          const value = document.createElement("span");
          value.textContent = String(count);
          track.appendChild(bar);
          item.append(label, track, value);
          histogram.appendChild(item);
        });
      }

      function renderList(entries) {
        const list = shadow.querySelector(".grade-list");
        const sort = input("sort").value;
        const sorted = [...entries];
        if (sort === "asc") sorted.sort((a, b) => a.result - b.result || a.index - b.index);
        if (sort === "desc") sorted.sort((a, b) => b.result - a.result || a.index - b.index);
        list.replaceChildren();
        sorted.forEach(({ result, weight, title }) => {
          const item = document.createElement("div");
          item.className = "grade-list-item";
          const description = document.createElement("span");
          description.textContent = `${title} · weging ${format(weight)}×`;
          const value = document.createElement("b");
          value.textContent = format(result);
          item.append(description, value);
          list.appendChild(item);
        });
        if (!sorted.length) {
          const empty = document.createElement("p");
          empty.className = "backup-description";
          empty.textContent = "Scan de cijferlijst of voeg cijfers toe om hier cijfers te zien.";
          list.appendChild(empty);
        }
      }

      function exportCsv() {
        const values = [...rows.querySelectorAll(".row")].map((row) => ({
          grade: row.querySelector(".grade").value,
          weight: row.querySelector(".weight").value,
        })).filter(({ grade, weight }) => {
          const result = Number(grade);
          const rowWeight = Number(weight);
          return grade !== "" && weight !== "" && Number.isFinite(result) &&
            result >= gradeMinimum && result <= gradeMaximum &&
            Number.isFinite(rowWeight) && rowWeight > 0;
        });

        if (!values.length) {
          message.textContent = "Geen cijfers om te exporteren. Voeg cijfers toe of scan je cijferlijst.";
          return;
        }

        const header = "Cijfer,Weging\n";
        const body = values.map(({ grade, weight }) => `${grade.replace(".", ",")},${weight.replace(".", ",")}`).join("\n");
        const csvContent = header + body;

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const dateStr = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `eduarte-cijfers-${dateStr}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        message.textContent = `${values.length} cijfers geëxporteerd naar CSV.`;
      }

      function exportBackup() {
        const grades = [...rows.querySelectorAll(".row")].map((row) => ({
          result: row.querySelector(".grade").value.trim() === "" ? NaN : Number(row.querySelector(".grade").value),
          weight: row.querySelector(".weight").value.trim() === "" ? NaN : Number(row.querySelector(".weight").value),
          title: row.dataset.title || "",
        })).filter(({ result, weight }) =>
          Number.isFinite(result) && result >= gradeMinimum && result <= gradeMaximum &&
          Number.isFinite(weight) && weight > 0
        );
        if (!grades.length) {
          message.textContent = "Geen geldige cijfers om op te slaan.";
          return;
        }
        const backup = {
          format: "eduarte-tools-grades",
          version: 1,
          createdAt: new Date().toISOString(),
          grades,
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `eduarte-cijfers-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        message.textContent = `${grades.length} cijfers opgeslagen in de back-up.`;
      }

      async function importBackup(file) {
        try {
          const grades = globalThis.EduarteGradeCalculator.parseGradeBackup(
            await file.text(), gradeMinimum, gradeMaximum
          );
          sourceElements.forEach((element) => {
            element.classList.remove("eduarte-tools-grade-source", "eduarte-tools-grade-selected");
          });
          sourceElements.clear();
          rows.replaceChildren();
          grades.forEach(({ result, weight, title }) => addRow(result, weight, "", title));
          calculate();
          message.textContent = `${grades.length} cijfers uit de back-up geladen.`;
        } catch (error) {
          message.textContent = error instanceof Error ? error.message : "De back-up kon niet worden ingelezen.";
        }
      }

      const readGradeCells = () => globalThis.EduarteApi.getGrades(document, {
        minimum: gradeMinimum,
        maximum: gradeMaximum,
      });

      function scan() {
        const grades = readGradeCells();
        rows.innerHTML = "";
        sourceElements.forEach((element) => {
          element.classList.remove("eduarte-tools-grade-source", "eduarte-tools-grade-selected");
        });
        sourceElements.clear();
        grades.forEach(({ element, result, weight, id, title }, index) => {
          const sourceKey = String(id);
          sourceElements.set(sourceKey, element);
          element.classList.add("eduarte-tools-grade-source");
          if (element.dataset.eduarteToolsGradeListener !== "true") {
            element.dataset.eduarteToolsGradeListener = "true";
            element.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              const key = element.dataset.eduarteToolsGradeKey;
              const existing = [...rows.querySelectorAll(".row")].find((row) => row.dataset.source === key);
              if (existing) {
                existing.remove();
                element.classList.remove("eduarte-tools-grade-selected");
              } else {
                element.classList.add("eduarte-tools-grade-selected");
                addRow(
                  element.dataset.eduarteToolsGradeValue,
                  element.dataset.eduarteToolsGradeWeight,
                  key,
                  element.dataset.eduarteToolsGradeTitle
                );
              }
              calculate();
            });
          }
          element.dataset.eduarteToolsGradeKey = sourceKey;
          element.dataset.eduarteToolsGradeValue = String(result);
          element.dataset.eduarteToolsGradeWeight = String(weight);
          element.dataset.eduarteToolsGradeTitle = title || `Cijfer ${index + 1}`;
        });
        calculate();
        message.textContent = grades.length ? `${grades.length} cijfers gevonden. Klik op een cijfer in Eduarte om het toe te voegen of te verwijderen.` : "De resultaten worden nog geladen. Probeer opnieuw zodra de matrix zichtbaar is.";
      }

      const toggle = shadow.querySelector(".toggle");
      toggle.addEventListener("click", () => {
        panel.classList.add("open");
        panel.setAttribute("aria-hidden", "false");
        toggle.setAttribute("aria-expanded", "true");
      });
      shadow.querySelector(".close").addEventListener("click", () => {
        panel.classList.remove("open");
        panel.setAttribute("aria-hidden", "true");
        toggle.setAttribute("aria-expanded", "false");
      });
      // Handmatig toevoegen: klein formulier in plaats van losse lege rijen
      const addButton = shadow.querySelector('[data-action="add"]');
      const addForm = shadow.querySelector(".cc-form");
      const addError = shadow.querySelector(".cc-error");
      const readDecimal = (field) => {
        const raw = field.value.trim().replace(",", ".");
        return /^\d+(\.\d*)?$|^\.\d+$/.test(raw) ? Number(raw) : NaN;
      };
      addButton.addEventListener("click", () => {
        addForm.hidden = !addForm.hidden;
        addButton.setAttribute("aria-expanded", String(!addForm.hidden));
        addError.hidden = true;
        if (!addForm.hidden) input("cc-grade").focus();
      });
      addForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const grade = readDecimal(input("cc-grade"));
        const weight = input("cc-weight").value.trim() === "" ? 1 : readDecimal(input("cc-weight"));
        if (!(grade >= gradeMinimum && grade <= gradeMaximum)) {
          addError.textContent = `Voer een geldig cijfer in tussen ${format(gradeMinimum)} en ${format(gradeMaximum)}.`;
          addError.hidden = false;
          return;
        }
        if (!(weight > 0)) {
          addError.textContent = "Voer een weging groter dan 0 in.";
          addError.hidden = false;
          return;
        }
        addError.hidden = true;
        addRow(String(grade), String(weight));
        input("cc-grade").value = "";
        input("cc-grade").focus();
        calculate();
      });
      shadow.querySelector('[data-action="scan"]').addEventListener("click", scan);
      shadow.querySelector('[data-action="export"]').addEventListener("click", exportCsv);
      shadow.querySelector('[data-action="backup-export"]').addEventListener("click", exportBackup);
      const backupFile = input("backup-file");
      shadow.querySelector('[data-action="backup-import"]').addEventListener("click", () => backupFile.click());
      backupFile.addEventListener("change", () => {
        const [file] = backupFile.files || [];
        if (file) importBackup(file);
        backupFile.value = "";
      });
      input("sort").addEventListener("change", calculate);
      shadow.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
        shadow.querySelectorAll(".tab").forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
        shadow.querySelectorAll(".view").forEach((view) => { view.hidden = view.dataset.view !== tab.dataset.tab; });
      }));
      input("target").addEventListener("input", calculate);
      input("future").addEventListener("input", calculate);
      calculate();
      const stopWatchingResults = globalThis.EduarteApi.watchGrades(document, (grades) => {
        if (!grades.length || root.dataset.resultsFound) return;
        root.dataset.resultsFound = "true";
        stopWatchingResults();
        scan();
      }, { minimum: gradeMinimum, maximum: gradeMaximum });
      if (readGradeCells().length) {
        root.dataset.resultsFound = "true";
        stopWatchingResults();
        scan();
      }
    }
  }

  function initShortcuts() {
    const DEFAULT_SHORTCUTS = {
      "/agenda": { key: "a", ctrl: true, alt: false, shift: false },
      "/resultaten": { key: "r", ctrl: true, alt: false, shift: false },
    };

    chrome.storage.local.get(["eduarteShortcutKeysEnabled", "eduarteShortcuts"], (data) => {
      if (data.eduarteShortcutKeysEnabled === false) return;
      const shortcuts = data.eduarteShortcuts || DEFAULT_SHORTCUTS;
      const entries = Object.entries(shortcuts).filter(([, combo]) => combo && combo.key);
      if (!entries.length) return;

      document.addEventListener("keydown", (event) => {
        const target = event.target;
        const tag = target && target.tagName;
        const isEditable = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (target && target.isContentEditable);
        if (isEditable) return;

        const key = event.key.toLowerCase();
        const match = entries.find(([, combo]) =>
          combo.key.toLowerCase() === key &&
          !!combo.ctrl === (event.ctrlKey || event.metaKey) &&
          !!combo.alt === event.altKey &&
          !!combo.shift === event.shiftKey
        );
        if (!match) return;

        event.preventDefault();
        const [path] = match;
        const base = location.origin;
        location.href = path === "/" ? base + "/" : base + path;
      });
    });
  }

  initPortalToolbar();
  initStartWidget();
  initGradesOverlay();
  initShortcuts();
})();
