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
    portal: {
      dark: true,
      accent: "#3478ff",
      bg: "#080d22",
      surface: "#111a36",
      text: "#f3f6ff",
      border: "#29365f",
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
    const onPrimary = isDark ? "#10111a" : "#ffffff";
    const primaryContainer = `color-mix(in srgb, ${effectiveAccent} ${isDark ? "32%" : "18%"}, ${effectiveBg})`;
    const surfaceLow = `color-mix(in srgb, ${effectiveSurface} 58%, ${effectiveBg})`;
    const surfaceHigh = `color-mix(in srgb, ${effectiveSurface} 84%, ${effectiveText})`;
    const surfaceHighest = `color-mix(in srgb, ${effectiveSurface} 72%, ${effectiveText})`;

    return `
    /* Material 3 color and shape roles adapted to the user's Eduarte theme. */
    :root {
      --md-sys-color-primary: ${effectiveAccent};
      --md-sys-color-on-primary: ${onPrimary};
      --md-sys-color-primary-container: ${primaryContainer};
      --md-sys-color-on-primary-container: ${effectiveText};
      --md-sys-color-secondary: ${effectiveAccent};
      --md-sys-color-on-secondary: ${onPrimary};
      --md-sys-color-secondary-container: ${primaryContainer};
      --md-sys-color-on-secondary-container: ${effectiveText};
      --md-sys-color-surface: ${effectiveBg};
      --md-sys-color-surface-container-lowest: ${effectiveBg};
      --md-sys-color-surface-container-low: ${surfaceLow};
      --md-sys-color-surface-container: ${effectiveSurface};
      --md-sys-color-surface-container-high: ${surfaceHigh};
      --md-sys-color-surface-container-highest: ${surfaceHighest};
      --md-sys-color-surface-variant: ${effectiveSurface};
      --md-sys-color-on-surface: ${effectiveText};
      --md-sys-color-on-surface-variant: color-mix(in srgb, ${effectiveText} 76%, ${effectiveBg});
      --md-sys-color-outline: color-mix(in srgb, ${effectiveBorder} 70%, ${effectiveText});
      --md-sys-color-outline-variant: ${effectiveBorder};
      --md-sys-color-background: ${effectiveBg};
      --md-sys-color-on-background: ${effectiveText};
      --md-sys-shape-corner-extra-small: 8px;
      --md-sys-shape-corner-small: 12px;
      --md-sys-shape-corner-medium: 16px;
      --md-sys-shape-corner-large: 24px;
      --md-sys-shape-corner-extra-large: 32px;
      color-scheme: ${isDark ? "dark" : "light"};
    }

    @keyframes eduarte-m3-enter {
      from { opacity: 0; translate: 0 5px; }
      to { opacity: 1; translate: 0 0; }
    }

    html, body {
      background-color: ${effectiveBg} !important;
      color: ${effectiveText} !important;
      transition: background-color 180ms ease, color 180ms ease;
    }

    .l-container, .l-flex-content, .content-wrapper, .content, main, .main-content {
      background: transparent !important;
      color: ${effectiveText} !important;
    }

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
      border-bottom: 1px solid ${effectiveBorder} !important;
      box-shadow: 0 1px 3px rgba(0,0,0,${isDark ? ".24" : ".08"}) !important;
      transition: background-color 180ms ease, border-color 180ms ease;
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

    nav.navigation,
    nav.navigation.navigation--student,
    .sidebar {
      background-color: ${effectiveSurface} !important;
      border-right: 1px solid ${effectiveBorder} !important;
      box-shadow: none !important;
      transition: background-color 180ms ease, border-color 180ms ease;
    }

    nav.navigation.navigation--student .navigation-items--main > li > a,
    nav.navigation.navigation--student .navigation-items--main > li > a[aria-current] {
      min-height: 48px;
      margin: 4px 8px !important;
      border-radius: 999px !important;
      color: color-mix(in srgb, ${effectiveText} 82%, transparent) !important;
      transition: background-color 160ms ease, color 160ms ease;
    }

    nav.navigation.navigation--student .navigation-items--main > li > a:hover {
      background: color-mix(in srgb, ${effectiveAccent} 12%, transparent) !important;
      color: ${effectiveText} !important;
    }

    nav.navigation.navigation--student .navigation-items--main > li:is(.is-selected, .is-active, .active) > a,
    nav.navigation.navigation--student .navigation-items--main > li > a[aria-current="page"] {
      background: ${primaryContainer} !important;
      color: ${effectiveText} !important;
      font-weight: 600 !important;
      box-shadow: none !important;
    }

    li.now--soft,
    li.now--tomorrow,
    li[class*="now--"],
    #iddf > li {
      background-color: ${effectiveSurface} !important;
      border: 1px solid ${effectiveBorder} !important;
      border-radius: 24px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,${isDark ? ".24" : ".08"}) !important;
      border-inline-start: 3px solid ${effectiveAccent} !important;
      transition: box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease;
      animation: eduarte-m3-enter 220ms ease both;
      color: ${effectiveText} !important;
    }

    li.now--soft:hover,
    li.now--tomorrow:hover,
    li[class*="now--"]:hover,
    #iddf > li:hover {
      box-shadow: 0 3px 8px rgba(0,0,0,${isDark ? ".25" : ".1"}) !important;
    }

    .now--wrapper ul#iddf {
      display: flex;
      flex-direction: column;
      gap: .65rem;
    }

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
      border: 1px solid ${effectiveBorder} !important;
      border-radius: 22px 22px 8px 22px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,${isDark ? ".22" : ".07"}) !important;
      transition: box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease;
    }

    .card:hover,
    .container-studiewijzer:hover,
    .result-overview:hover,
    .container-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,${isDark ? ".2" : ".08"}) !important;
    }

    .table, table, .result-overview--grades table {
      background-color: ${effectiveSurface} !important;
      color: ${effectiveText} !important;
      border-collapse: separate !important;
      border-spacing: 0 !important;
      border-radius: 18px !important;
      border: 1px solid ${effectiveBorder} !important;
    }

    table thead th, .result-overview--grades thead th {
      background-color: ${surfaceLow} !important;
      color: ${effectiveText} !important;
      font-weight: 600 !important;
      border-bottom: 1px solid ${effectiveBorder} !important;
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

    button, .button, [role="button"], input[type="submit"], input[type="button"] {
      border-radius: 16px 16px 6px 16px;
      transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
    }

    button:focus-visible, .button:focus-visible, [role="button"]:focus-visible,
    a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
      outline: 2px solid ${effectiveAccent} !important;
      outline-offset: 2px !important;
    }

    input[type="text"], input[type="email"], input[type="password"], input[type="number"],
    input[type="search"], select, textarea {
      box-sizing: border-box;
      max-width: 100%;
      min-height: 40px;
      background-color: ${surfaceHigh} !important;
      color: ${effectiveText} !important;
      border: 1px solid ${effectiveBorder};
      border-radius: 14px 14px 6px 14px;
      padding: 8px 12px;
      outline: 0 !important;
      transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
    }

    input[type="text"]:focus, input[type="email"]:focus, input[type="password"]:focus,
    input[type="number"]:focus, input[type="search"]:focus, select:focus, textarea:focus {
      border: 2px solid ${effectiveAccent} !important;
      padding: 7px 11px;
      box-shadow: none !important;
    }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: color-mix(in srgb, ${effectiveBorder} 80%, transparent); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: ${effectiveAccent}; }

    .eduarte-tools-grade-source {
      cursor: pointer !important;
      transition: outline 160ms ease, background-color 160ms ease;
      border-radius: 8px !important;
    }
    .eduarte-tools-grade-source:hover {
      outline: 2px solid ${effectiveAccent} !important;
      background-color: color-mix(in srgb, ${effectiveAccent} 18%, transparent) !important;
    }
    .eduarte-tools-grade-selected {
      outline: 2px solid ${effectiveAccent} !important;
      outline-offset: -2px !important;
    }

    fieldset {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
      border-radius: 16px;
    }

    legend {
      max-width: 100%;
      padding-inline: 6px;
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

  function buildPortalLayoutCSS(s) {
    const bg = s.bg || "#080d22";
    const accent = s.accent || "#3478ff";
    const surface = s.surface || "#111a36";
    const text = s.text || "#f3f6ff";
    const border = s.border || "#29365f";
    return `
    header.header:has(> .header-tabs) {
      display: flex !important;
      flex-direction: column !important;
      width: auto !important;
      min-height: 0 !important;
      gap: 0 !important;
      overflow: hidden !important;
      border: 1px solid color-mix(in srgb, ${border} 72%, ${text} 28%) !important;
      border-radius: 24px !important;
      background: linear-gradient(110deg,
        color-mix(in srgb, ${surface} 92%, ${accent} 8%),
        ${surface}) !important;
      box-shadow: 0 14px 40px rgba(2,7,28,.2), inset 0 1px rgba(255,255,255,.06) !important;
    }

    header.header:has(> .header-tabs) > .header-toolbar {
      display: flex !important;
      align-items: center !important;
      flex: 0 0 auto !important;
      min-height: 68px !important;
      margin: 0 !important;
      padding: 0 20px !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: linear-gradient(110deg,
        color-mix(in srgb, ${surface} 92%, ${accent} 8%),
        ${surface}) !important;
      box-shadow: none !important;
    }

    header.header:has(> .header-tabs) > .header-tabs {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      flex: 0 0 auto !important;
      min-height: 64px !important;
      margin: 0 !important;
      padding: 6px 12px 0 !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
      border: 0 !important;
      border-top: 1px solid color-mix(in srgb, ${border} 70%, transparent) !important;
      border-radius: 0 !important;
      background: linear-gradient(110deg,
        color-mix(in srgb, ${surface} 91%, ${accent} 9%),
        color-mix(in srgb, ${surface} 97%, ${accent} 3%)) !important;
      box-shadow: none !important;
      scrollbar-width: thin !important;
    }

    header.header:has(> .header-tabs) > .header-tabs > ul {
      display: flex !important;
      flex-wrap: wrap !important;
      justify-content: center !important;
      align-items: stretch !important;
      width: 100% !important;
      max-width: none !important;
      box-sizing: border-box !important;
      min-height: 58px !important;
      gap: 6px !important;
      margin: 0 auto !important;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      list-style: none !important;
    }

    header.header:has(> .header-tabs) > .header-tabs > ul > li {
      display: flex !important;
      flex: 1 1 0 !important;
      max-width: 220px !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      align-items: stretch !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      list-style: none !important;
    }

    header.header:has(> .header-tabs) > .header-tabs > ul > li:not(:has(> a)) {
      display: none !important;
    }

    header.header:has(> .header-tabs) > .header-tabs > ul > li > a {
      display: inline-flex !important;
      width: 100% !important;
      box-sizing: border-box !important;
      min-width: 0 !important;
      flex: 1 1 auto !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 58px !important;
      margin: 0 !important;
      padding: 0 10px !important;
      border: 0 !important;
      border-radius: 14px 14px 0 0 !important;
      background: transparent !important;
      color: color-mix(in srgb, ${text} 78%, transparent) !important;
      font-weight: 600 !important;
      text-decoration: none !important;
      white-space: nowrap !important;
      transition: background-color 160ms ease, color 160ms ease, box-shadow 160ms ease !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    header.header:has(> .header-tabs) > .header-tabs > ul > li > a:hover {
      background: color-mix(in srgb, ${accent} 14%, transparent) !important;
      color: ${text} !important;
    }

    @media (max-width: 700px) {
      header.header:has(> .header-tabs) > .header-tabs > ul > li {
        flex-basis: 45% !important;
        max-width: none !important;
      }
    }

    @media (max-width: 420px) {
      header.header:has(> .header-tabs) > .header-tabs > ul > li {
        flex-basis: 100% !important;
      }
    }

    header.header:has(> .header-tabs) > .header-tabs > ul > li.is-selected > a {
      border: 0 !important;
      border-radius: 14px 14px 0 0 !important;
      background: linear-gradient(180deg,
        color-mix(in srgb, ${accent} 28%, ${surface}),
        color-mix(in srgb, ${accent} 17%, ${surface})) !important;
      box-shadow: inset 0 1px rgba(255,255,255,.12), inset 0 -3px ${accent} !important;
      color: ${text} !important;
    }

    header.header:has(> .header-tabs) > .header-tabs--toggle {
      display: none !important;
    }

    .result-overview--table {
      overflow: hidden !important;
      border: 1px solid color-mix(in srgb, ${border} 75%, ${text} 25%) !important;
      border-radius: 18px !important;
      border-collapse: separate !important;
      border-spacing: 0 !important;
      background: color-mix(in srgb, ${surface} 96%, ${accent} 4%) !important;
      box-shadow: 0 8px 26px rgba(2,7,28,.16) !important;
    }

    .result-overview--table > thead > tr > th {
      padding: 14px 16px !important;
      border-bottom: 1px solid color-mix(in srgb, ${border} 82%, transparent) !important;
      background: color-mix(in srgb, ${surface} 86%, ${accent} 14%) !important;
      color: ${text} !important;
      font-weight: 700 !important;
    }

    .result-overview--table > tbody > tr > td {
      padding: 13px 16px !important;
      border-bottom: 1px solid color-mix(in srgb, ${border} 76%, transparent) !important;
      background: color-mix(in srgb, ${surface} 97%, ${bg}) !important;
      color: ${text} !important;
      transition: background-color 160ms ease !important;
    }

    .result-overview--table > tbody > tr:nth-child(even) > td {
      background: color-mix(in srgb, ${surface} 90%, ${accent} 10%) !important;
    }

    .result-overview--table > tbody > tr:hover > td {
      background: color-mix(in srgb, ${surface} 78%, ${accent} 22%) !important;
    }

    .result-overview--table > tbody > tr:last-child > td {
      border-bottom: 0 !important;
    }

    nav.navigation,
    nav.navigation.navigation--student,
    .sidebar {
      box-sizing: border-box !important;
      height: calc(100vh - 24px) !important;
      margin: 12px 0 12px 12px !important;
      overflow: hidden !important;
      border: 1px solid color-mix(in srgb, ${border} 72%, ${text} 28%) !important;
      border-radius: 26px !important;
      background: linear-gradient(155deg,
        color-mix(in srgb, ${surface} 95%, ${accent} 5%),
        color-mix(in srgb, ${surface} 98%, ${text} 2%)) !important;
      box-shadow: 0 18px 50px rgba(2,7,28,.32), inset 0 1px rgba(255,255,255,.07) !important;
      backdrop-filter: blur(20px) saturate(140%) !important;
      -webkit-backdrop-filter: blur(20px) saturate(140%) !important;
    }

    header.header,
    .header,
    .header-wrapper,
    .app-header,
    .page-header {
      box-sizing: border-box !important;
      min-height: 68px !important;
      margin: 12px 12px 0 0 !important;
      border: 1px solid color-mix(in srgb, ${border} 72%, ${text} 28%) !important;
      border-radius: 24px !important;
      background: linear-gradient(110deg,
        color-mix(in srgb, ${surface} 95%, ${accent} 5%),
        color-mix(in srgb, ${surface} 98%, ${text} 2%)) !important;
      box-shadow: 0 14px 40px rgba(2,7,28,.2), inset 0 1px rgba(255,255,255,.06) !important;
      backdrop-filter: blur(20px) saturate(135%) !important;
      -webkit-backdrop-filter: blur(20px) saturate(135%) !important;
    }

    @media (min-width: 960px) {
      header.header {
        left: calc(var(--navigation-width) + 12px) !important;
      }
    }

    header.header .header-toolbar,
    .header .header-toolbar,
    .header-toolbar,
    .header-top {
      margin: 0 !important;
      border: 0 !important;
      border-radius: inherit !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    nav.navigation.navigation--student a {
      min-height: 46px !important;
      margin: 3px 8px !important;
      padding-inline: 14px !important;
      border: 1px solid transparent !important;
      border-radius: 999px !important;
      color: color-mix(in srgb, ${text} 82%, transparent) !important;
      transition: background 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease !important;
    }

    nav.navigation.navigation--student .navigation-items--main {
      display: flex !important;
      flex-direction: column !important;
      gap: 3px !important;
      padding: 10px 8px !important;
    }

    nav.navigation.navigation--student .navigation-items--main > li > a {
      min-height: 48px !important;
      margin: 0 2px !important;
      background: transparent !important;
    }

    nav.navigation.navigation--student .navigation-items--main > li > a .icon,
    nav.navigation.navigation--student .navigation-items--main > li > a > svg,
    nav.navigation.navigation--student .navigation-items--main > li > a > i {
      color: var(--portal-nav-icon-color, #b9c9ee) !important;
      filter: drop-shadow(0 1px 5px color-mix(in srgb, currentColor 32%, transparent));
      transition: color 180ms ease, transform 180ms ease, filter 180ms ease;
    }

    nav.navigation.navigation--student .navigation-items--main > li:nth-child(1) > a { --portal-nav-icon-color: color-mix(in srgb, ${accent}, #9db8ff 55%); }
    nav.navigation.navigation--student .navigation-items--main > li:nth-child(2) > a { --portal-nav-icon-color: color-mix(in srgb, ${accent}, #8bc9ff 55%); }
    nav.navigation.navigation--student .navigation-items--main > li:nth-child(3) > a { --portal-nav-icon-color: color-mix(in srgb, ${accent}, #a7b5ff 55%); }
    nav.navigation.navigation--student .navigation-items--main > li:nth-child(4) > a { --portal-nav-icon-color: color-mix(in srgb, ${accent}, #83b9ff 55%); }
    nav.navigation.navigation--student .navigation-items--main > li:nth-child(5) > a { --portal-nav-icon-color: color-mix(in srgb, ${accent}, #9aabff 55%); }
    nav.navigation.navigation--student .navigation-items--main > li:nth-child(6) > a { --portal-nav-icon-color: color-mix(in srgb, ${accent}, #b7a4ff 55%); }
    nav.navigation.navigation--student .navigation-items--main > li:nth-child(7) > a { --portal-nav-icon-color: color-mix(in srgb, ${accent}, #83c8ff 55%); }

    nav.navigation.navigation--student .navigation-items--main > li > a:hover {
      transform: translateX(2px);
      border-color: color-mix(in srgb, ${accent} 24%, transparent) !important;
      background: color-mix(in srgb, ${accent} 16%, transparent) !important;
      color: #fff !important;
    }

    nav.navigation.navigation--student .navigation-items--main > li:is(.is-selected, .is-active, .active) > a,
    nav.navigation.navigation--student .navigation-items--main > li > a[aria-current="page"] {
      border: 1px solid color-mix(in srgb, ${accent} 55%, ${text} 45%) !important;
      background: linear-gradient(105deg,
        color-mix(in srgb, ${accent} 76%, #1756d9 24%),
        color-mix(in srgb, ${accent} 82%, #536cff 18%)) !important;
      box-shadow: 0 7px 22px color-mix(in srgb, ${accent} 34%, transparent), inset 0 1px rgba(255,255,255,.22) !important;
      color: #fff !important;
    }

    nav.navigation.navigation--student .navigation-items--main > li:is(.is-selected, .is-active, .active) > a .icon,
    nav.navigation.navigation--student .navigation-items--main > li > a[aria-current="page"] .icon,
    nav.navigation.navigation--student .navigation-items--main > li:is(.is-selected, .is-active, .active) > a > svg,
    nav.navigation.navigation--student .navigation-items--main > li > a[aria-current="page"] > svg,
    nav.navigation.navigation--student .navigation-items--main > li:is(.is-selected, .is-active, .active) > a > i,
    nav.navigation.navigation--student .navigation-items--main > li > a[aria-current="page"] > i {
      transform: scale(1.06);
      color: #fff !important;
      filter: drop-shadow(0 1px 7px rgba(255,255,255,.3));
    }

    nav.navigation.navigation--student > :is(.navigation-header, .navigation-brand, .logo),
    nav.navigation.navigation--student .navigation-header,
    nav.navigation.navigation--student .navigation-brand {
      border-bottom: 1px solid color-mix(in srgb, ${border} 75%, transparent) !important;
    }

    nav.navigation.navigation--student .navigation-header img,
    nav.navigation.navigation--student .navigation-brand img,
    nav.navigation.navigation--student .navigation-header svg,
    nav.navigation.navigation--student .navigation-brand svg {
      filter: drop-shadow(0 0 8px color-mix(in srgb, ${accent} 42%, transparent));
    }

    .card,
    .container-card,
    .container-studiewijzer,
    .agenda-filter,
    .agenda--day,
    .agenda--day li,
    .result-overview,
    .panel,
    .box {
      border-color: color-mix(in srgb, ${border} 78%, ${text} 22%) !important;
      background: linear-gradient(145deg,
        color-mix(in srgb, ${surface} 96%, ${accent} 4%),
        color-mix(in srgb, ${surface} 99%, ${text} 1%)) !important;
      box-shadow: 0 12px 32px rgba(2,7,28,.16), inset 0 1px rgba(255,255,255,.035) !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
    }

    `;
  }

  function buildPortalGlowCSS() {
    return `
    html {
      min-height: 100%;
      background-color: #080d22 !important;
      background-image:
        radial-gradient(ellipse 42% 42% at 100% 0%, rgba(43,111,255,.92) 0%, rgba(37,76,227,.66) 46%, transparent 100%),
        radial-gradient(ellipse 44% 42% at 0% 100%, rgba(31,83,225,.9) 0%, rgba(31,64,174,.58) 52%, transparent 100%),
        radial-gradient(ellipse 34% 30% at 102% 100%, rgba(111,75,255,.58), transparent 100%),
        linear-gradient(135deg, #101a44 0%, #080d22 48%, #111944 100%) !important;
      background-attachment: fixed !important;
      background-size: cover !important;
    }

    body, .l-container, .l-flex-content, .content-wrapper, .content, main, .main-content {
      background-color: transparent !important;
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

    if (s.portalLayout !== false) {
      css += buildPortalLayoutCSS({
        accent: effectiveAccent,
        bg: effectiveBg,
        surface: effectiveSurface,
        text: effectiveText,
        border: effectiveBorder,
      });
    }

    if (presetKey === "portal" && !useCustom && !hasWallpaper) {
      css += buildPortalGlowCSS();
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
        "eduarteCustomTheme",
        "eduarteCustomColors",
        "eduarteModernNav",
        "eduarteAnimations",
        "eduarteFloatingCards",
        "eduartePortalLayoutEnabled",
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
          customEnabled: !!data.eduarteCustomTheme,
          custom: data.eduarteCustomColors || null,
          portalLayout: data.eduartePortalLayoutEnabled !== false,
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
      changes.eduarteCustomTheme ||
      changes.eduarteCustomColors ||
      changes.eduarteModernNav ||
      changes.eduarteAnimations ||
      changes.eduarteFloatingCards
      || changes.eduartePortalLayoutEnabled
    ) {
      loadAndApply();
    }
  });
})();
