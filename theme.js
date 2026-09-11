// Eduarte Auto Login - theme.js
// Eduarte's UI is built on a CSS custom-property token system
// (--color-bg, --color-text-primary, --color-bg-fill-action, etc., defined
// in :root). Theming here works by overriding just those semantic tokens,
// so every component that already uses them (virtually the whole app)
// re-themes itself automatically - no filter hacks, no guessing at markup.

(function () {
  const STYLE_ID = "study-tools-theme-style";

  // Dark-mode values for the neutral tokens. Left untouched on purpose:
  // "-onbrand" and "-inverse" tokens (e.g. --color-text-onbrand), since
  // those are meant to stay legible against colored fills that are NOT
  // being inverted here.
  const DARK_VARS = {
    "--color-bg": "#15171b",
    "--color-input": "#1f2328",
    "--color-bg-surface": "#1f2328",
    "--color-bg-surface-hover": "#2a2f36",
    "--color-bg-surface-active": "#2a2f36",
    "--color-bg-surface-selected": "#353b43",
    "--color-bg-surface-secondary": "#15171b",
    "--color-bg-surface-secondary-hover": "#353b43",
    "--color-bg-surface-secondary-active": "#3f4650",
    "--color-bg-surface-secondary-selected": "#545e6b",
    "--color-bg-surface-disabled": "#3f4650",
    "--color-bg-fill": "#1f2328",
    "--color-bg-fill-hover": "#2a2f36",
    "--color-bg-fill-active": "#353b43",
    "--color-bg-fill-secondary": "#2a2f36",
    "--color-bg-fill-secondary-hover": "#3f4650",
    "--color-bg-fill-secondary-active": "#545e6b",
    "--color-bg-fill-disabled": "#3f4650",
    "--color-bg-fill-selected": "#2a2f36",
    "--color-bg-surface-brand": "#2a2f36",
    "--color-bg-surface-brand-hover": "#353b43",
    "--color-bg-surface-brand-active": "#3f4650",
    "--color-border-primary": "#545e6b",
    "--color-border-primary-hover": "#697586",
    "--color-border-primary-active": "#87919e",
    "--color-border-secondary": "#3f4650",
    "--color-border-tertiary": "#2a2f36",
    "--color-border-disabled": "#545e6b",
    "--color-icon-primary": "#eef0f1",
    "--color-icon-primary-hover": "#f4f4f6",
    "--color-icon-primary-active": "#fff",
    "--color-icon-secondary": "#dadde2",
    "--color-icon-secondary-hover": "#eef0f1",
    "--color-icon-secondary-active": "#f4f4f6",
    "--color-icon-disabled": "#87919e",
    "--color-icon-placeholder": "#87919e",
    "--color-text-primary": "#f4f4f6",
    "--color-text-secondary": "#eef0f1",
    "--color-text-tertiary": "#cfd3d8",
    "--color-text-disabled": "#87919e",
    "--color-text-placeholder": "#87919e",
  };

  function clamp(n) {
    return Math.max(0, Math.min(255, n));
  }

  function hexToRgb(hex) {
    const m = (hex || "#000000").replace("#", "");
    const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
    const num = parseInt(full, 16) || 0;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0"))
        .join("")
    );
  }

  // amount > 0 lightens, < 0 darkens (roughly, toward white/black).
  function shade(hex, amount) {
    const { r, g, b } = hexToRgb(hex);
    const target = amount > 0 ? 255 : 0;
    const p = Math.abs(amount);
    return rgbToHex(
      r + (target - r) * p,
      g + (target - g) * p,
      b + (target - b) * p
    );
  }

  function accentVars(accent) {
    if (!accent) return {};
    const hover = shade(accent, -0.15);
    const active = shade(accent, -0.3);
    const subtle = shade(accent, 0.85);
    return {
      "--color-bg-fill-action": accent,
      "--color-bg-fill-action-hover": hover,
      "--color-bg-fill-action-active": active,
      "--color-bg-fill-action-subtle": subtle,
      "--color-bg-fill-action-subtle-hover": accent,
      "--color-text-action": accent,
      "--color-text-action-hover": hover,
      "--color-border-action": accent,
      "--color-icon-action": accent,
      "--color-icon-action-hover": hover,
    };
  }

  // Custom theme: the same neutral-token set as DARK_VARS, but every value
  // is derived from just four colors the user picks (background, surface,
  // text, border) using the shade() helper above for the hover/active
  // variants - so a whole coherent palette comes from four color pickers.
  function customVars(colors) {
    if (!colors || !colors.bg) return {};
    const { bg, surface, text, border } = colors;
    return {
      "--color-bg": bg,
      "--color-input": surface,
      "--color-bg-surface": surface,
      "--color-bg-surface-hover": shade(surface, 0.1),
      "--color-bg-surface-active": shade(surface, 0.1),
      "--color-bg-surface-selected": shade(surface, 0.18),
      "--color-bg-surface-secondary": bg,
      "--color-bg-surface-secondary-hover": shade(surface, 0.18),
      "--color-bg-surface-secondary-active": shade(surface, 0.28),
      "--color-bg-surface-secondary-selected": shade(surface, 0.4),
      "--color-bg-surface-disabled": shade(surface, 0.28),
      "--color-bg-fill": surface,
      "--color-bg-fill-hover": shade(surface, 0.1),
      "--color-bg-fill-active": shade(surface, 0.18),
      "--color-bg-fill-secondary": shade(surface, 0.1),
      "--color-bg-fill-secondary-hover": shade(surface, 0.28),
      "--color-bg-fill-secondary-active": shade(surface, 0.4),
      "--color-bg-fill-disabled": shade(surface, 0.28),
      "--color-bg-fill-selected": shade(surface, 0.1),
      "--color-bg-surface-brand": shade(surface, 0.1),
      "--color-bg-surface-brand-hover": shade(surface, 0.18),
      "--color-bg-surface-brand-active": shade(surface, 0.28),
      "--color-border-primary": border,
      "--color-border-primary-hover": shade(border, 0.2),
      "--color-border-primary-active": shade(border, 0.35),
      "--color-border-secondary": shade(border, -0.15),
      "--color-border-tertiary": shade(border, -0.3),
      "--color-border-disabled": border,
      "--color-icon-primary": text,
      "--color-icon-primary-hover": shade(text, 0.1),
      "--color-icon-primary-active": "#fff",
      "--color-icon-secondary": shade(text, -0.15),
      "--color-icon-secondary-hover": shade(text, -0.05),
      "--color-icon-secondary-active": text,
      "--color-icon-disabled": shade(text, -0.4),
      "--color-icon-placeholder": shade(text, -0.4),
      "--color-text-primary": text,
      "--color-text-secondary": shade(text, -0.1),
      "--color-text-tertiary": shade(text, -0.25),
      "--color-text-disabled": shade(text, -0.4),
      "--color-text-placeholder": shade(text, -0.4),
    };
  }

  // "Modern style" layer: purely additive polish (shadows, rounding,
  // hover motion, an accent indicator on the active nav item, a staggered
  // fade-in for the home cards) built on the real classes from Eduarte's
  // own markup/CSS - nothing here fights the existing layout.
  const MODERN_CSS = `
    @keyframes st-card-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    li.now--soft, li.now--tomorrow, li[class*="now--"] {
      border-radius: var(--border-radius-600) !important;
      box-shadow: 0 1px 2px rgba(0,0,0,.05), 0 2px 8px rgba(0,0,0,.05);
      border-left: 3px solid var(--color-bg-fill-action) !important;
      transition: box-shadow 180ms ease, transform 180ms ease;
      animation: st-card-in 320ms ease both;
    }
    #iddf > li:nth-child(1), #iddf > li:nth-child(2) { animation-delay: 0ms; }
    #iddf > li:nth-child(3) { animation-delay: 60ms; }
    #iddf > li:nth-child(4) { animation-delay: 120ms; }
    #iddf > li:nth-child(5) { animation-delay: 180ms; }
    #iddf > li:nth-child(6) { animation-delay: 240ms; }
    #iddf > li:nth-child(7) { animation-delay: 300ms; }
    li.now--soft:hover, li.now--tomorrow:hover, li[class*="now--"]:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,.10);
    }
    li.now--tomorrow.is-clickable {
      cursor: pointer;
    }
    li.now--tomorrow.is-clickable:hover {
      transform: translateY(-1px);
    }
    .now--wrapper ul#iddf {
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }
    .navigation-items--main > li > a {
      display: flex !important;
      align-items: center !important;
      gap: .75rem !important;
      min-height: 3rem !important;
      border-radius: var(--border-radius-400) !important;
      transition: background-color 150ms ease, color 150ms ease, transform 150ms ease;
    }
    .navigation-items--main > li > a > svg,
    .navigation-items--main > li > a > i,
    .navigation-items--main > li > a > span:first-child,
    .navigation-items--main > li > a .icon {
      position: static !important;
      display: inline-flex !important;
      flex: 0 0 1.65rem !important;
      width: 1.65rem !important;
      height: 1.65rem !important;
      margin: 0 !important;
      align-items: center !important;
      justify-content: center !important;
      line-height: 1 !important;
      transform: none !important;
    }
    .navigation-items--main > li > a > span:last-child,
    .navigation-items--main > li > a .navigation-item__label,
    .navigation-items--main > li > a .label {
      min-width: 0 !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      line-height: 1.2 !important;
    }
    .navigation-items--main > li > a:hover {
      transform: translateX(2px);
    }
    .navigation-items--main > li.is-selected > a {
      font-weight: var(--font-weight-600);
      box-shadow: inset 3px 0 0 0 var(--color-bg-fill-action);
    }
    header.header .header-toolbar {
      box-shadow: 0 1px 10px rgba(0,0,0,.12);
    }
    .now--wrapper > h1 {
      letter-spacing: var(--font-letter-spacing-dense);
    }
    body {
      transition: background-color 240ms ease, color 240ms ease;
    }
    nav.navigation.navigation--student {
      padding: .75rem !important;
      box-shadow: 6px 0 24px rgba(15,23,42,.08);
      transition: width 220ms ease, box-shadow 220ms ease, background-color 220ms ease;
    }
    nav.navigation.navigation--student .navigation-items--main {
      gap: .35rem;
    }
    nav.navigation.navigation--student .navigation-items--main > li > a {
      padding: .7rem .85rem !important;
      border-radius: .85rem !important;
    }
    nav.navigation.navigation--student .navigation-items--main > li.is-selected > a {
      background: linear-gradient(90deg, color-mix(in srgb, var(--color-bg-fill-action) 16%, transparent), transparent) !important;
      box-shadow: inset 3px 0 0 var(--color-bg-fill-action), 0 5px 16px rgba(15,23,42,.08);
    }
    header.header .header-toolbar {
      border-bottom: 1px solid color-mix(in srgb, var(--color-border-primary) 55%, transparent);
      transition: box-shadow 220ms ease, background-color 220ms ease;
    }
    .card, .table, table, .container-studiewijzer, .agenda-filter,
    .result-overview, .result-overview--grades, .container-card {
      border-radius: var(--border-radius-400) !important;
      box-shadow: 0 8px 24px rgba(15,23,42,.06);
      transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
    }
    .card:hover, .container-studiewijzer:hover, .result-overview:hover, .container-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 34px rgba(15,23,42,.10);
    }
    .result-overview--grades table {
      border-collapse: separate !important;
      border-spacing: 0 !important;
      overflow: hidden !important;
    }
    .result-overview--grades thead th {
      position: sticky !important;
      top: 0 !important;
      z-index: 1 !important;
      backdrop-filter: blur(12px) !important;
    }
    .result-overview--grades tbody tr {
      transition: background-color 160ms ease, transform 160ms ease !important;
    }
    .result-overview--grades tbody tr:hover {
      background: color-mix(in srgb, var(--color-bg-fill-action) 8%, transparent) !important;
    }
    button, [role="button"], a {
      transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, color 160ms ease;
    }
    button:hover, [role="button"]:hover {
      transform: translateY(-1px);
    }
    input, select, textarea {
      border-radius: .7rem !important;
      transition: border-color 160ms ease, box-shadow 160ms ease;
    }
    input:focus, select:focus, textarea:focus {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-bg-fill-action) 18%, transparent);
    }
    .eduarte-tools-grade-source {
      cursor: pointer !important;
      transition: outline 160ms ease, background-color 160ms ease, transform 160ms ease;
    }
    .eduarte-tools-grade-source:hover {
      outline: 2px solid var(--color-bg-fill-action) !important;
      outline-offset: -2px;
      transform: scale(1.04);
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
    }
  `;

  // Eduarte's whole component kit (cards, tables, tabs, buttons,
  // studiewijzer containers, ...) is built on this radius scale, e.g.
  // `.card{border-radius:var(--border-radius-200)}`. Bumping the scale
  // itself rounds everything site-wide in one shot, instead of guessing
  // selectors page by page.
  const RADIUS_VARS = {
    "--border-radius-100": ".375rem",
    "--border-radius-200": ".625rem",
    "--border-radius-300": ".75rem",
    "--border-radius-400": ".875rem",
    "--border-radius-600": "1.25rem",
    "--border-radius-800": "1.5rem",
    "--border-radius-1600": "2.5rem",
  };

  // "Human" preset (adapted from Study Tools voor Magister's "Human" theme
  // by Nick Verbruggen): dark glassmorphism - a blurred background photo,
  // translucent frosted panels, rounded corners. Built against Eduarte's
  // real classes (nav.navigation, header-toolbar, now--soft/now--tomorrow,
  // agenda-filter, agenda--day li) since Magister's own classes
  // (.appbar, .main-menu, .st-widget, ...) don't exist here.
  // Wallpaper is bundled locally (assets/wallpaper-human.jpg) and served
  // via chrome.runtime.getURL, not hotlinked from a remote host. A remote
  // image URL baked into shipped JS is exactly the pattern AV heuristics
  // (e.g. Defender's "MalUri") flag on; a packaged asset has no such
  // runtime network dependency.
  const HUMAN_WALLPAPER_URL = chrome.runtime.getURL("assets/wallpaper-human.jpg");
  const HUMAN_ACCENT = "#0852a6"; // hsl(212,91%,34%), same hue as the original preset

  const HUMAN_CSS = `
    html {
      background-color: #0a0e14 !important;
      background-image: linear-gradient(rgba(10,14,20,.55), rgba(10,14,20,.55)),
        url('${HUMAN_WALLPAPER_URL}') !important;
      background-position: center center !important;
      background-size: cover !important;
      background-attachment: fixed !important;
      background-repeat: no-repeat !important;
    }
    body, .l-container, .l-flex-content, .content-wrapper, .content {
      background: transparent !important;
    }
    nav.navigation.navigation--student {
      background-color: rgba(21,23,27,.55) !important;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-right: none !important;
    }
    header.header .header-toolbar {
      background-color: rgba(8,19,44,.45) !important;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }
    li.now--soft, li.now--tomorrow, li[class*="now--"], .agenda-filter, .agenda--day li,
    .popover, .card, .table, table, thead, .container-studiewijzer {
      background-color: rgba(31,35,40,.55) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 18px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.3); }
    .navigation-items--main > li > a:hover,
    header.header .header-toolbar i:hover {
      box-shadow: 0 0 13px rgba(0,0,0,.5);
    }
  `;

  function buildWallpaperCSS(wallpaperUrl, blur = 12, overlay = 55) {
    const alpha = (overlay / 100).toFixed(2);
    return `
    html {
      background-color: #0a0e14 !important;
      background-image: linear-gradient(rgba(10,14,20,${alpha}), rgba(10,14,20,${alpha})),
        url('${wallpaperUrl}') !important;
      background-position: center center !important;
      background-size: cover !important;
      background-attachment: fixed !important;
      background-repeat: no-repeat !important;
    }
    body, .l-container, .l-flex-content, .content-wrapper, .content {
      background: transparent !important;
    }
    nav.navigation.navigation--student {
      background-color: rgba(21,23,27,.6) !important;
      backdrop-filter: blur(${blur}px);
      -webkit-backdrop-filter: blur(${blur}px);
      border-right: none !important;
    }
    header.header .header-toolbar {
      background-color: rgba(8,19,44,.5) !important;
      backdrop-filter: blur(${blur}px);
      -webkit-backdrop-filter: blur(${blur}px);
    }
    li.now--soft, li.now--tomorrow, li[class*="now--"], .agenda-filter, .agenda--day li,
    .popover, .card, .table, table, thead, .container-studiewijzer, .container-card, .eduarte-tools-weather-card {
      background-color: rgba(31,35,40,.6) !important;
      backdrop-filter: blur(${Math.max(6, Math.round(blur * 0.75))}px);
      -webkit-backdrop-filter: blur(${Math.max(6, Math.round(blur * 0.75))}px);
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.18); border-radius: 18px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.35); }
    .navigation-items--main > li > a:hover,
    header.header .header-toolbar i:hover {
      box-shadow: 0 0 13px rgba(0,0,0,.5);
    }
    `;
  }

  const FONT_MAP = {
    inter: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    roboto: "'Roboto', 'Segoe UI', Arial, sans-serif",
    poppins: "'Poppins', 'Segoe UI', sans-serif",
    lexend: "'Lexend', 'Segoe UI', sans-serif",
    jetbrains: "'JetBrains Mono', Consolas, Monaco, monospace",
  };

  function buildCSS(s) {
    const useCustom = s.custom && s.custom.bg;
    const hasWallpaper = !!s.wallpaperUrl || s.human;
    const effectiveDark = s.dark || hasWallpaper || useCustom;
    const effectiveAccent = s.accent || (s.human && !useCustom ? HUMAN_ACCENT : "");
    const baseVars = useCustom ? customVars(s.custom) : effectiveDark ? DARK_VARS : {};
    const vars = {
      ...baseVars,
      ...(s.modern || hasWallpaper ? RADIUS_VARS : {}),
      ...accentVars(effectiveAccent),
    };
    const decls = Object.entries(vars)
      .map(([k, v]) => `${k}: ${v} !important;`)
      .join("\n  ");
    let css = decls ? `:root {\n  ${decls}\n}\n` : "";
    if (effectiveDark) {
      css += `html { color-scheme: dark; }\n`;
      const fallbackBg = useCustom ? s.custom.bg : "#15171b";
      const fallbackText = useCustom ? s.custom.text : "#f4f4f6";
      css += `html, body { background-color: ${fallbackBg} !important; color: ${fallbackText} !important; }\n`;
    }
    if (s.font && FONT_MAP[s.font]) {
      css += `body, input, button, select, textarea, .navigation-item__label, h1, h2, h3, h4, p, span, td, th { font-family: ${FONT_MAP[s.font]} !important; }\n`;
    }
    if (s.modern) css += MODERN_CSS;
    if (hasWallpaper) {
      const url = s.wallpaperUrl || HUMAN_WALLPAPER_URL;
      css += buildWallpaperCSS(url, s.wallpaperBlur ?? 12, s.wallpaperOverlay ?? 55);
    }
    if (s.customCss) {
      css += `\n/* Custom User CSS */\n${s.customCss}\n`;
    }
    return css;
  }

  function getOrCreateStyleEl(head) {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      head.appendChild(el);
    } else if (el.parentElement !== head) {
      head.appendChild(el); // keep it last, so it wins cascade ties
    }
    return el;
  }

  function withHead(cb) {
    if (document.head) return cb(document.head);
    const observer = new MutationObserver(() => {
      if (document.head) {
        observer.disconnect();
        cb(document.head);
      }
    });
    observer.observe(document.documentElement || document, {
      childList: true,
      subtree: true,
    });
  }

  function applyTheme(s) {
    withHead((head) => {
      const styleEl = getOrCreateStyleEl(head);
      styleEl.textContent = buildCSS(s);
    });
  }

  function loadAndApply() {
    chrome.storage.local.get(
      [
        "eduarteDarkMode",
        "eduarteAccentColor",
        "eduarteModernStyle",
        "eduarteHumanTheme",
        "eduarteWallpaperUrl",
        "eduarteWallpaperBlur",
        "eduarteWallpaperOverlay",
        "eduarteFont",
        "eduarteCustomCss",
        "eduarteCustomTheme",
        "eduarteCustomColors",
        "eduarteModernNav",
        "eduarteAnimations",
        "eduarteFloatingCards",
      ],
      (data) => {
        applyTheme({
          dark: !!data.eduarteDarkMode,
          accent: data.eduarteAccentColor || "",
          modern: !!data.eduarteModernStyle && data.eduarteModernNav !== false,
          human: !!data.eduarteHumanTheme,
          wallpaperUrl: data.eduarteWallpaperUrl || "",
          wallpaperBlur: data.eduarteWallpaperBlur,
          wallpaperOverlay: data.eduarteWallpaperOverlay,
          font: data.eduarteFont || "default",
          customCss: data.eduarteCustomCss || "",
          custom: data.eduarteCustomTheme ? data.eduarteCustomColors || null : null,
        });
      }
    );
  }

  loadAndApply();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (
      changes.eduarteDarkMode ||
      changes.eduarteAccentColor ||
      changes.eduarteModernStyle ||
      changes.eduarteHumanTheme ||
      changes.eduarteWallpaperUrl ||
      changes.eduarteWallpaperBlur ||
      changes.eduarteWallpaperOverlay ||
      changes.eduarteFont ||
      changes.eduarteCustomCss ||
      changes.eduarteCustomTheme ||
      changes.eduarteCustomColors ||
      changes.eduarteModernNav ||
      changes.eduarteAnimations ||
      changes.eduarteFloatingCards
    ) {
      loadAndApply();
    }
  });
})();
