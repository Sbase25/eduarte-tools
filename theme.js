// Eduarte Tools - theme.js
// Modern theming & styling engine for Eduarte and Educus portals.

(function () {
  const STYLE_ID = "eduarte-tools-theme-style";

  const PRESETS = {
    dark: {
      dark: true,
      accent: "#3b82f6",
      bg: "#111827",
      surface: "#1f2937",
      text: "#f9fafb",
      border: "#374151",
    },
    blue: {
      dark: true,
      accent: "#38bdf8",
      bg: "#0b192c",
      surface: "#13253f",
      text: "#f0f9ff",
      border: "#1e3a5f",
    },
    purple: {
      dark: true,
      accent: "#c084fc",
      bg: "#130e24",
      surface: "#20163b",
      text: "#faf5ff",
      border: "#3b2d64",
    },
    emerald: {
      dark: true,
      accent: "#34d399",
      bg: "#062319",
      surface: "#0b3829",
      text: "#ecfdf5",
      border: "#14533d",
    },
    sunset: {
      dark: true,
      accent: "#fb923c",
      bg: "#1c0f0a",
      surface: "#2e1810",
      text: "#fff7ed",
      border: "#542d1f",
    },
    oled: {
      dark: true,
      accent: "#38bdf8",
      bg: "#000000",
      surface: "#09090b",
      text: "#ffffff",
      border: "#27272a",
    },
    nord: {
      dark: true,
      accent: "#88c0d0",
      bg: "#242933",
      surface: "#2e3440",
      text: "#eceff4",
      border: "#434c5e",
    },
    cyberpunk: {
      dark: true,
      accent: "#f43f5e",
      bg: "#090717",
      surface: "#140e2b",
      text: "#fdf4ff",
      border: "#2e1c59",
    },
    light: {
      dark: false,
      accent: "#2563eb",
      bg: "#f8fafc",
      surface: "#ffffff",
      text: "#0f172a",
      border: "#e2e8f0",
    },
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
    const subtle = shade(accent, 0.75);
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

  function deriveThemeTokens(colors, isDark = true) {
    if (!colors || !colors.bg) return {};
    const { bg, surface, text, border } = colors;
    const step = isDark ? 1 : -1;
    return {
      "--color-bg": bg,
      "--color-input": surface,
      "--color-bg-surface": surface,
      "--color-bg-surface-hover": shade(surface, 0.08 * step),
      "--color-bg-surface-active": shade(surface, 0.14 * step),
      "--color-bg-surface-selected": shade(surface, 0.20 * step),
      "--color-bg-surface-secondary": bg,
      "--color-bg-surface-secondary-hover": shade(surface, 0.15 * step),
      "--color-bg-surface-secondary-active": shade(surface, 0.25 * step),
      "--color-bg-surface-secondary-selected": shade(surface, 0.35 * step),
      "--color-bg-surface-disabled": shade(surface, 0.25 * step),
      "--color-bg-fill": surface,
      "--color-bg-fill-hover": shade(surface, 0.08 * step),
      "--color-bg-fill-active": shade(surface, 0.15 * step),
      "--color-bg-fill-secondary": shade(surface, 0.10 * step),
      "--color-bg-fill-secondary-hover": shade(surface, 0.25 * step),
      "--color-bg-fill-secondary-active": shade(surface, 0.35 * step),
      "--color-bg-fill-disabled": shade(surface, 0.25 * step),
      "--color-bg-fill-selected": shade(surface, 0.12 * step),
      "--color-bg-surface-brand": shade(surface, 0.10 * step),
      "--color-bg-surface-brand-hover": shade(surface, 0.18 * step),
      "--color-bg-surface-brand-active": shade(surface, 0.28 * step),
      "--color-border-primary": border,
      "--color-border-primary-hover": shade(border, 0.20 * step),
      "--color-border-primary-active": shade(border, 0.35 * step),
      "--color-border-secondary": shade(border, -0.15 * step),
      "--color-border-tertiary": shade(border, -0.30 * step),
      "--color-border-disabled": border,
      "--color-icon-primary": text,
      "--color-icon-primary-hover": isDark ? "#ffffff" : "#000000",
      "--color-icon-primary-active": isDark ? "#ffffff" : "#000000",
      "--color-icon-secondary": shade(text, -0.15 * step),
      "--color-icon-secondary-hover": shade(text, -0.05 * step),
      "--color-icon-secondary-active": text,
      "--color-icon-disabled": shade(text, -0.40 * step),
      "--color-icon-placeholder": shade(text, -0.40 * step),
      "--color-text-primary": text,
      "--color-text-secondary": shade(text, -0.12 * step),
      "--color-text-tertiary": shade(text, -0.25 * step),
      "--color-text-disabled": shade(text, -0.45 * step),
      "--color-text-placeholder": shade(text, -0.45 * step),
    };
  }

  const RADIUS_VARS = {
    "--border-radius-100": ".375rem",
    "--border-radius-200": ".625rem",
    "--border-radius-300": ".75rem",
    "--border-radius-400": ".875rem",
    "--border-radius-600": "1.25rem",
    "--border-radius-800": "1.5rem",
    "--border-radius-1600": "2.5rem",
  };

  const HUMAN_WALLPAPER_URL = chrome.runtime.getURL("assets/wallpaper-human.jpg");
  const HUMAN_ACCENT = "#0852a6";

  const FONT_MAP = {
    inter: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    roboto: "'Roboto', 'Segoe UI', Arial, sans-serif",
    poppins: "'Poppins', 'Segoe UI', sans-serif",
    lexend: "'Lexend', 'Segoe UI', sans-serif",
    jetbrains: "'JetBrains Mono', Consolas, Monaco, monospace",
  };

  function getModernDesignCSS(effectiveBg, effectiveSurface, effectiveText, effectiveBorder, effectiveAccent, isDark) {
    return `
    /* --- MODERN POLISH LAYER --- */
    @keyframes st-card-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Algemene achtergrond en tekst */
    html, body {
      background-color: ${effectiveBg} !important;
      color: ${effectiveText} !important;
      transition: background-color 220ms ease, color 220ms ease;
    }

    .l-container, .l-flex-content, .content-wrapper, .content, main, .main-content {
      background: transparent !important;
      color: ${effectiveText} !important;
    }

    /* Eduarte Header & Toolbar */
    header.header,
    header.header .header-toolbar,
    .header,
    .header-toolbar,
    .header-wrapper,
    .header-top,
    .app-header,
    .page-header {
      background: ${effectiveSurface} !important;
      background-color: ${effectiveSurface} !important;
      color: ${effectiveText} !important;
      border-bottom: 1px solid color-mix(in srgb, ${effectiveBorder} 65%, transparent) !important;
      box-shadow: 0 4px 20px rgba(0,0,0,${isDark ? '0.25' : '0.06'}) !important;
      transition: background-color 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
    }

    header.header .header-toolbar *,
    .header *,
    .header-toolbar *,
    .header-top *,
    .app-header * {
      color: ${effectiveText} !important;
    }

    header.header .header-toolbar i,
    header.header .header-toolbar svg,
    .header .icon,
    .header-toolbar .icon {
      color: ${effectiveText} !important;
      transition: transform 0.2s ease, color 0.2s ease;
    }

    header.header .header-toolbar i:hover,
    header.header .header-toolbar svg:hover {
      color: ${effectiveAccent} !important;
      transform: scale(1.1);
    }

    /* Eduarte Student Sidebar */
    nav.navigation,
    nav.navigation.navigation--student,
    .sidebar {
      background-color: ${effectiveSurface} !important;
      padding: .75rem !important;
      border-right: 1px solid color-mix(in srgb, ${effectiveBorder} 60%, transparent) !important;
      box-shadow: 4px 0 24px rgba(0,0,0,${isDark ? '0.2' : '0.04'}) !important;
      transition: width 220ms ease, box-shadow 220ms ease, background-color 220ms ease;
    }

    nav.navigation.navigation--student .navigation-items--main {
      gap: .4rem;
    }

    nav.navigation.navigation--student .navigation-items--main > li > a {
      display: flex !important;
      align-items: center !important;
      gap: .75rem !important;
      min-height: 2.85rem !important;
      padding: .65rem .85rem !important;
      border-radius: .85rem !important;
      color: color-mix(in srgb, ${effectiveText} 85%, transparent) !important;
      transition: background-color 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
    }

    nav.navigation.navigation--student .navigation-items--main > li > a:hover {
      background: color-mix(in srgb, ${effectiveAccent} 15%, transparent) !important;
      color: ${effectiveText} !important;
      transform: translateX(3px);
    }

    nav.navigation.navigation--student .navigation-items--main > li.is-selected > a {
      background: linear-gradient(90deg, color-mix(in srgb, ${effectiveAccent} 22%, transparent), color-mix(in srgb, ${effectiveAccent} 8%, transparent)) !important;
      color: ${effectiveText} !important;
      font-weight: 600 !important;
      box-shadow: inset 3px 0 0 ${effectiveAccent}, 0 4px 14px rgba(0,0,0,${isDark ? '0.2' : '0.05'});
    }

    /* Start / Dashboard Cards & Now-Cards */
    li.now--soft,
    li.now--tomorrow,
    li[class*="now--"],
    #iddf > li {
      background-color: ${effectiveSurface} !important;
      border: 1px solid color-mix(in srgb, ${effectiveBorder} 65%, transparent) !important;
      border-radius: 18px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,${isDark ? '0.18' : '0.05'});
      border-left: 4px solid ${effectiveAccent} !important;
      transition: box-shadow 200ms ease, transform 200ms ease, border-color 200ms ease;
      animation: st-card-in 320ms ease both;
      color: ${effectiveText} !important;
    }

    #iddf > li:nth-child(1), #iddf > li:nth-child(2) { animation-delay: 0ms; }
    #iddf > li:nth-child(3) { animation-delay: 60ms; }
    #iddf > li:nth-child(4) { animation-delay: 120ms; }
    #iddf > li:nth-child(5) { animation-delay: 180ms; }

    li.now--soft:hover,
    li.now--tomorrow:hover,
    li[class*="now--"]:hover,
    #iddf > li:hover {
      box-shadow: 0 8px 28px rgba(0,0,0,${isDark ? '0.28' : '0.10'});
      transform: translateY(-2px);
    }

    .now--wrapper ul#iddf {
      display: flex;
      flex-direction: column;
      gap: .65rem;
    }

    /* Kaarten, Panels, Studiewijzers & Overzichten */
    .card,
    .container-card,
    .container-studiewijzer,
    .agenda-filter,
    .agenda--day,
    .agenda--day li,
    .result-overview,
    .panel,
    .box {
      background-color: ${effectiveSurface} !important;
      color: ${effectiveText} !important;
      border: 1px solid color-mix(in srgb, ${effectiveBorder} 60%, transparent) !important;
      border-radius: 16px !important;
      box-shadow: 0 6px 20px rgba(0,0,0,${isDark ? '0.18' : '0.04'});
      transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
    }

    .card:hover,
    .container-studiewijzer:hover,
    .result-overview:hover,
    .container-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(0,0,0,${isDark ? '0.28' : '0.08'});
    }

    /* Tabellen & Cijferlijsten */
    .table, table, .result-overview--grades table {
      background-color: ${effectiveSurface} !important;
      color: ${effectiveText} !important;
      border-collapse: separate !important;
      border-spacing: 0 !important;
      border-radius: 14px !important;
      overflow: hidden !important;
      border: 1px solid color-mix(in srgb, ${effectiveBorder} 60%, transparent) !important;
    }

    table thead th, .result-overview--grades thead th {
      background-color: color-mix(in srgb, ${effectiveSurface} 90%, ${effectiveBg}) !important;
      color: ${effectiveText} !important;
      font-weight: 600 !important;
      border-bottom: 2px solid ${effectiveBorder} !important;
      padding: 10px 14px !important;
    }

    table tbody tr, .result-overview--grades tbody tr {
      border-bottom: 1px solid color-mix(in srgb, ${effectiveBorder} 40%, transparent) !important;
      transition: background-color 150ms ease !important;
    }

    table tbody tr:hover, .result-overview--grades tbody tr:hover {
      background-color: color-mix(in srgb, ${effectiveAccent} 10%, transparent) !important;
    }

    table td, .result-overview--grades td {
      color: ${effectiveText} !important;
      padding: 10px 14px !important;
    }

    /* Knoppen & Interactieve elementen */
    button, .button, [role="button"], input[type="submit"], input[type="button"] {
      border-radius: 12px !important;
      transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, filter 160ms ease;
    }

    button:hover, .button:hover, [role="button"]:hover {
      transform: translateY(-1px);
    }

    /* Formuliervelden */
    input[type="text"], input[type="password"], input[type="number"], select, textarea {
      background-color: ${isDark ? 'rgba(0,0,0,0.25)' : '#ffffff'} !important;
      color: ${effectiveText} !important;
      border: 1px solid ${effectiveBorder} !important;
      border-radius: 10px !important;
      padding: 8px 12px !important;
      outline: 0 !important;
      transition: border-color 160ms ease, box-shadow 160ms ease;
    }

    input:focus, select:focus, textarea:focus {
      border-color: ${effectiveAccent} !important;
      box-shadow: 0 0 0 3px color-mix(in srgb, ${effectiveAccent} 25%, transparent) !important;
    }

    /* Scrollbars */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: color-mix(in srgb, ${effectiveBorder} 80%, transparent); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: ${effectiveAccent}; }

    /* Cijfercalculator highlight effect */
    .eduarte-tools-grade-source {
      cursor: pointer !important;
      transition: outline 160ms ease, background-color 160ms ease, transform 160ms ease;
      border-radius: 6px !important;
    }
    .eduarte-tools-grade-source:hover {
      outline: 2px solid ${effectiveAccent} !important;
      background-color: color-mix(in srgb, ${effectiveAccent} 18%, transparent) !important;
      transform: scale(1.05);
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
    }
    `;
  }

  function buildWallpaperCSS(wallpaperUrl, blur = 12, overlay = 55, accent = "#2563eb") {
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
    body, .l-container, .l-flex-content, .content-wrapper, .content, main {
      background: transparent !important;
    }
    nav.navigation.navigation--student, .sidebar {
      background-color: rgba(17,24,39,.65) !important;
      backdrop-filter: blur(${blur}px) !important;
      -webkit-backdrop-filter: blur(${blur}px) !important;
      border-right: 1px solid rgba(255,255,255,.1) !important;
    }
    header.header, header.header .header-toolbar, .header, .header-toolbar, .header-wrapper, .app-header {
      background-color: rgba(15,20,30,.65) !important;
      backdrop-filter: blur(${blur}px) !important;
      -webkit-backdrop-filter: blur(${blur}px) !important;
      border-bottom: 1px solid rgba(255,255,255,.1) !important;
    }
    header.header .header-toolbar *, .header * {
      color: #f4f4f6 !important;
    }
    li.now--soft, li.now--tomorrow, li[class*="now--"], #iddf > li, .agenda-filter, .agenda--day li,
    .popover, .card, .table, table, thead, .container-studiewijzer, .container-card {
      background-color: rgba(31,41,55,.65) !important;
      backdrop-filter: blur(${Math.max(6, Math.round(blur * 0.75))}px) !important;
      -webkit-backdrop-filter: blur(${Math.max(6, Math.round(blur * 0.75))}px) !important;
      border: 1px solid rgba(255,255,255,.12) !important;
    }
    `;
  }

  function buildCSS(s) {
    const presetKey = s.preset || "dark";
    const presetConfig = PRESETS[presetKey] || PRESETS.dark;

    const useCustom = s.custom && s.custom.bg && s.customEnabled;
    const isDark = useCustom ? !!s.dark : (s.preset ? presetConfig.dark : !!s.dark);

    const effectiveBg = useCustom ? s.custom.bg : (s.preset ? presetConfig.bg : (isDark ? "#111827" : "#f8fafc"));
    const effectiveSurface = useCustom ? s.custom.surface : (s.preset ? presetConfig.surface : (isDark ? "#1f2937" : "#ffffff"));
    const effectiveText = useCustom ? s.custom.text : (s.preset ? presetConfig.text : (isDark ? "#f9fafb" : "#0f172a"));
    const effectiveBorder = useCustom ? s.custom.border : (s.preset ? presetConfig.border : (isDark ? "#374151" : "#e2e8f0"));
    const effectiveAccent = s.accent || (s.preset ? presetConfig.accent : (s.human ? HUMAN_ACCENT : "#2563eb"));

    const themeColors = {
      bg: effectiveBg,
      surface: effectiveSurface,
      text: effectiveText,
      border: effectiveBorder,
    };

    const hasWallpaper = !!s.wallpaperUrl || s.human;
    const baseVars = deriveThemeTokens(themeColors, isDark);
    const vars = {
      ...baseVars,
      ...(s.modern || hasWallpaper ? RADIUS_VARS : {}),
      ...accentVars(effectiveAccent),
    };

    const decls = Object.entries(vars)
      .map(([k, v]) => `${k}: ${v} !important;`)
      .join("\n  ");

    let css = decls ? `:root {\n  ${decls}\n}\n` : "";

    if (isDark) {
      css += `html { color-scheme: dark; }\n`;
    } else {
      css += `html { color-scheme: light; }\n`;
    }

    if (s.font && FONT_MAP[s.font]) {
      css += `body, input, button, select, textarea, .navigation-item__label, h1, h2, h3, h4, p, span, td, th { font-family: ${FONT_MAP[s.font]} !important; }\n`;
    }

    if (s.modern !== false) {
      css += getModernDesignCSS(effectiveBg, effectiveSurface, effectiveText, effectiveBorder, effectiveAccent, isDark);
    }

    if (hasWallpaper) {
      const url = s.wallpaperUrl || HUMAN_WALLPAPER_URL;
      css += buildWallpaperCSS(url, s.wallpaperBlur ?? 12, s.wallpaperOverlay ?? 55, effectiveAccent);
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
      head.appendChild(el);
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
        "eduarteThemePreset",
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
          preset: data.eduarteThemePreset || "dark",
          dark: data.eduarteDarkMode !== false,
          accent: data.eduarteAccentColor || "",
          modern: data.eduarteModernStyle !== false,
          human: !!data.eduarteHumanTheme,
          wallpaperUrl: data.eduarteWallpaperUrl || "",
          wallpaperBlur: data.eduarteWallpaperBlur,
          wallpaperOverlay: data.eduarteWallpaperOverlay,
          font: data.eduarteFont || "default",
          customCss: data.eduarteCustomCss || "",
          customEnabled: !!data.eduarteCustomTheme,
          custom: data.eduarteCustomColors || null,
        });
      }
    );
  }

  loadAndApply();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (
      changes.eduarteThemePreset ||
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
