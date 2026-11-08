(function () {
  if (location.hostname === "login.microsoftonline.com") return;
  if (globalThis.EduarteApi && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request?.type !== "GET_EDUARTE_GRADES") return;
      const grades = globalThis.EduarteApi.getGrades(document).map(
        ({ id, result, weight, hasWeight, title }) => ({ id, result, weight, hasWeight, title })
      );
      sendResponse({ grades });
    });
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
      ],
      (settings) => {
        if (settings.eduarteStartEnabled === false) return;

        const showWeather = settings.eduarteWeatherEnabled !== false;
        const showGreeting = settings.eduarteGreetingEnabled !== false;
        const showShortcuts = settings.eduarteShortcutsEnabled !== false;
        const showPomodoro = settings.eduartePomodoroEnabled !== false;
        const showQuickCalc = settings.eduarteQuickCalcEnabled !== false;

        if (!showWeather && !showGreeting && !showShortcuts && !showPomodoro && !showQuickCalc) return;

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
          container.innerHTML = `
            <style>
              #${CONTAINER_ID} {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 24px;
                animation: st-card-in 220ms ease both;
              }
              .et-card {
                box-sizing: border-box;
                padding: 14px 18px;
                background: var(--color-bg-surface, #1f2937);
                border: 1px solid color-mix(in srgb, var(--color-border-primary, #374151) 65%, transparent);
                border-radius: 22px 22px 8px 22px;
                box-shadow: 0 1px 3px rgba(0,0,0,.16);
                color: var(--color-text-primary, #f9fafb);
                transition: box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
              }
              .et-card:hover {
                box-shadow: 0 3px 8px rgba(0,0,0,.18);
                border-color: var(--color-bg-fill-action, #3b82f6);
              }
              .et-top-card {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                background: linear-gradient(135deg, var(--color-bg-surface, #1f2937), color-mix(in srgb, var(--color-bg-surface, #1f2937) 85%, var(--color-bg-fill-action, #3b82f6) 15%));
              }
              .et-greeting-section {
                display: flex;
                flex-direction: column;
                gap: 5px;
              }
              .et-greeting-title {
                margin: 0;
                font-size: 22px;
                font-weight: 700;
                letter-spacing: -0.02em;
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .et-greeting-date {
                font-size: 13px;
                color: var(--color-text-tertiary, #9ca3af);
                text-transform: capitalize;
                display: flex;
                align-items: center;
                gap: 6px;
              }
              .et-weather-section {
                display: flex;
                align-items: center;
                gap: 14px;
                background: color-mix(in srgb, var(--color-bg-surface, #1f2937) 76%, var(--color-text-primary, #fff));
                padding: 10px 16px;
                border-radius: 18px 18px 6px 18px;
                border: 1px solid color-mix(in srgb, var(--color-border-primary, #374151) 65%, transparent);
              }
              .et-weather-icon { font-size: 32px; line-height: 1; }
              .et-weather-info { display: flex; flex-direction: column; gap: 2px; }
              .et-weather-temp { font-size: 18px; font-weight: 700; display: flex; align-items: baseline; gap: 6px; }
              .et-weather-desc { font-size: 12px; color: var(--color-text-tertiary, #9ca3af); }
              .et-weather-chips { display: flex; align-items: center; gap: 8px; margin-left: 6px; font-size: 11px; color: var(--color-text-tertiary, #9ca3af); }
              .et-chip { display: inline-flex; align-items: center; gap: 4px; background: color-mix(in srgb, var(--color-bg-fill-action, #3b82f6) 14%, transparent); padding: 4px 9px; border-radius: 99px; font-weight: 500; }
              .et-weather-refresh {
                border: 0; background: transparent; color: var(--color-text-tertiary, #9ca3af);
                cursor: pointer; font-size: 16px; padding: 6px; border-radius: 12px; transition: color 0.2s ease, background-color 0.2s ease;
              }
              .et-weather-refresh:hover { color: var(--color-text-primary, #fff); background: color-mix(in srgb, var(--color-bg-fill-action, #3b82f6) 14%, transparent); }

              /* Grid for widgets */
              .et-grid {
                display: grid;
                align-items: start;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 12px;
              }
              .et-widget-title {
                margin: 0 0 10px 0;
                font-size: 14px;
                font-weight: 600;
                color: var(--color-text-secondary, #e5e7eb);
                display: flex;
                align-items: center;
                gap: 8px;
                letter-spacing: -0.01em;
              }

              /* Shortcuts styling */
              .et-shortcut-toolbar {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 14px;
                border: 1px solid color-mix(in srgb, var(--color-border-primary, #374151) 65%, transparent);
                border-radius: 16px;
                background: color-mix(in srgb, var(--color-bg-surface, #1f2937) 92%, var(--color-bg-fill-action, #3b82f6) 8%);
              }
              .et-home-toolbar {
                display: grid;
                grid-template-columns: minmax(0, 1fr);
                align-items: center;
                gap: 0;
                width: 100%;
                min-width: 0;
                min-height: 100%;
                overflow: hidden;
                border: 1px solid color-mix(in srgb, var(--color-border-primary, #374151) 65%, transparent);
                border-radius: 16px;
                background: color-mix(in srgb, var(--color-bg-surface, #1f2937) 92%, var(--color-bg-fill-action, #3b82f6) 8%);
              }
              .et-home-toolbar.et-home-toolbar-single { grid-template-columns: minmax(0, 1fr); }
              .et-home-toolbar .et-shortcut-toolbar {
                box-sizing: border-box;
                width: 100%;
                min-width: 0;
                min-height: 48px;
                padding: 6px 14px;
                border: 0;
                border-radius: 0;
                background: transparent;
                box-shadow: none;
              }
              .et-home-toolbar .et-shortcut-toolbar {
                justify-content: center;
                gap: 0;
              }
              .et-home-toolbar .et-shortcut-toolbar-label { display: none; }
              .et-home-toolbar .et-shortcuts-list {
                display: grid;
                grid-template-columns: repeat(7, minmax(0, 1fr));
                flex: 1 1 0;
                width: 100%;
                min-width: 0;
                gap: 5px;
              }
              .et-home-toolbar .et-shortcut-btn {
                justify-content: center;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                padding: 6px 4px;
                gap: 4px;
                border-radius: 10px;
                font-size: 11px;
                white-space: nowrap;
              }
              .et-home-toolbar .et-shortcut-btn span { font-size: 12px; }
              .et-home-empty-title { display: none !important; }
              header.header .header-toolbar:has(.et-home-toolbar) {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                justify-content: stretch !important;
                box-sizing: border-box !important;
                width: 100% !important;
                min-height: 82px !important;
                padding: 8px 12px !important;
              }
              header.header .header-toolbar:has(.et-home-toolbar) > .et-home-toolbar {
                flex: 1 1 100%;
                width: 100%;
                justify-self: stretch;
              }
              header.header .header-toolbar:has(.et-home-toolbar) > .header-toolbar--open-navigation {
                position: absolute;
                z-index: 1;
                top: 50%;
                left: 12px;
                transform: translateY(-50%);
              }
              @media (max-width: 1100px) {
                .et-home-toolbar { grid-template-columns: 1fr; gap: 0; }
                .et-home-toolbar .et-shortcuts-list { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                header.header .header-toolbar:has(.et-home-toolbar) { min-height: 130px !important; }
              }
              @media (max-width: 700px) {
                .et-home-toolbar .et-shortcuts-list { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                .et-home-toolbar .et-shortcut-btn { white-space: normal; }
              }
              .et-shortcut-toolbar-label {
                flex: 0 0 auto;
                color: var(--color-text-secondary, #e5e7eb);
                font-size: 12px;
                font-weight: 700;
              }
              .et-shortcuts-list {
                display: flex;
                flex: 1 1 auto;
                align-items: center;
                flex-wrap: wrap;
                gap: 7px;
              }
              .et-shortcut-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 7px 11px;
                background: color-mix(in srgb, var(--color-bg-surface, #1f2937) 74%, var(--color-text-primary, #fff));
                border: 1px solid color-mix(in srgb, var(--color-border-primary, #374151) 65%, transparent);
                border-radius: 12px;
                color: var(--color-text-primary, #f9fafb);
                text-decoration: none;
                font-size: 13px;
                font-weight: 500;
                transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
              }
              .et-shortcut-btn:hover {
                background: color-mix(in srgb, var(--color-bg-fill-action, #3b82f6) 24%, transparent);
                border-color: var(--color-bg-fill-action, #3b82f6);
                box-shadow: 0 2px 6px rgba(0,0,0,.16);
              }

              /* Pomodoro styling */
              .et-pomo-display {
                font-size: 38px;
                font-weight: 700;
                text-align: center;
                margin: 8px 0;
                letter-spacing: -0.03em;
                font-variant-numeric: tabular-nums;
                color: var(--color-text-primary, #f9fafb);
              }
              .et-pomo-tabs {
                display: flex;
                gap: 6px;
                margin-bottom: 12px;
              }
              .et-pomo-tab {
                flex: 1;
                padding: 6px 4px;
                border: 0;
                border-radius: 12px 12px 4px 12px;
                background: color-mix(in srgb, var(--color-bg-surface, #1f2937) 78%, var(--color-text-primary, #fff));
                color: var(--color-text-tertiary, #9ca3af);
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.15s, color 0.15s;
              }
              .et-pomo-tab.active {
                background: var(--color-bg-fill-action, #3b82f6);
                color: #ffffff;
              }
              .et-pomo-controls {
                display: flex;
                gap: 8px;
              }
              .et-pomo-btn {
                flex: 1;
                padding: 8px;
                border: 0;
                border-radius: 14px 14px 5px 14px;
                background: color-mix(in srgb, var(--color-bg-surface, #1f2937) 70%, var(--color-text-primary, #fff));
                color: var(--color-text-primary, #f9fafb);
                font-weight: 600;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.15s ease, color 0.15s ease;
              }
              .et-pomo-btn.primary {
                background: var(--color-bg-fill-action, #3b82f6);
                color: #ffffff;
              }
              .et-pomo-btn:hover {
                filter: brightness(1.1);
              }

              /* Quick Calc styling */
              .et-calc-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 10px;
              }
              .et-calc-field label {
                display: block;
                font-size: 11px;
                color: var(--color-text-tertiary, #9ca3af);
                margin-bottom: 3px;
              }
              .et-calc-field input {
                width: 100%;
                padding: 6px 10px;
                font-size: 12px;
              }
              .et-calc-result {
                padding: 10px 12px;
                border-radius: 16px 16px 6px 16px;
                background: color-mix(in srgb, var(--color-bg-surface, #1f2937) 76%, var(--color-text-primary, #fff));
                border: 1px solid color-mix(in srgb, var(--color-border-primary, #374151) 65%, transparent);
                display: flex;
                align-items: center;
                justify-content: space-between;
              }
              .et-calc-result b {
                font-size: 16px;
                color: var(--color-bg-fill-action, #3b82f6);
              }

              @media (max-width: 700px) {
                .et-shortcut-toolbar { align-items: flex-start; flex-direction: column; gap: 8px; }
                .et-shortcuts-list { width: 100%; }
              }

              @keyframes st-card-in {
                from { opacity: 0; transform: translateY(6px); }
                to { opacity: 1; transform: translateY(0); }
              }
            </style>

            <!-- Bovenste kaart: Weer & Begroeting -->
            ${(showGreeting || showWeather) ? `
              <div class="et-card et-top-card">
                ${showGreeting ? `
                  <div class="et-greeting-section">
                    <h2 class="et-greeting-title"><span class="et-greeting-emoji">${getGreeting().icon}</span> <span class="et-greeting-text">${getGreeting().text}</span></h2>
                    <div class="et-greeting-date">${getFormattedDate()}</div>
                  </div>
                ` : ''}
                ${showWeather ? `
                  <div class="et-weather-section">
                    <div class="et-weather-icon">⏳</div>
                    <div class="et-weather-info">
                      <div class="et-weather-temp"><span class="et-temp-val">—</span></div>
                      <div class="et-weather-desc">Weerbericht laden...</div>
                    </div>
                    <div class="et-weather-chips">
                      <span class="et-chip et-chip-city">📍 ${settings.eduarteWeatherUseLocation !== false && settings.eduarteWeatherCoordinates ? (settings.eduarteWeatherLocationLabel || "Huidige locatie") : (settings.eduarteWeatherCity || "Utrecht")}</span>
                      <span class="et-chip et-chip-rain" style="display:none;">💧 <span class="et-rain-val">0</span>%</span>
                    </div>
                    <button class="et-weather-refresh" title="Ververs weerbericht">🔄</button>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${showShortcuts ? `
              <nav class="et-shortcut-toolbar" aria-label="Eduarte snelkoppelingen">
                <span class="et-shortcut-toolbar-label">Snel openen</span>
                <div class="et-shortcuts-list">
                  <a href="https://teams.microsoft.com" target="_blank" class="et-shortcut-btn" rel="noreferrer"><span>👥</span> Teams</a>
                  <a href="https://outlook.office.com/mail" target="_blank" class="et-shortcut-btn" rel="noreferrer"><span>✉️</span> Outlook</a>
                  <a href="https://onedrive.live.com" target="_blank" class="et-shortcut-btn" rel="noreferrer"><span>☁️</span> OneDrive</a>
                  <a href="https://www.office.com" target="_blank" class="et-shortcut-btn" rel="noreferrer"><span>📄</span> Office 365</a>
                  <a href="https://mbowebshop.nl/Gebruikers/Licenties/" target="_blank" class="et-shortcut-btn" rel="noreferrer"><span>📚</span> MboWebshop</a>
                  <a href="/resultaten" class="et-shortcut-btn"><span>📊</span> Cijfers</a>
                  <a href="/agenda" class="et-shortcut-btn"><span>📅</span> Agenda</a>
                </div>
              </nav>
            ` : ''}

            <!-- Compacte widgetgrid -->
            ${(showPomodoro || showQuickCalc) ? `
              <div class="et-grid">
                ${showPomodoro ? `
                  <div class="et-card">
                    <h3 class="et-widget-title">⏱️ Pomodoro Focus Timer</h3>
                    <div class="et-pomo-tabs">
                      <button class="et-pomo-tab active" data-time="1500">Focus (25m)</button>
                      <button class="et-pomo-tab" data-time="300">Pauze (5m)</button>
                      <button class="et-pomo-tab" data-time="900">Lang (15m)</button>
                    </div>
                    <div class="et-pomo-display" id="et-pomo-time">25:00</div>
                    <div class="et-pomo-controls">
                      <button class="et-pomo-btn primary" id="et-pomo-toggle">Start</button>
                      <button class="et-pomo-btn" id="et-pomo-reset">Reset</button>
                    </div>
                  </div>
                ` : ''}

                ${showQuickCalc ? `
                  <div class="et-card">
                    <h3 class="et-widget-title">🎯 Snelle Cijfercalculator</h3>
                    <div class="et-calc-grid">
                      <div class="et-calc-field"><label>Huidig Gemiddelde</label><input type="number" id="et-calc-avg" min="1" max="10" step=".1" value="6.5"></div>
                      <div class="et-calc-field"><label>Huidige Weging</label><input type="number" id="et-calc-weights" min="1" step="1" value="3"></div>
                      <div class="et-calc-field"><label>Streefgemiddelde</label><input type="number" id="et-calc-target" min="1" max="10" step=".1" value="7.0"></div>
                      <div class="et-calc-field"><label>Weging Toets</label><input type="number" id="et-calc-future" min="1" step="1" value="1"></div>
                    </div>
                    <div class="et-calc-result">
                      <span style="font-size:12px;color:var(--color-text-secondary,#e5e7eb);">Nodig voor streefcijfer:</span>
                      <b id="et-calc-needed">8,5</b>
                    </div>
                  </div>
                ` : ''}

              </div>
            ` : ''}
          `;

          if (target.firstChild) {
            target.insertBefore(container, target.firstChild);
          } else {
            target.appendChild(container);
          }

          if (showShortcuts) {
            const headerToolbar = document.querySelector("header.header .header-toolbar");
            if (headerToolbar) {
              const toolbarItems = [container.querySelector(".et-shortcut-toolbar")].filter(Boolean);
              if (toolbarItems.length) {
                const homeToolbar = document.createElement("div");
                homeToolbar.className = "et-home-toolbar";
                if (toolbarItems.length === 1) homeToolbar.classList.add("et-home-toolbar-single");
                toolbarItems.forEach((item) => homeToolbar.appendChild(item));
                headerToolbar.appendChild(homeToolbar);
                const title = headerToolbar.querySelector(":scope > h1");
                if (title && !title.textContent.trim()) title.classList.add("et-home-empty-title");
              }
            }
          }

          // Weer data ophalen
          if (showWeather) {
            const useLocation = settings.eduarteWeatherUseLocation !== false;
            const city = settings.eduarteWeatherCity || "Utrecht";
            const coordinates = useLocation ? settings.eduarteWeatherCoordinates : null;
            const locationLabel = settings.eduarteWeatherLocationLabel;
            const iconEl = container.querySelector(".et-weather-icon");
            const tempEl = container.querySelector(".et-temp-val");
            const descEl = container.querySelector(".et-weather-desc");
            const cityEl = container.querySelector(".et-chip-city");
            const rainEl = container.querySelector(".et-chip-rain");
            const rainVal = container.querySelector(".et-rain-val");

            function fetchWeatherData() {
              if (!iconEl) return;
              iconEl.textContent = "⏳";
              descEl.textContent = "Weer laden...";

              chrome.runtime.sendMessage({
                type: "FETCH_WEATHER",
                city,
                coordinates,
                locationLabel,
              }, (res) => {
                if (chrome.runtime.lastError || !res || !res.success) {
                  iconEl.textContent = "⛅";
                  tempEl.textContent = "—";
                  descEl.textContent = res?.error || "Weer niet beschikbaar";
                  return;
                }
                const info = WEATHER_CODES[res.weathercode] || { text: "Onbekend", icon: "⛅" };
                const currentIcon = res.is_day ? info.icon : (info.iconNight || info.icon);
                iconEl.textContent = currentIcon;
                tempEl.textContent = `${Math.round(res.temp)}°C`;
                descEl.textContent = info.text;
                cityEl.textContent = `📍 ${res.city}`;
                if (res.precipitation > 0) {
                  rainEl.style.display = "inline-flex";
                  rainVal.textContent = res.precipitation;
                } else {
                  rainEl.style.display = "none";
                }
              });
            }

            container.querySelector(".et-weather-refresh")?.addEventListener("click", fetchWeatherData);
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
            const toggleBtn = container.querySelector("#et-pomo-toggle");
            const resetBtn = container.querySelector("#et-pomo-reset");
            const tabs = container.querySelectorAll(".et-pomo-tab");

            let currentDuration = 1500;
            let timeLeft = 1500;
            let timerId = null;

            function formatPomo(seconds) {
              const m = Math.floor(seconds / 60).toString().padStart(2, "0");
              const s = (seconds % 60).toString().padStart(2, "0");
              return `${m}:${s}`;
            }

            function updateDisplay() {
              if (displayEl) displayEl.textContent = formatPomo(timeLeft);
            }

            tabs.forEach((tab) => {
              tab.addEventListener("click", () => {
                tabs.forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                clearInterval(timerId);
                timerId = null;
                if (toggleBtn) toggleBtn.textContent = "Start";
                currentDuration = Number(tab.dataset.time);
                timeLeft = currentDuration;
                updateDisplay();
              });
            });

            toggleBtn?.addEventListener("click", () => {
              if (timerId) {
                clearInterval(timerId);
                timerId = null;
                toggleBtn.textContent = "Hervat";
              } else {
                toggleBtn.textContent = "Pauze";
                timerId = setInterval(() => {
                  if (timeLeft > 0) {
                    timeLeft--;
                    updateDisplay();
                  } else {
                    clearInterval(timerId);
                    timerId = null;
                    toggleBtn.textContent = "Start";
                    displayEl.textContent = "00:00 - Klaar!";
                  }
                }, 1000);
              }
            });

            resetBtn?.addEventListener("click", () => {
              clearInterval(timerId);
              timerId = null;
              if (toggleBtn) toggleBtn.textContent = "Start";
              timeLeft = currentDuration;
              updateDisplay();
            });
          }

          // Snelle Cijfercalculator logica
          if (showQuickCalc) {
            const avgInput = container.querySelector("#et-calc-avg");
            const weightsInput = container.querySelector("#et-calc-weights");
            const targetInput = container.querySelector("#et-calc-target");
            const futureInput = container.querySelector("#et-calc-future");
            const neededOutput = container.querySelector("#et-calc-needed");

            function calcNeeded() {
              const curAvg = parseFloat(avgInput?.value || 0);
              const curWeights = parseFloat(weightsInput?.value || 1);
              const target = parseFloat(targetInput?.value || 0);
              const futureWeight = parseFloat(futureInput?.value || 1);

              if (isNaN(curAvg) || isNaN(curWeights) || isNaN(target) || isNaN(futureWeight) || futureWeight <= 0) {
                if (neededOutput) neededOutput.textContent = "—";
                return;
              }

              const totalCurrent = curAvg * curWeights;
              const totalNewWeight = curWeights + futureWeight;
              const needed = (target * totalNewWeight - totalCurrent) / futureWeight;

              if (neededOutput) {
                if (needed > 10) {
                  neededOutput.textContent = `${needed.toFixed(1)} (Onhaalbaar)`;
                  neededOutput.style.color = "#ef4444";
                } else if (needed < 1) {
                  neededOutput.textContent = `≤ 1,0 (Al gehaald!)`;
                  neededOutput.style.color = "#10b981";
                } else {
                  neededOutput.textContent = needed.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                  neededOutput.style.color = "var(--color-bg-fill-action, #3b82f6)";
                }
              }
            }

            [avgInput, weightsInput, targetInput, futureInput].forEach((inp) => {
              inp?.addEventListener("input", calcNeeded);
            });
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
            width: 56px; height: 56px; border: 0; border-radius: 50%;
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

  initStartWidget();
  initGradesOverlay();
  initShortcuts();
})();
