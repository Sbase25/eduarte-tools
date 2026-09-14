(function () {
  if (location.hostname === "login.microsoftonline.com") return;

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

  const STUDY_QUOTES = [
    { quote: "Succes is de som van kleine inspanningen, dag in dag uit herhaald.", author: "Robert Collier" },
    { quote: "Focus op vooruitgang, niet op perfectie.", author: "Studietip" },
    { quote: "Begin gewoon: de motivatie volgt vaak pas tijdens het werken.", author: "Productiviteit" },
    { quote: "Elke expert was ooit een beginner.", author: "Helen Hayes" },
    { quote: "Neem op tijd een pauze: 25 minuten focus en 5 minuten rust (Pomodoro).", author: "Studietip" },
    { quote: "Geloof dat je het kunt en je bent al op de helft.", author: "Theodore Roosevelt" },
    { quote: "Moeilijke wegen leiden vaak naar prachtige bestemmingen.", author: "Motivatie" },
  ];

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
        "eduarteShortcutsEnabled",
        "eduartePomodoroEnabled",
        "eduarteQuickCalcEnabled",
        "eduarteQuoteEnabled",
      ],
      (settings) => {
        if (settings.eduarteStartEnabled === false) return;

        const showWeather = settings.eduarteWeatherEnabled !== false;
        const showGreeting = settings.eduarteGreetingEnabled !== false;
        const showShortcuts = settings.eduarteShortcutsEnabled !== false;
        const showPomodoro = settings.eduartePomodoroEnabled !== false;
        const showQuickCalc = settings.eduarteQuickCalcEnabled !== false;
        const showQuote = settings.eduarteQuoteEnabled !== false;

        if (!showWeather && !showGreeting && !showShortcuts && !showPomodoro && !showQuickCalc && !showQuote) return;

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
                gap: 16px;
                margin-bottom: 24px;
                animation: st-card-in 320ms ease both;
              }
              .et-card {
                padding: 18px 22px;
                background: var(--color-bg-surface, #1f2937);
                border: 1px solid color-mix(in srgb, var(--color-border-primary, #374151) 65%, transparent);
                border-radius: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,.12);
                color: var(--color-text-primary, #f9fafb);
                transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
              }
              .et-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(0,0,0,.18);
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
                background: rgba(255,255,255,.06);
                padding: 10px 16px;
                border-radius: 16px;
                border: 1px solid rgba(255,255,255,.1);
              }
              .et-weather-icon { font-size: 32px; line-height: 1; }
              .et-weather-info { display: flex; flex-direction: column; gap: 2px; }
              .et-weather-temp { font-size: 18px; font-weight: 700; display: flex; align-items: baseline; gap: 6px; }
              .et-weather-desc { font-size: 12px; color: var(--color-text-tertiary, #9ca3af); }
              .et-weather-chips { display: flex; align-items: center; gap: 8px; margin-left: 6px; font-size: 11px; color: var(--color-text-tertiary, #9ca3af); }
              .et-chip { display: inline-flex; align-items: center; gap: 4px; background: rgba(255,255,255,.09); padding: 4px 9px; border-radius: 99px; font-weight: 500; }
              .et-weather-refresh {
                border: 0; background: transparent; color: var(--color-text-tertiary, #9ca3af);
                cursor: pointer; font-size: 16px; padding: 6px; border-radius: 8px; transition: transform 0.25s ease, color 0.2s;
              }
              .et-weather-refresh:hover { color: var(--color-text-primary, #fff); transform: rotate(180deg); }

              /* Grid for widgets */
              .et-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 16px;
              }
              .et-widget-title {
                margin: 0 0 14px 0;
                font-size: 14px;
                font-weight: 600;
                color: var(--color-text-secondary, #e5e7eb);
                display: flex;
                align-items: center;
                gap: 8px;
                letter-spacing: -0.01em;
              }

              /* Shortcuts styling */
              .et-shortcuts-list {
                display: flex;
                flex-wrap: wrap;
                gap: 9px;
              }
              .et-shortcut-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 9px 15px;
                background: rgba(255,255,255,.05);
                border: 1px solid rgba(255,255,255,.1);
                border-radius: 12px;
                color: var(--color-text-primary, #f9fafb);
                text-decoration: none;
                font-size: 13px;
                font-weight: 500;
                transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
              }
              .et-shortcut-btn:hover {
                background: color-mix(in srgb, var(--color-bg-fill-action, #3b82f6) 24%, transparent);
                border-color: var(--color-bg-fill-action, #3b82f6);
                transform: translateY(-2px);
                box-shadow: 0 4px 14px rgba(0,0,0,.15);
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
                border-radius: 8px;
                background: rgba(255,255,255,.06);
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
                border-radius: 10px;
                background: rgba(255,255,255,.08);
                color: var(--color-text-primary, #f9fafb);
                font-weight: 600;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.15s, transform 0.15s;
              }
              .et-pomo-btn.primary {
                background: var(--color-bg-fill-action, #3b82f6);
                color: #ffffff;
              }
              .et-pomo-btn:hover {
                transform: translateY(-1px);
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
                border-radius: 10px;
                background: rgba(255,255,255,.05);
                border: 1px solid rgba(255,255,255,.08);
                display: flex;
                align-items: center;
                justify-content: space-between;
              }
              .et-calc-result b {
                font-size: 16px;
                color: var(--color-bg-fill-action, #3b82f6);
              }

              /* Quote styling */
              .et-quote-card {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .et-quote-text {
                font-style: italic;
                font-size: 13.5px;
                line-height: 1.55;
                margin: 0 0 10px 0;
                color: var(--color-text-primary, #f9fafb);
              }
              .et-quote-author {
                font-size: 12px;
                font-weight: 500;
                color: var(--color-text-tertiary, #9ca3af);
                text-align: right;
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
                      <span class="et-chip et-chip-city">📍 ${settings.eduarteWeatherCity || "Utrecht"}</span>
                      <span class="et-chip et-chip-rain" style="display:none;">💧 <span class="et-rain-val">0</span>%</span>
                    </div>
                    <button class="et-weather-refresh" title="Ververs weerbericht">🔄</button>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Grid kaarten: Snelkoppelingen, Pomodoro, Snelle Calculator & Quotes -->
            ${(showShortcuts || showPomodoro || showQuickCalc || showQuote) ? `
              <div class="et-grid">
                ${showShortcuts ? `
                  <div class="et-card">
                    <h3 class="et-widget-title">🚀 Snelkoppelingen</h3>
                    <div class="et-shortcuts-list">
                      <a href="https://teams.microsoft.com" target="_blank" class="et-shortcut-btn" rel="noreferrer"><span>👥</span> Teams</a>
                      <a href="https://outlook.office.com/mail" target="_blank" class="et-shortcut-btn" rel="noreferrer"><span>✉️</span> Outlook</a>
                      <a href="https://onedrive.live.com" target="_blank" class="et-shortcut-btn" rel="noreferrer"><span>☁️</span> OneDrive</a>
                      <a href="https://www.office.com" target="_blank" class="et-shortcut-btn" rel="noreferrer"><span>📄</span> Office 365</a>
                      <a href="https://mbowebshop.nl/Gebruikers/Licenties/" target="_blank" class="et-shortcut-btn" rel="noreferrer"><span>📄</span> MboWebshop 📚</a>
                      <a href="/resultaten" class="et-shortcut-btn"><span>📊</span> Cijfers</a>
                      <a href="/agenda" class="et-shortcut-btn"><span>📅</span> Agenda</a>
                    </div>
                  </div>
                ` : ''}

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

                ${showQuote ? `
                  <div class="et-card">
                    <h3 class="et-widget-title">💡 Dagelijkse Studie-Tip</h3>
                    <p class="et-quote-text" id="et-quote-content"></p>
                    <div class="et-quote-author" id="et-quote-by"></div>
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

          // Weer data ophalen
          if (showWeather) {
            const city = settings.eduarteWeatherCity || "Utrecht";
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

              chrome.runtime.sendMessage({ type: "FETCH_WEATHER", city }, (res) => {
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
          }

          // Quote instellen op basis van de dag
          if (showQuote) {
            const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
            const selectedQuote = STUDY_QUOTES[dayOfYear % STUDY_QUOTES.length];
            const textEl = container.querySelector("#et-quote-content");
            const authorEl = container.querySelector("#et-quote-by");
            if (textEl && authorEl) {
              textEl.textContent = `"${selectedQuote.quote}"`;
              authorEl.textContent = `— ${selectedQuote.author}`;
            }
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

    chrome.storage.local.get(["eduarteGradesEnabled"], (settings) => {
      if (settings.eduarteGradesEnabled === false) return;
      createOverlay();
    });

    function createOverlay() {
      const root = document.createElement("div");
      root.id = ROOT_ID;
      const shadow = root.attachShadow({ mode: "closed" });
      document.documentElement.appendChild(root);

      shadow.innerHTML = `
        <style>
          :host { all: initial; }
          * { box-sizing: border-box; }
          .toggle {
            position: fixed; z-index: 2147483646; right: 18px; bottom: 20px;
            width: 52px; height: 52px; border: 0; border-radius: 18px;
            color: #fff; background: linear-gradient(135deg, #2563eb, #7c3aed);
            box-shadow: 0 12px 30px rgba(37,99,235,.35); cursor: pointer;
            font: 700 21px/1 system-ui, sans-serif; transition: transform .2s, box-shadow .2s;
          }
          .toggle:hover { transform: translateY(-3px) rotate(-3deg); box-shadow: 0 16px 34px rgba(37,99,235,.45); }
          .panel {
            position: fixed; z-index: 2147483645; top: 16px; right: 16px; bottom: 16px;
            width: min(390px, calc(100vw - 32px)); padding: 22px; overflow: auto;
            color: #eef2ff; background: rgba(15,23,42,.94); border: 1px solid rgba(148,163,184,.2);
            border-radius: 24px; box-shadow: 0 24px 80px rgba(2,6,23,.45);
            backdrop-filter: blur(22px); font: 14px/1.45 system-ui, sans-serif;
            transform: translateX(calc(100% + 32px)); opacity: 0;
            transition: transform .32s cubic-bezier(.22,1,.36,1), opacity .2s ease;
          }
          .panel.open { transform: translateX(0); opacity: 1; }
          .head { display:flex; align-items:center; justify-content:space-between; gap: 12px; margin-bottom: 18px; }
          h2 { margin: 0; font-size: 20px; letter-spacing: -.03em; }
          .eyebrow { margin: 0 0 3px; color: #93c5fd; font-size: 11px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
          .close, .icon { border: 0; color: #cbd5e1; background: rgba(148,163,184,.12); cursor:pointer; }
          .close { width: 32px; height: 32px; border-radius: 10px; font-size: 18px; }
          .close:hover, .icon:hover { background: rgba(148,163,184,.25); }
          .intro, .message { color: #94a3b8; font-size: 12px; }
          .intro { margin: 0 0 16px; }
          .rows { display: grid; gap: 7px; }
          .row { display:grid; grid-template-columns: 1fr 1fr 32px; gap: 7px; animation: enter .25s both; }
          input { width:100%; padding: 9px 10px; border: 1px solid rgba(148,163,184,.22); border-radius: 10px; outline: 0; color:#f8fafc; background: rgba(30,41,59,.8); font: inherit; }
          input:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96,165,250,.14); }
          .icon { border-radius: 10px; font-size: 16px; }
          .actions { display:flex; gap: 8px; margin: 12px 0 16px; }
          button.action { flex:1; padding: 10px; border: 1px solid rgba(148,163,184,.2); border-radius: 11px; color:#dbeafe; background: rgba(30,41,59,.85); cursor:pointer; font: 600 12px system-ui; }
          button.action.primary { border-color: transparent; color: white; background: linear-gradient(135deg,#2563eb,#7c3aed); }
          button.action:hover { transform: translateY(-1px); filter: brightness(1.12); }
          .settings { display:grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          label { color:#94a3b8; font-size: 11px; }
          label input { display:block; margin-top: 5px; }
          .metrics { display:grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
          .metric { padding: 12px; border:1px solid rgba(148,163,184,.16); border-radius: 14px; background: rgba(30,41,59,.58); }
          .metric b { display:block; color:#f8fafc; font-size: 20px; letter-spacing:-.03em; }
          .metric span { color:#94a3b8; font-size: 10px; }
          .message { min-height: 36px; margin: 13px 0 0; }
          @keyframes enter { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }
          @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
        </style>
        <button class="toggle" aria-label="Open Eduarte cijferlijst" title="Eduarte Tools">✦</button>
        <aside class="panel" aria-hidden="true">
          <div class="head"><div><p class="eyebrow">Eduarte Tools</p><h2>Cijferoverzicht</h2></div><button class="close" aria-label="Sluiten">×</button></div>
          <p class="intro">Selecteer cijfers uit je cijferlijst of voeg ze hieronder toe. De berekening wordt meteen bijgewerkt.</p>
          <div class="rows"></div>
          <div class="actions"><button class="action" data-action="add">+ Cijfer</button><button class="action primary" data-action="scan">Cijferlijst scannen</button></div>
          <div class="settings"><label>Doelgemiddelde<input class="target" type="number" min="1" max="10" step=".1" value="5.5"></label><label>Weging volgend cijfer<input class="future" type="number" min=".1" step=".1" value="1"></label></div>
          <div class="metrics"><div class="metric"><b class="average">—</b><span>Gewogen gemiddelde</span></div><div class="metric"><b class="median">—</b><span>Mediaan</span></div><div class="metric"><b class="needed">—</b><span>Benodigd cijfer</span></div><div class="metric"><b class="result">—</b><span>Nieuw gemiddelde</span></div></div>
          <div class="actions"><button class="action" data-action="export">⬇️ Exporteer als CSV</button></div>
          <p class="message">Klik op “Cijferlijst scannen” als je cijfers nog niet zijn gevonden.</p>
        </aside>
      `;

      const panel = shadow.querySelector(".panel");
      const rows = shadow.querySelector(".rows");
      const message = shadow.querySelector(".message");
      const input = (className) => shadow.querySelector(`.${className}`);
      const format = (value) => Number.isFinite(value) ? value.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

      function addRow(grade = "", weight = "1") {
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `<input class="grade" type="number" min="1" max="10" step=".1" placeholder="Cijfer" value="${grade}"><input class="weight" type="number" min=".1" step=".1" placeholder="Weging" value="${weight}"><button class="icon" aria-label="Verwijderen">×</button>`;
        row.querySelector(".icon").addEventListener("click", () => { row.remove(); calculate(); });
        row.querySelectorAll("input").forEach((field) => field.addEventListener("input", calculate));
        rows.appendChild(row);
      }

      function calculate() {
        const values = [...rows.querySelectorAll(".row")].map((row) => ({
          result: Number(row.querySelector(".grade").value),
          weight: Number(row.querySelector(".weight").value),
        })).filter(({ result, weight }) => result >= 1 && result <= 10 && weight > 0);
        if (!values.length) {
          ["average", "median", "needed", "result"].forEach((name) => input(name).textContent = "—");
          message.textContent = "Voeg cijfers toe of scan je cijferlijst.";
          return;
        }
        const total = values.reduce((sum, item) => sum + item.weight, 0);
        const weighted = values.reduce((sum, item) => sum + item.result * item.weight, 0);
        const average = weighted / total;
        const sorted = values.map((item) => item.result).sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
        const target = Number(input("target").value);
        const future = Number(input("future").value);
        const needed = (target * (total + future) - weighted) / future;
        const bounded = Math.max(1, Math.min(10, needed));
        input("average").textContent = format(average);
        input("median").textContent = format(median);
        input("needed").textContent = format(needed);
        input("result").textContent = format((weighted + bounded * future) / (total + future));
        message.textContent = needed > 10 ? `Je hebt een ${format(needed)} nodig; dat is niet haalbaar met één cijfer.` : `Je hebt ongeveer een ${format(needed)} nodig voor een gemiddelde van ${format(target)}.`;
      }

      function exportCsv() {
        const values = [...rows.querySelectorAll(".row")].map((row) => ({
          grade: row.querySelector(".grade").value,
          weight: row.querySelector(".weight").value,
        })).filter(({ grade, weight }) => grade !== "" && weight !== "");

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

      function readGradeCells() {
        const selectors = [
          ".result-overview--grades td",
          ".result-overview--grades [class*='result']",
          ".container-card table td",
          "table[id^='id'] td",
        ];
        const cells = [...new Set(selectors.flatMap((selector) => [...document.querySelectorAll(selector)]))];
        return cells.map((element) => ({
          element,
          text: element.textContent.trim().replace(",", "."),
        })).filter(({ text }) => /^(?:[1-9](?:\.\d{1,2})?|10(?:\.0{1,2})?)$/.test(text));
      }

      function scan() {
        const grades = readGradeCells();
        rows.innerHTML = "";
        grades.forEach(({ element, text }) => {
          element.classList.add("eduarte-tools-grade-source");
          addRow(text);
          element.addEventListener("click", () => addRow(text), { once: true });
        });
        calculate();
        message.textContent = grades.length ? `${grades.length} cijfers gevonden. Klik op een cijfer om het opnieuw toe te voegen.` : "De resultaten worden nog geladen. Probeer opnieuw zodra de matrix zichtbaar is.";
      }

      shadow.querySelector(".toggle").addEventListener("click", () => { panel.classList.add("open"); panel.setAttribute("aria-hidden", "false"); });
      shadow.querySelector(".close").addEventListener("click", () => { panel.classList.remove("open"); panel.setAttribute("aria-hidden", "true"); });
      shadow.querySelector('[data-action="add"]').addEventListener("click", () => { addRow(); calculate(); });
      shadow.querySelector('[data-action="scan"]').addEventListener("click", scan);
      shadow.querySelector('[data-action="export"]').addEventListener("click", exportCsv);
      input("target").addEventListener("input", calculate);
      input("future").addEventListener("input", calculate);
      addRow();
      calculate();
      const resultsObserver = new MutationObserver(() => {
        if (readGradeCells().length && !root.dataset.resultsFound) {
          root.dataset.resultsFound = "true";
          scan();
        }
      });
      resultsObserver.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => resultsObserver.disconnect(), 30000);
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
