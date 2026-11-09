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
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  };

  function icon(name) {
    return `<svg class="et-i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
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
        #${TOOLBAR_ID} {
          position: relative;
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          padding: 0 10px;
          color: #f3f6ff;
          font: 500 13px/1.3 system-ui, sans-serif;
        }
        #${TOOLBAR_ID} .et-portal-action {
          position: relative;
          display: grid;
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          place-items: center;
          padding: 0;
          border: 1px solid color-mix(in srgb, var(--color-border-primary, #252a37) 80%, transparent);
          border-radius: 10px;
          background: var(--color-bg-surface, #14171f);
          color: var(--color-text-primary, #eceef3);
          box-shadow: none;
          cursor: pointer;
          text-decoration: none;
          transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
        }
        #${TOOLBAR_ID} .et-portal-action:hover,
        #${TOOLBAR_ID} .et-portal-action[aria-expanded="true"] {
          border-color: var(--color-bg-fill-action, #ff7a59);
          background: color-mix(in srgb, var(--color-bg-surface, #14171f) 88%, var(--color-text-primary, #eceef3));
        }
        #${TOOLBAR_ID} .et-portal-action:focus-visible {
          outline: 2px solid var(--color-bg-fill-action, #ff7a59);
          outline-offset: 3px;
        }
        #${TOOLBAR_ID} .et-portal-action svg { width: 20px; height: 20px; fill: currentColor; }
        #${TOOLBAR_ID} .et-portal-bell::after {
          position: absolute;
          top: 5px;
          right: 6px;
          width: 7px;
          height: 7px;
          border: 0;
          border-radius: 50%;
          background: var(--color-bg-fill-action, #ff7a59);
          content: "";
        }
        #${TOOLBAR_ID} .et-portal-count {
          position: absolute;
          top: -4px;
          right: -4px;
          display: none;
          min-width: 17px;
          height: 17px;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 1px solid #101a44;
          border-radius: 99px;
          background: #fb4b72;
          color: white;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
        }
        #${TOOLBAR_ID} .et-portal-avatar {
          overflow: hidden;
          border-color: transparent;
          background: var(--color-bg-fill-action, #ff7a59);
          color: #fff;
          font-size: 14px;
          font-weight: 750;
          letter-spacing: -.03em;
          box-shadow: none;
        }
        #${TOOLBAR_ID} .et-portal-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        #${TOOLBAR_ID} .et-portal-popover {
          position: absolute;
          z-index: 2147483645;
          top: calc(100% + 10px);
          right: 8px;
          display: none;
          width: min(320px, calc(100vw - 32px));
          padding: 16px;
          border: 1px solid rgba(139,169,255,.3);
          border-radius: 20px;
          background: linear-gradient(145deg, rgba(18,30,76,.97), rgba(9,15,43,.98));
          color: #f3f6ff;
          box-shadow: 0 18px 48px rgba(1,5,24,.5), inset 0 1px rgba(255,255,255,.08);
          backdrop-filter: blur(20px) saturate(145%);
          -webkit-backdrop-filter: blur(20px) saturate(145%);
        }
        #${TOOLBAR_ID} .et-portal-popover.open { display: block; animation: et-portal-pop-in 150ms ease both; }
        #${TOOLBAR_ID} .et-portal-popover h2 {
          margin: 0 0 6px;
          color: inherit;
          font: 700 15px/1.3 system-ui, sans-serif;
        }
        #${TOOLBAR_ID} .et-portal-popover p {
          margin: 0;
          color: #bac9ed;
          font: 400 12px/1.5 system-ui, sans-serif;
        }
        #${TOOLBAR_ID} .et-portal-search {
          display: none;
          position: absolute;
          z-index: 2147483645;
          top: calc(100% + 10px);
          right: 8px;
          width: min(360px, calc(100vw - 32px));
          padding: 8px;
          border: 1px solid rgba(139,169,255,.3);
          border-radius: 18px;
          background: linear-gradient(145deg, rgba(18,30,76,.97), rgba(9,15,43,.98));
          box-shadow: 0 18px 48px rgba(1,5,24,.5);
        }
        #${TOOLBAR_ID} .et-portal-search.open { display: block; animation: et-portal-pop-in 150ms ease both; }
        #${TOOLBAR_ID} .et-portal-search input {
          box-sizing: border-box;
          width: 100%;
          min-height: 42px;
          padding: 0 13px;
          border: 1px solid rgba(153,180,255,.25);
          border-radius: 12px;
          outline: 0;
          background: rgba(5,12,39,.7);
          color: #f3f6ff;
          font: 500 13px system-ui, sans-serif;
        }
        #${TOOLBAR_ID} .et-portal-search input:focus { border-color: #75a3ff; box-shadow: 0 0 0 3px rgba(70,123,255,.2); }
        #${TOOLBAR_ID} .et-portal-search input::placeholder { color: #9cadd4; }
        #${TOOLBAR_ID} .et-portal-message-link {
          display: inline-flex;
          margin-top: 12px;
          padding: 8px 12px;
          border-radius: 999px;
          background: linear-gradient(100deg, #386cf1, #654fe8);
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
        <form class="et-portal-search" role="search" aria-label="Zoeken op deze pagina">
          <input type="search" placeholder="Zoek op deze pagina…" aria-label="Zoekterm">
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

      searchButton.addEventListener("click", () => {
        const open = searchForm.classList.toggle("open");
        notificationPanel.classList.remove("open");
        searchButton.setAttribute("aria-expanded", String(open));
        notificationButton.setAttribute("aria-expanded", "false");
        if (open) searchInput.focus();
      });
      searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const term = searchInput.value.trim();
        if (!term) return;
        searchForm.classList.remove("open");
        searchButton.setAttribute("aria-expanded", "false");
        window.find?.(term, false, false, true, false, true, false);
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
              ${C} {
                --et-surface: var(--color-bg-surface, #14171f);
                --et-text: var(--color-text-primary, #eceef3);
                --et-muted: color-mix(in srgb, var(--et-text) 55%, transparent);
                --et-line: color-mix(in srgb, var(--et-text) 8%, transparent);
                --et-surface-2: color-mix(in srgb, var(--et-surface) 92%, var(--et-text));
                --et-accent: var(--color-bg-fill-action, #ff7a59);
                --et-accent-2: color-mix(in oklch, var(--et-accent), #a855f7 55%);
                --et-accent-soft: color-mix(in srgb, var(--et-accent) 14%, transparent);
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
                padding: 18px 20px;
                border: 1px solid var(--et-line);
                border-radius: 20px;
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
              ${C} .et-progress { margin-top: auto; padding-top: 18px; }
              ${C} .et-bar { position: relative; height: 8px; margin-bottom: 8px; border-radius: 99px; background: var(--et-surface-2); }
              ${C} .et-bar > div { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--et-accent), var(--et-accent-2)); box-shadow: 0 0 16px color-mix(in srgb, var(--et-accent) 45%, transparent); transition: width .6s ease; }
              ${C} .et-bar-row { display: flex; justify-content: space-between; align-items: baseline; color: var(--et-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
              ${C} .et-bar-row b { color: var(--et-text); font-size: 13px; }

              /* Snelkoppelingen */
              ${C} .et-links { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; padding: 10px; }
              ${C} .et-link {
                display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 0;
                padding: 12px 6px 10px; border-radius: 14px;
                color: var(--et-text) !important; font-size: 12.5px; font-weight: 600; text-decoration: none !important;
                transition: background-color .15s ease, transform .15s ease;
              }
              ${C} .et-link:hover { background: var(--et-surface-2); transform: translateY(-2px); }
              ${C} .et-link span {
                display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px;
                background: var(--tile); color: #fff;
                box-shadow: 0 6px 16px -6px var(--tile), inset 0 1px rgba(255,255,255,.25);
              }
              ${C} .et-link span svg.et-i { width: 19px; height: 19px; }
              ${C} .et-link em { max-width: 100%; overflow: hidden; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }

              /* Vandaag */
              ${C} .et-today { grid-column: span 5; }
              ${C} .et-tl { position: relative; display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
              ${C} .et-tl li { position: relative; display: grid; grid-template-columns: 42px 14px minmax(0, 1fr); align-items: center; gap: 10px; padding: 8px 10px 8px 4px; border-radius: 12px; transition: background-color .15s; }
              ${C} .et-tl li:not(.et-empty)::after { content: ""; position: absolute; left: 62px; top: 50%; bottom: -50%; width: 2px; background: var(--et-line); }
              ${C} .et-tl li:last-child::after { display: none; }
              ${C} .et-tl li.is-current { background: var(--et-surface-2); }
              ${C} .et-tl li.is-past { opacity: .45; }
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
              ${C} .et-seg { display: flex; gap: 2px; width: 100%; box-sizing: border-box; padding: 3px; border-radius: 12px; background: var(--et-surface-2); }
              ${C} .et-seg button { flex: 1; padding: 6px 0; border: 0; border-radius: 9px; background: none; color: var(--et-muted); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; transition: background-color .15s, color .15s; }
              ${C} .et-seg button:hover { color: var(--et-text); }
              ${C} .et-seg button.is-on { background: var(--et-surface); color: var(--et-text); box-shadow: 0 1px 3px rgba(0,0,0,.3); }
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
                flex: 1; padding: 10px; border: 0; border-radius: 12px;
                background: linear-gradient(135deg, var(--et-accent), var(--et-accent-2)); color: #fff;
                font: inherit; font-weight: 700; cursor: pointer;
                box-shadow: 0 8px 20px -8px var(--et-accent);
                transition: transform .15s ease, filter .15s ease;
              }
              ${C} .et-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
              ${C} .et-ghost { display: grid; place-items: center; width: 42px; border: 1px solid var(--et-line); border-radius: 12px; background: var(--et-surface-2); color: var(--et-text); cursor: pointer; }
              ${C} .et-ghost:hover { border-color: color-mix(in srgb, var(--et-text) 20%, transparent); }

              /* Calculator */
              ${C} .et-calc { grid-column: span 4; display: flex; flex-direction: column; }
              ${C} .et-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
              ${C} .et-fields label { display: block; color: var(--et-muted); font-size: 12px; font-weight: 500; }
              ${C} .et-fields input {
                box-sizing: border-box; width: 100%; margin-top: 5px; padding: 9px 12px;
                border: 1px solid transparent; border-radius: 11px; outline: none;
                background: var(--et-surface-2); color: var(--et-text);
                font: inherit; font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums;
                transition: border-color .15s, box-shadow .15s;
              }
              ${C} .et-fields input:focus { border-color: var(--et-accent); box-shadow: 0 0 0 3px var(--et-accent-soft); }
              ${C} .et-need {
                display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto;
                padding: 12px 16px; border: 1px solid color-mix(in srgb, var(--et-accent) 25%, transparent); border-radius: 14px;
                background: linear-gradient(120deg, color-mix(in srgb, var(--et-accent) 16%, transparent), color-mix(in srgb, var(--et-accent-2) 12%, transparent));
              }
              ${C} .et-need span { color: var(--et-muted); font-weight: 500; }
              ${C} .et-need b { font-size: 28px; font-weight: 700; letter-spacing: -.03em; font-variant-numeric: tabular-nums; background: linear-gradient(90deg, var(--et-accent), var(--et-accent-2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
              ${C} .et-need b.is-bad { background: none; color: #f87171; font-size: 16px; }
              ${C} .et-need b.is-ok { background: none; color: var(--et-ok); font-size: 16px; }

              /* Instagram */
              ${C} .et-ig { display: flex; align-items: center; gap: 12px; padding: 8px 10px 8px 12px; border-radius: 16px; }
              ${C} .et-ig > span { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; background: linear-gradient(135deg, #f58529, #dd2a7b 50%, #8134af); color: #fff; }
              ${C} .et-ig div { flex: 1; min-width: 0; color: var(--et-muted); font-size: 12.5px; }
              ${C} .et-ig div b { color: var(--et-text); font-weight: 600; }
              ${C} .et-ig a { flex: none; padding: 5px 12px; border-radius: 99px; background: var(--et-text); color: var(--et-surface) !important; font-size: 12px; font-weight: 700; text-decoration: none !important; }
              ${C} .et-ig button { flex: none; display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 8px; background: none; color: var(--et-muted); cursor: pointer; }
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
                  ${native.tomorrow ? `<span class="et-chip">${icon("sunrise")} ${escapeHtml(native.tomorrow.replace(/\.$/, ""))}</span>` : ""}
                </div>
              </section>
            ` : ""}

            ${showToday ? `
              <section class="et-card et-now ${native.lesson ? "is-live" : "is-free"}">
                <span class="et-tag">${native.lesson ? "Nu bezig" : "Vrij"}</span>
                <h4>${escapeHtml(native.lesson ? native.lesson.title : (native.free || native.tomorrow || "Geen les op dit moment"))}</h4>
                <div class="et-meta">${escapeHtml(native.lesson ? native.lesson.meta : (native.free && native.tomorrow ? native.tomorrow : ""))}</div>
                <div class="et-progress" hidden>
                  <div class="et-bar"><div></div></div>
                  <div class="et-bar-row"><span class="et-from"></span><span class="et-left"></span><span class="et-to"></span></div>
                </div>
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
                <h3 class="et-label">${icon("list")} Vandaag <a href="/agenda">Hele week ${icon("arrow")}</a></h3>
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
                  <label>Huidig gemiddelde<input type="number" id="et-calc-avg" min="1" max="10" step=".1" value="6.5"></label>
                  <label>Weging tot nu<input type="number" id="et-calc-weights" min="1" step="1" value="3"></label>
                  <label>Gewenst gemiddelde<input type="number" id="et-calc-target" min="1" max="10" step=".1" value="7.0"></label>
                  <label>Weging toets<input type="number" id="et-calc-future" min="1" step="1" value="1"></label>
                </div>
                <div class="et-need"><span>Je hebt nodig</span><b id="et-calc-needed">8,5</b></div>
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

            const renderToday = (lessons) => {
              const now = nowHours();
              if (!lessons.length) {
                listEl.innerHTML = `<li class="et-empty" style="display:block">Geen lessen vandaag</li>`;
                return;
              }
              if (countEl) {
                countEl.hidden = false;
                countEl.innerHTML = `${icon("book")} <b>${lessons.length}</b> ${lessons.length === 1 ? "les" : "lessen"} vandaag`;
              }
              listEl.innerHTML = lessons.map((l) => {
                const state = l.end <= now ? "is-past" : (l.start <= now ? "is-current" : "");
                const meta = [l.location, l.participants].filter(Boolean).join(" · ");
                return `<li class="${state}"><time>${Agenda.formatTime(l.start)}</time><i style="color:${Agenda.courseColor(l.title)}"></i>`
                  + `<div><strong title="${escapeHtml(l.subject)}">${escapeHtml(l.title)}</strong><small>${escapeHtml(meta)} · tot ${Agenda.formatTime(l.end)}</small></div></li>`;
              }).join("");
              const last = lessons[lessons.length - 1];
              footEl.hidden = false;
              footEl.innerHTML = last.end <= now ? `${icon("check")} Klaar voor vandaag` : `${icon("check")} Vrij vanaf ${Agenda.formatTime(last.end)}`;

              const current = lessons.find((l) => l.start <= now && l.end > now);
              const progress = nowCard?.querySelector(".et-progress");
              if (current && progress && nowCard.classList.contains("is-live")) {
                const pct = Math.min(100, Math.max(0, ((now - current.start) / (current.end - current.start)) * 100));
                const left = Math.max(0, Math.round((current.end - now) * 60));
                progress.hidden = false;
                progress.querySelector(".et-bar > div").style.width = `${pct}%`;
                progress.querySelector(".et-from").textContent = Agenda.formatTime(current.start);
                progress.querySelector(".et-to").textContent = Agenda.formatTime(current.end);
                progress.querySelector(".et-left").innerHTML = `nog <b>${left >= 60 ? `${Math.floor(left / 60)}u ${left % 60}m` : `${left}m`}</b>`;
              }
            };

            let todayLessons = [];
            Agenda.fetchTodayLessons()
              .then((lessons) => { todayLessons = lessons; renderToday(lessons); })
              .catch(() => { listEl.innerHTML = `<li class="et-empty" style="display:block">Kon de agenda niet laden.</li>`; });
            const refresh = window.setInterval(() => {
              if (!container.isConnected) return window.clearInterval(refresh);
              if (todayLessons.length) renderToday(todayLessons);
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
                  weatherEl.innerHTML = `⛅ <span>${escapeHtml(res?.error || "Weer niet beschikbaar")}</span>`;
                  return;
                }
                const info = WEATHER_CODES[res.weathercode] || { text: "Onbekend", icon: "⛅" };
                const icon = res.is_day ? info.icon : (info.iconNight || info.icon);
                const rain = res.precipitation > 0 ? ` · 💧 ${res.precipitation}%` : "";
                weatherEl.innerHTML = `${icon} <b>${Math.round(res.temp)}°</b> ${escapeHtml(info.text)} · ${escapeHtml(res.city || cityLabel)}${rain}`;
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
            const circumference = 2 * Math.PI * 54;
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

            function calcNeeded() {
              const curAvg = parseFloat(avgInput.value);
              const curWeights = parseFloat(weightsInput.value);
              const target = parseFloat(targetInput.value);
              const futureWeight = parseFloat(futureInput.value);
              neededOutput.className = "";

              if ([curAvg, curWeights, target, futureWeight].some(isNaN) || futureWeight <= 0) {
                neededOutput.textContent = "—";
                return;
              }

              const needed = (target * (curWeights + futureWeight) - curAvg * curWeights) / futureWeight;
              if (needed > 10) {
                neededOutput.textContent = `${needed.toLocaleString("nl-NL", { maximumFractionDigits: 1 })} · onhaalbaar`;
                neededOutput.className = "is-bad";
              } else if (needed < 1) {
                neededOutput.textContent = "Al gehaald!";
                neededOutput.className = "is-ok";
              } else {
                neededOutput.textContent = needed.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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
          .rows { display: grid; gap: 7px; }
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
            <div class="rows"></div>
            <div class="actions"><button class="action" data-action="add">+ Cijfer</button><button class="action primary" data-action="scan">Scannen</button></div>
            <div class="settings"><label>Doelgemiddelde<input class="target" type="number" min="${gradeMinimum}" max="${gradeMaximum}" step=".1" value="${passThreshold}"></label><label>Weging volgend cijfer<input class="future" type="number" min=".1" step=".1" placeholder="Auto"></label></div>
            <div class="metrics"><div class="metric"><b class="average">—</b><span>Gewogen gemiddelde</span></div><div class="metric"><b class="median">—</b><span>Mediaan</span></div><div class="metric"><b class="total-weight">—</b><span>Totale weging</span></div><div class="metric"><b class="needed">—</b><span>Benodigd cijfer</span></div><div class="metric"><b class="result">—</b><span>Nieuw gemiddelde</span></div></div>
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
          index,
        }));
        const validValues = values.filter(({ result, weight }) =>
          Number.isFinite(result) && result >= gradeMinimum && result <= gradeMaximum &&
          Number.isFinite(weight) && weight > 0
        );
        renderStatistics(validValues);
        renderList(validValues);
        if (!validValues.length) {
          ["average", "median", "total-weight", "needed", "result"].forEach((name) => input(name).textContent = "—");
          message.textContent = "Voeg cijfers toe of scan je cijferlijst.";
          return;
        }
        const target = Number(input("target").value);
        const calculator = globalThis.EduarteGradeCalculator;
        const preliminary = calculator.calculateGradeSummary(validValues, target, 1, gradeMinimum, gradeMaximum);
        const futureInput = input("future").value.trim();
        const future = futureInput ? Number(futureInput) : (preliminary.medianWeight || 1);
        const summary = calculator.calculateGradeSummary(validValues, target, future, gradeMinimum, gradeMaximum);
        input("average").textContent = format(summary.weightedAverage);
        input("median").textContent = format(summary.median);
        input("total-weight").textContent = `${format(summary.totalWeight)}×`;
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
      shadow.querySelector('[data-action="add"]').addEventListener("click", () => { addRow(); calculate(); });
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
      addRow();
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
