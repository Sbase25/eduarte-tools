// Eduarte Tools - theme.js
// Modern theming & styling engine for Eduarte and Educus portals.

(function () {
  const STYLE_ID = "eduarte-tools-theme-style";

  const PRESETS = {
    aurora: {
      dark: true,
      accent: "#a78bfa",
      bg: "#0b0716",
      surface: "#1a1430",
      text: "#f5f3ff",
      border: "#3b2f5c",
    },
    graphite: {
      dark: true,
      accent: "#ff7a59",
      bg: "#0c0e13",
      surface: "#14171f",
      text: "#eceef3",
      border: "#252a37",
    },
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

    body:has(.agenda) header.header:not(:has(> .header-tabs)) {
      height: 56px !important;
      min-height: 56px !important;
    }

    body:has(.agenda) header.header:not(:has(> .header-tabs)) > .header-toolbar {
      min-height: 56px !important;
      padding-block: 4px !important;
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

    body:has(.agenda) header.header:not(:has(> .header-tabs)) {
      display: block !important;
      height: auto !important;
      min-height: 0 !important;
      margin-right: 12px !important;
      overflow: visible !important;
    }

    body:has(.agenda) header.header:not(:has(> .header-tabs)) > .header-toolbar {
      display: flex !important;
      width: 100% !important;
      box-sizing: border-box !important;
      align-items: center !important;
      min-height: 68px !important;
      padding: 8px 10px 8px 20px !important;
      gap: 8px !important;
    }

    body:has(.agenda) header.header .header-toolbar > h1 {
      flex: 1 1 auto !important;
      min-width: 0 !important;
      margin: 0 !important;
      font-size: clamp(18px, 1.5vw, 26px) !important;
      font-weight: 700 !important;
    }

    body:has(.agenda) #eduarte-tools-portal-actions {
      flex: 0 0 auto !important;
      gap: 6px !important;
      margin-left: auto !important;
      margin-right: 2px !important;
      padding: 0 2px !important;
    }

    body:has(.agenda) #eduarte-tools-portal-actions .et-portal-action {
      width: 40px !important;
      height: 40px !important;
    }

    body:has(.agenda) .content-wrapper {
      min-width: 0 !important;
      box-sizing: border-box !important;
      padding-right: 12px !important;
      background: ${bg} !important;
    }

    body:has(.agenda) .agenda-filter {
      position: fixed !important;
      top: 92px !important;
      right: 16px !important;
      left: 0 !important;
      z-index: 200 !important;
      width: auto !important;
    }

    @media (min-width: 960px) {
      body:has(.agenda) .agenda-filter {
        left: calc(var(--navigation-width, 16rem) + 16px) !important;
      }
    }

    body:has(.agenda) .agenda-filter {
      display: flex !important;
      box-sizing: border-box !important;
      height: 70px !important;
      min-height: 70px !important;
      margin: 0 !important;
      padding: 8px 14px !important;
      overflow-x: auto !important;
      border: 1px solid color-mix(in srgb, ${border} 72%, ${text} 28%) !important;
      border-radius: 20px !important;
      background: color-mix(in srgb, ${surface} 94%, transparent) !important;
      box-shadow: 0 8px 24px rgba(0,0,0,.25) !important;
      backdrop-filter: blur(18px) saturate(140%) !important;
      -webkit-backdrop-filter: blur(18px) saturate(140%) !important;
    }

    body:has(.agenda) .s5-filterbar-toggle {
      top: 119px !important;
      left: -44px !important;
      border-radius: 12px 0 0 12px !important;
      box-shadow: 0 5px 16px rgba(2,7,28,.24) !important;
    }

    body:has(.agenda) .s5-filterbar-toggle a {
      display: grid !important;
      width: 44px !important;
      height: 46px !important;
      place-items: center !important;
    }

    body:has(.agenda) .s5-filterbar-toggle svg {
      width: 20px !important;
      height: 20px !important;
    }

    body:has(.agenda) .agenda-filter .filter--inner {
      display: flex !important;
      flex: 1 1 auto !important;
      align-items: center !important;
      gap: 14px !important;
      min-width: 0 !important;
    }

    body:has(.agenda) .agenda-filter .btn,
    body:has(.agenda) .agenda-filter div.datepicker,
    body:has(.agenda) .agenda-filter .popover-tabs ul {
      border: 1px solid color-mix(in srgb, ${border} 72%, ${text} 28%) !important;
      border-radius: 999px !important;
      background: color-mix(in srgb, ${surface} 77%, ${accent} 23%) !important;
      box-shadow: inset 0 1px rgba(255,255,255,.07) !important;
    }

    body:has(.agenda) .agenda-filter .btn {
      display: grid !important;
      width: 46px !important;
      height: 46px !important;
      flex: 0 0 46px !important;
      place-items: center !important;
      padding: 0 !important;
      color: ${text} !important;
    }

    body:has(.agenda) .agenda-filter div.datepicker {
      flex: 0 0 190px !important;
      width: 190px !important;
      min-width: 190px !important;
      margin: 0 !important;
      padding: 0 12px !important;
    }

    body:has(.agenda) .agenda-filter div.datepicker .input-group {
      position: relative !important;
    }

    body:has(.agenda) .agenda-filter div.datepicker input {
      box-sizing: border-box !important;
      width: 100% !important;
      min-width: 0 !important;
      min-height: 44px !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      color: ${text} !important;
      padding: 0 12px 0 42px !important;
      text-align: left !important;
    }

    body:has(.agenda) .agenda-filter div.datepicker .input-group > svg.svg-sprites.datepicker {
      position: absolute !important;
      top: 50% !important;
      right: auto !important;
      left: 14px !important;
      width: 22px !important;
      height: 22px !important;
      min-width: 22px !important;
      border: 0 !important;
      background: transparent !important;
      color: ${text} !important;
      transform: translateY(-50%) !important;
    }

    body:has(.agenda) .agenda-filter .popover-tabs ul {
      display: flex !important;
      width: 330px !important;
      box-sizing: border-box !important;
      align-items: center !important;
      gap: 4px !important;
      padding: 4px !important;
    }

    body:has(.agenda) .agenda-filter .popover-tabs li {
      flex: 1 1 0 !important;
      min-width: 0 !important;
      border-radius: 999px !important;
      color: ${text} !important;
    }

    body:has(.agenda) .agenda-filter .popover-tabs li a {
      display: flex !important;
      min-height: 38px !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 14px !important;
      border-radius: inherit !important;
      color: inherit !important;
    }

    body:has(.agenda) .agenda-filter .popover-tabs li.is-selected {
      background: ${accent} !important;
      color: #fff !important;
      box-shadow: none !important;
    }

    body:has(.agenda) .agenda-filter .popover-tabs li.is-selected a {
      color: #fff !important;
    }

    body:has(.agenda) .agenda-filter .filter-checkbox {
      color: ${text} !important;
      font-size: 13px !important;
      font-weight: 600 !important;
    }

    body:has(.agenda) .agenda-filter .filter-checkbox input {
      accent-color: ${accent} !important;
    }

    body:has(.agenda) .content:has(> .agenda-filter) {
      padding-top: 106px !important;
    }

    body:has(.agenda) .agenda {
      display: flex !important;
      align-items: stretch !important;
      box-sizing: border-box !important;
      width: calc(100% - 16px) !important;
      min-width: 0 !important;
      margin: 0 16px 16px 0 !important;
      overflow: hidden !important;
      border: 1px solid color-mix(in srgb, ${border} 72%, ${text} 28%) !important;
      border-radius: 26px !important;
      background: ${surface} !important;
      box-shadow: 0 1px 2px rgba(0,0,0,.2) !important;
      backdrop-filter: blur(16px) saturate(135%) !important;
      -webkit-backdrop-filter: blur(16px) saturate(135%) !important;
    }

    body:has(.agenda) .agenda--schedule {
      display: none !important;
    }

    body:has(.agenda) .agenda--time {
      flex: 0 0 58px !important;
      width: 58px !important;
      padding-top: 44px !important;
      border-right: 1px solid color-mix(in srgb, ${border} 60%, transparent) !important;
      background: transparent !important;
      text-align: center !important;
    }

    body:has(.agenda) .agenda--time h4 {
      display: none !important;
    }

    body:has(.agenda) .agenda--time ul {
      margin: 0 !important;
      padding: 0 !important;
    }

    body:has(.agenda) .agenda--time li {
      display: flex !important;
      height: 108px !important;
      justify-content: center !important;
      border: 0 !important;
      background: transparent !important;
      line-height: 1 !important;
    }

    body:has(.agenda) .agenda--time li span {
      width: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      color: color-mix(in srgb, ${text} 62%, transparent) !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      font-variant-numeric: tabular-nums !important;
      align-self: flex-start !important;
      height: auto !important;
      line-height: 1 !important;
      transform: translateY(-6px) !important;
    }

    body:has(.agenda) .agenda--days {
      flex: 1 1 0 !important;
      min-width: 0 !important;
      padding-top: 0 !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
      background: transparent !important;
      scrollbar-color: color-mix(in srgb, ${accent} 62%, ${border}) transparent !important;
    }

    body:has(.agenda) .agenda--day {
      flex: 1 0 168px !important;
      min-width: 168px !important;
      border-right: 1px solid color-mix(in srgb, ${border} 76%, transparent) !important;
      background: transparent !important;
    }

    body:has(.agenda) .agenda--day .lead {
      /* Datumkop in de normale flow: Eduarte's scroll-script zet top via JS en
         liet de datums onder de filterbalk of buiten beeld verdwijnen. */
      position: static !important;
      top: auto !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
      width: auto !important;
      min-width: 0 !important;
      height: 44px !important;
      margin: 0 !important;
      padding: 0 8px !important;
      border: 0 !important;
      border-bottom: 1px solid color-mix(in srgb, ${border} 60%, transparent) !important;
      border-radius: 0 !important;
      background: ${surface} !important;
      color: color-mix(in srgb, ${text} 80%, transparent) !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      line-height: 1.2 !important;
      white-space: nowrap !important;
      text-transform: capitalize !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    /* Lege dagen (meestal het weekend) smaller maken zodat lesdagen meer ruimte krijgen */
    body:has(.agenda) .agenda--day:not(:has(li.agenda--course, li.agenda--appointment, li.agenda--bpv)) {
      flex: 0 0 72px !important;
      min-width: 72px !important;
    }

    body:has(.agenda) .agenda--day:not(:has(li.agenda--course, li.agenda--appointment, li.agenda--bpv)) .lead {
      opacity: .55 !important;
      font-size: 12px !important;
      white-space: normal !important;
      text-align: center !important;
    }

    body:has(.agenda) .agenda--day.is-today .lead {
      background: color-mix(in srgb, ${accent} 14%, ${surface}) !important;
      color: ${text} !important;
      box-shadow: inset 0 -2px ${accent} !important;
    }

    body:has(.agenda) .agenda--day ul:not(.dropdown--list) {
      border-right: 1px solid color-mix(in srgb, ${border} 76%, transparent) !important;
      background: repeating-linear-gradient(
        to bottom,
        transparent 0,
        transparent 106px,
        color-mix(in srgb, ${border} 58%, transparent) 107px,
        color-mix(in srgb, ${border} 58%, transparent) 108px
      ) !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course,
    body:has(.agenda) .agenda--day li.agenda--appointment,
    body:has(.agenda) .agenda--day li.agenda--bpv {
      border: 0 !important;
      border-radius: 16px !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course > div {
      box-sizing: border-box !important;
      height: calc(100% - 3px) !important;
      margin: 1px 3px 0 !important;
      padding: 7px 9px !important;
      overflow: hidden !important;
      border: 1px solid color-mix(in srgb, var(--et-course, ${accent}) 30%, transparent) !important;
      border-left: 3px solid var(--et-course, ${accent}) !important;
      border-radius: 10px !important;
      background: color-mix(in srgb, var(--et-course, ${accent}) 18%, ${surface}) !important;
      color: ${text} !important;
      box-shadow: 0 2px 6px rgba(3,8,35,.18) !important;
      transition: background-color 150ms ease !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course:hover > div {
      background: color-mix(in srgb, var(--et-course, ${accent}) 28%, ${surface}) !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course .is-subject {
      overflow: hidden !important;
      font-weight: 700 !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course .is-location,
    body:has(.agenda) .agenda--day li.agenda--course .is-participant {
      display: block !important;
      overflow: hidden !important;
      opacity: .78 !important;
      font-size: 12px !important;
      white-space: nowrap !important;
      text-overflow: ellipsis !important;
    }

    /* agenda.js zet de les in twee regels: "VAK  08:45 – 10:15" en "lokaal · docent" */
    body:has(.agenda) .agenda--day li.agenda--course > div:has(.et-lesson-head) {
      display: flex !important;
      flex-direction: column !important;
      gap: 1px !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course:has(.et-lesson-meta) :is(.is-location, .is-participant) {
      display: none !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course span.et-lesson-head {
      display: flex !important;
      align-items: baseline !important;
      gap: 6px !important;
      min-width: 0 !important;
      overflow: hidden !important;
      white-space: nowrap !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course span.et-lesson-head > span {
      flex: none !important;
      white-space: nowrap !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course span.et-lesson-head > span.et-agenda-time {
      flex: 0 1 auto !important;
      overflow: hidden !important;
      font-size: 11.5px !important;
      font-weight: 500 !important;
      opacity: .7 !important;
      text-overflow: ellipsis !important;
      font-variant-numeric: tabular-nums !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course span.et-lesson-meta {
      display: block !important;
      overflow: hidden !important;
      font-size: 12px !important;
      opacity: .75 !important;
      white-space: nowrap !important;
      text-overflow: ellipsis !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course.et-short-lesson span.et-lesson-meta {
      display: none !important;
    }

    /* Aanwezigheidsicoon klein rechtsboven in plaats van over de tekst */
    body:has(.agenda) .agenda--day li.agenda--course p.agenda-icons {
      position: absolute !important;
      top: 6px !important;
      right: 8px !important;
      bottom: auto !important;
      left: auto !important;
      width: auto !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 0 !important;
      opacity: .75 !important;
      pointer-events: none !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course p.agenda-icons svg {
      width: 13px !important;
      height: 13px !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course:has(p.agenda-icons) span.et-lesson-head {
      padding-right: 16px !important;
    }

    html.et-compact-agenda body:has(.agenda) .agenda {
      padding-top: 0 !important;
    }

    /* Overzicht: voorbije lessen vager, de les van nu met een rand */
    body:has(.agenda) .agenda--day li.et-past {
      opacity: .45 !important;
      filter: saturate(.6) !important;
    }

    body:has(.agenda) .agenda--day li.et-past:hover {
      opacity: .85 !important;
    }

    body:has(.agenda) .agenda--day li.et-now > div {
      box-shadow: 0 0 0 2px var(--et-course, ${accent}), 0 8px 24px -8px var(--et-course, ${accent}) !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course > div {
      background: color-mix(in srgb, var(--et-course, ${accent}) 13%, ${surface}) !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course .is-subject {
      color: color-mix(in srgb, var(--et-course, ${accent}) 55%, ${text}) !important;
    }

    /* Dagkop: kleine weekdag, groot datumnummer; vandaag in een gekleurd rondje */
    body:has(.agenda) .agenda--day > .lead[data-et-day] {
      gap: 6px !important;
      text-transform: none !important;
    }

    body:has(.agenda) .agenda--day > .lead .et-dow {
      color: color-mix(in srgb, ${text} 55%, transparent) !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      letter-spacing: .08em !important;
      text-transform: uppercase !important;
    }

    body:has(.agenda) .agenda--day > .lead .et-dnum {
      display: inline-grid !important;
      place-items: center !important;
      min-width: 28px !important;
      height: 28px !important;
      border-radius: 99px !important;
      color: ${text} !important;
      font-size: 17px !important;
      font-weight: 800 !important;
    }

    body:has(.agenda) .agenda--day > .lead .et-dmon {
      color: color-mix(in srgb, ${text} 55%, transparent) !important;
      font-size: 12px !important;
      font-weight: 600 !important;
    }

    body:has(.agenda) .agenda--day.is-today > .lead .et-dnum {
      background: ${accent} !important;
      color: #fff !important;
    }

    body:has(.agenda) .agenda--day.is-today > .lead {
      background: ${surface} !important;
      box-shadow: inset 0 -2px ${accent} !important;
    }

    /* Ook een fijne lijn per half uur */
    html.et-compact-agenda body:has(.agenda) .agenda--day ul:not(.dropdown--list) {
      background:
        repeating-linear-gradient(to bottom,
          transparent 0, transparent 63px,
          color-mix(in srgb, ${border} 60%, transparent) 63px, color-mix(in srgb, ${border} 60%, transparent) 64px),
        repeating-linear-gradient(to bottom,
          transparent 0, transparent 31px,
          color-mix(in srgb, ${border} 25%, transparent) 31px, color-mix(in srgb, ${border} 25%, transparent) 32px, transparent 32px, transparent 64px) !important;
    }

    body:has(.agenda) .agenda--day {
      border-top: 0 !important;
    }

    body:has(.agenda) .agenda--day li.agenda--course span,
    body:has(.agenda) .agenda--day li.agenda--course p,
    body:has(.agenda) .agenda--day li.agenda--bpv span,
    body:has(.agenda) .agenda--day li.agenda--bpv p {
      font-size: 13px !important;
      color: ${text} !important;
      white-space: normal !important;
      overflow-wrap: break-word !important;
      word-break: normal !important;
      text-overflow: clip !important;
      line-height: 1.35 !important;
    }

    body:has(.agenda) .agenda--day li.agenda--appointment > div {
      box-sizing: border-box !important;
      padding: 10px 12px !important;
      border: 1px solid rgba(151,231,247,.7) !important;
      border-left: 4px solid #8ce8fb !important;
      border-radius: 16px !important;
      background: linear-gradient(145deg, #a5e8f4, #69c9e8) !important;
      color: #112b4d !important;
      box-shadow: inset 0 1px rgba(255,255,255,.45), 0 5px 16px rgba(3,8,35,.18) !important;
    }

    body:has(.agenda) .agenda--day li.agenda--appointment span,
    body:has(.agenda) .agenda--day li.agenda--appointment p {
      color: #112b4d !important;
    }

    body:has(.agenda) .agenda--present-time {
      margin-inline: 8px !important;
      border-color: ${accent} !important;
      box-shadow: none !important;
    }

    /* Compacte agenda (agenda.js schaalt de lesblokken naar 64px per uur) */
    html.et-compact-agenda body:has(.agenda) .agenda--time li {
      height: 64px !important;
    }

    html.et-compact-agenda body:has(.agenda) .agenda--day li.agenda--course > div {
      padding: 5px 8px !important;
    }

    body:has(.agenda) .agenda--day.is-today {
      background: color-mix(in srgb, ${accent} 4%, transparent) !important;
    }

    /* ---- Agenda: fijnafstelling ---- */
    /* Eén rustig rooster: geen eigen kaartje met ronde hoeken per dag, één scheidingslijn */
    body:has(.agenda) .agenda--day,
    body:has(.agenda) .agenda--day ul:not(.dropdown--list) {
      border-radius: 0 !important;
      box-shadow: none !important;
    }
    body:has(.agenda) .agenda--day {
      border: 0 !important;
    }
    body:has(.agenda) .agenda--day ul:not(.dropdown--list) {
      border: 0 !important;
      border-left: 1px solid color-mix(in srgb, ${border} 70%, transparent) !important;
    }
    body:has(.agenda) .agenda--day:first-child ul:not(.dropdown--list) {
      border-left: 0 !important;
    }
    body:has(.agenda) .agenda--day .lead {
      border-radius: 0 !important;
      background: transparent !important;
    }
    body:has(.agenda) .agenda--day.is-today > .lead {
      background: transparent !important;
      box-shadow: none !important;
    }
    body:has(.agenda) .agenda {
      border-radius: 28px !important;
    }
    /* Lesblokken: tonaal vlak met een kleurbalk, zonder gekleurde omlijning */
    body:has(.agenda) .agenda--day li.agenda--course > div {
      margin: 1px 4px 0 !important;
      padding: 8px 10px 8px 12px !important;
      border: 0 !important;
      border-left: 4px solid var(--et-course, ${accent}) !important;
      border-radius: 6px 14px 14px 6px !important;
      background: color-mix(in srgb, var(--et-course, ${accent}) 20%, ${surface}) !important;
      box-shadow: none !important;
      transition: background-color 150ms ease, border-radius 200ms ease !important;
    }
    body:has(.agenda) .agenda--day li.agenda--course:hover > div {
      border-radius: 6px 20px 20px 6px !important;
      background: color-mix(in srgb, var(--et-course, ${accent}) 30%, ${surface}) !important;
    }
    body:has(.agenda) .agenda--day li.agenda--course .is-subject {
      color: color-mix(in srgb, var(--et-course, ${accent}) 62%, ${text}) !important;
      font-size: 13.5px !important;
      letter-spacing: .01em !important;
    }
    html.et-compact-agenda body:has(.agenda) .agenda--day li.agenda--course > div {
      padding: 6px 10px 6px 11px !important;
    }
    body:has(.agenda) .agenda--day li.et-now > div {
      box-shadow: 0 0 0 2px var(--et-course, ${accent}) !important;
    }
    /* "Nu"-lijn: eigen element van agenda.js in de kolom van vandaag, met een bolletje */
    body:has(.agenda) .agenda--present-time {
      display: none !important;
    }
    body:has(.agenda) .agenda--day ul:not(.dropdown--list) > li.et-now-line {
      position: absolute !important;
      right: 0 !important;
      left: 0 !important;
      z-index: 20 !important;
      width: auto !important;
      height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      border: 0 !important;
      border-top: 2px solid ${accent} !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      transform: translateY(-1px) !important;
      pointer-events: none !important;
    }
    body:has(.agenda) .agenda--day ul:not(.dropdown--list) > li.et-now-line::before {
      content: "" !important;
      position: absolute !important;
      top: -6px !important;
      left: -5px !important;
      width: 10px !important;
      height: 10px !important;
      border-radius: 50% !important;
      background: ${accent} !important;
    }
    body:has(.agenda) .agenda-filter {
      scrollbar-width: none !important;
    }
    body:has(.agenda) .agenda-filter::-webkit-scrollbar {
      display: none !important;
    }
    /* Filterbalk: zelfde pilvormen als de rest, en ruimte rechts voor de filterknop */
    body:has(.agenda) .agenda-filter {
      right: 64px !important;
      height: 64px !important;
      min-height: 64px !important;
      padding: 8px 10px !important;
      border-radius: 32px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,.18) !important;
    }
    @media (min-width: 960px) {
      body:has(.agenda) .agenda-filter {
        left: calc(var(--navigation-width, 16rem) + 11px) !important;
      }
    }
    body:has(.agenda) .agenda-filter .filter--inner {
      gap: 10px !important;
    }
    body:has(.agenda) .agenda-filter .btn,
    body:has(.agenda) .agenda-filter div.datepicker,
    body:has(.agenda) .agenda-filter .popover-tabs ul {
      border: 0 !important;
      background: color-mix(in srgb, ${text} 8%, ${surface}) !important;
      box-shadow: none !important;
    }
    body:has(.agenda) .agenda-filter .btn {
      transition: background-color 150ms ease, border-radius 200ms ease !important;
    }
    body:has(.agenda) .agenda-filter .btn:hover {
      background: color-mix(in srgb, ${accent} 22%, ${surface}) !important;
    }
    body:has(.agenda) .agenda-filter .btn:active {
      border-radius: 14px !important;
    }
    body:has(.agenda) .agenda-filter div.datepicker {
      flex-basis: 168px !important;
      width: 168px !important;
      min-width: 168px !important;
      padding: 0 6px !important;
    }
    body:has(.agenda) .agenda-filter div.datepicker input {
      font-weight: 600 !important;
      letter-spacing: 0 !important;
    }
    body:has(.agenda) .agenda-filter .popover-tabs ul {
      width: 300px !important;
    }
    body:has(.agenda) .agenda-filter .popover-tabs li {
      font-weight: 600 !important;
      transition: background-color 150ms ease !important;
    }
    body:has(.agenda) .agenda-filter .popover-tabs li:not(.is-selected):hover {
      background: color-mix(in srgb, ${text} 8%, transparent) !important;
    }
    body:has(.agenda) .agenda-filter .filter-checkbox {
      display: inline-flex !important;
      align-items: center !important;
      gap: 8px !important;
      height: 46px !important;
      padding: 0 16px 0 14px !important;
      border-radius: 999px !important;
      background: color-mix(in srgb, ${text} 8%, ${surface}) !important;
      white-space: nowrap !important;
    }
    body:has(.agenda) .agenda-filter .filter-checkbox :is(input, label) {
      margin: 0 !important;
      cursor: pointer !important;
    }
    body:has(.agenda) .agenda-filter .et-cal-actions button {
      height: 46px !important;
      padding: 0 18px !important;
      border-radius: 999px !important;
      transition: border-radius 200ms ease, filter 150ms ease !important;
    }
    body:has(.agenda) .agenda-filter .et-cal-actions button:not(.is-primary) {
      border-color: transparent !important;
      background: color-mix(in srgb, ${text} 8%, ${surface}) !important;
    }
    body:has(.agenda) .agenda-filter .et-cal-actions button:hover {
      filter: brightness(1.1) !important;
    }
    body:has(.agenda) .agenda-filter .et-cal-actions button:active {
      border-radius: 14px !important;
    }
    body:has(.agenda) .content:has(> .agenda-filter) {
      padding-top: 100px !important;
    }
    body:has(.agenda) .s5-filterbar-toggle {
      top: 101px !important;
      left: -52px !important;
      overflow: hidden !important;
      border: 0 !important;
      border-radius: 23px !important;
      box-shadow: none !important;
    }
    body:has(.agenda) .s5-filterbar-toggle a {
      width: 46px !important;
    }

    /* ---- Agenda: dagkaarten ---- */
    /* Elke dag is een eigen kaart; het rooster zelf heeft geen omlijsting meer */
    body:has(.agenda) .agenda {
      overflow: visible !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    body:has(.agenda) .agenda--time {
      flex-basis: 52px !important;
      width: 52px !important;
      padding-top: 64px !important;
      border: 0 !important;
    }
    body:has(.agenda) .agenda--time li span {
      color: color-mix(in srgb, ${text} 50%, transparent) !important;
      font-size: 11.5px !important;
    }
    body:has(.agenda) .agenda--days {
      gap: 10px !important;
      padding: 0 2px 4px 0 !important;
    }
    body:has(.agenda) .agenda--day {
      overflow: hidden !important;
      border: 1px solid color-mix(in srgb, ${border} 70%, transparent) !important;
      border-radius: 26px !important;
      background: ${surface} !important;
      box-shadow: 0 1px 2px rgba(0,0,0,.14) !important;
    }
    body:has(.agenda) .agenda--day ul:not(.dropdown--list),
    body:has(.agenda) .agenda--day:first-child ul:not(.dropdown--list) {
      margin: 0 6px 8px !important;
      border: 0 !important;
    }
    html.et-compact-agenda body:has(.agenda) .agenda--day ul:not(.dropdown--list) {
      background: repeating-linear-gradient(to bottom,
        transparent 0, transparent 63px,
        color-mix(in srgb, ${border} 45%, transparent) 63px, color-mix(in srgb, ${border} 45%, transparent) 64px) !important;
    }
    /* Dagkop: weekdag klein, datum groot */
    body:has(.agenda) .agenda--day > .lead,
    body:has(.agenda) .agenda--day > .lead[data-et-day] {
      height: 64px !important;
      flex-direction: column !important;
      gap: 1px !important;
      border: 0 !important;
    }
    body:has(.agenda) .agenda--day > .lead .et-dnum {
      min-width: 34px !important;
      height: 30px !important;
      font-size: 20px !important;
      letter-spacing: -.02em !important;
    }
    body:has(.agenda) .agenda--day > .lead .et-dmon {
      display: none !important;
    }
    body:has(.agenda) .agenda--day.is-today {
      border-color: color-mix(in srgb, ${accent} 55%, transparent) !important;
      background: color-mix(in srgb, ${accent} 7%, ${surface}) !important;
    }
    body:has(.agenda) .agenda--day.is-today > .lead .et-dow {
      color: ${accent} !important;
    }
    body:has(.agenda) .agenda--day.is-today > .lead .et-dnum {
      padding: 0 10px !important;
      border-radius: 12px !important;
    }
    /* Lesblokken: vol tonaal vlak in de vakkleur, rondom afgerond */
    body:has(.agenda) .agenda--day li.agenda--course > div {
      margin: 1px 0 0 !important;
      padding: 8px 12px !important;
      border: 0 !important;
      border-radius: 16px !important;
      background: color-mix(in srgb, var(--et-course, ${accent}) 30%, ${surface}) !important;
    }
    body:has(.agenda) .agenda--day li.agenda--course:hover > div {
      border-radius: 22px !important;
      background: color-mix(in srgb, var(--et-course, ${accent}) 42%, ${surface}) !important;
    }
    html.et-compact-agenda body:has(.agenda) .agenda--day li.agenda--course > div {
      padding: 6px 12px !important;
    }
    body:has(.agenda) .agenda--day li.agenda--course.et-short-lesson > div {
      border-radius: 12px !important;
    }
    body:has(.agenda) .agenda--day li.agenda--course .is-subject {
      color: color-mix(in srgb, var(--et-course, ${accent}) 45%, ${text}) !important;
      font-size: 14px !important;
      font-weight: 800 !important;
    }
    body:has(.agenda) .agenda--day li.et-past {
      opacity: .5 !important;
    }
    body:has(.agenda) .agenda--day ul:not(.dropdown--list) > li.et-now-line::before {
      left: -2px !important;
    }

    /* ---- Agenda: knoppenbalk zonder omlijsting ---- */
    /* Geen zwevende pil meer waar knoppen overheen of buiten konden vallen: een egale strook
       over de volle breedte, met de knoppen als losse groepjes. */
    body:has(.agenda) .agenda-filter {
      top: 69px !important;
      right: 0 !important;
      height: 72px !important;
      min-height: 72px !important;
      padding: 14px 72px 14px 12px !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: ${bg} !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    @media (min-width: 960px) {
      body:has(.agenda) .agenda-filter {
        left: calc(var(--navigation-width, 16rem) + 10px) !important;
      }
    }
    body:has(.agenda) .agenda-filter .filter--inner {
      gap: 12px !important;
      height: 44px !important;
    }
    body:has(.agenda) .agenda-filter .filter--inner > * {
      flex-shrink: 0 !important;
    }
    body:has(.agenda) .agenda-filter .btn,
    body:has(.agenda) .agenda-filter div.datepicker,
    body:has(.agenda) .agenda-filter .popover-tabs ul,
    body:has(.agenda) .agenda-filter .filter-checkbox {
      height: 44px !important;
      min-height: 44px !important;
      box-sizing: border-box !important;
      background: color-mix(in srgb, ${text} 9%, ${bg}) !important;
    }
    /* Vorige/volgende als één verbonden knop */
    body:has(.agenda) .agenda-filter .btn {
      width: 44px !important;
      flex: 0 0 44px !important;
    }
    body:has(.agenda) .agenda-filter .btn:has(+ .btn) {
      margin-right: -10px !important;
      border-radius: 22px 8px 8px 22px !important;
    }
    body:has(.agenda) .agenda-filter .btn + .btn {
      border-radius: 8px 22px 22px 8px !important;
    }
    body:has(.agenda) .agenda-filter .btn:hover {
      background: color-mix(in srgb, ${accent} 24%, ${bg}) !important;
    }
    body:has(.agenda) .agenda-filter .btn:active {
      border-radius: 14px !important;
    }
    body:has(.agenda) .agenda-filter div.datepicker {
      flex: 0 0 156px !important;
      width: 156px !important;
      min-width: 156px !important;
      padding: 0 4px !important;
    }
    body:has(.agenda) .agenda-filter div.datepicker input {
      min-height: 40px !important;
      height: 40px !important;
    }
    body:has(.agenda) .agenda-filter .popover-tabs ul {
      width: auto !important;
      margin: 0 !important;
      padding: 4px !important;
    }
    body:has(.agenda) .agenda-filter .popover-tabs li {
      flex: 0 0 auto !important;
    }
    body:has(.agenda) .agenda-filter .popover-tabs li a {
      min-height: 36px !important;
      padding: 0 18px !important;
    }
    body:has(.agenda) .agenda-filter .filter-checkbox {
      padding: 0 16px 0 14px !important;
    }
    body:has(.agenda) .agenda-filter .et-cal-actions {
      margin-left: auto !important;
      padding-left: 12px !important;
    }
    body:has(.agenda) .agenda-filter .et-cal-actions button {
      height: 44px !important;
      flex-shrink: 0 !important;
    }
    body:has(.agenda) .agenda-filter .et-cal-actions button:not(.is-primary) {
      background: color-mix(in srgb, ${text} 9%, ${bg}) !important;
    }
    /* Smal scherm: .ics en Sync als ronde icoonknoppen, zodat alles blijft passen */
    @media (max-width: 1320px) {
      body:has(.agenda) .agenda-filter .et-cal-actions button {
        width: 44px !important;
        padding: 0 !important;
        justify-content: center !important;
        gap: 0 !important;
        font-size: 0 !important;
      }
      body:has(.agenda) .agenda-filter .et-cal-actions svg {
        width: 18px !important;
        height: 18px !important;
      }
      body:has(.agenda) .agenda-filter .filter--inner {
        gap: 8px !important;
      }
      body:has(.agenda) .agenda-filter .btn:has(+ .btn) {
        margin-right: -6px !important;
      }
    }
    body:has(.agenda) .content:has(> .agenda-filter) {
      padding-top: 82px !important;
    }
    body:has(.agenda) .s5-filterbar-toggle {
      top: 83px !important;
      left: -56px !important;
      border-radius: 22px !important;
    }
    body:has(.agenda) .s5-filterbar-toggle a {
      width: 44px !important;
      height: 44px !important;
    }

    @media (max-width: 700px) {
      body:has(.agenda) header.header:not(:has(> .header-tabs)) > .header-toolbar {
        min-height: 58px !important;
        padding: 6px 6px 6px 12px !important;
      }
      body:has(.agenda) #eduarte-tools-portal-actions { gap: 4px !important; }
      body:has(.agenda) #eduarte-tools-portal-actions .et-portal-action {
        width: 34px !important;
        height: 34px !important;
      }
      body:has(.agenda) .agenda-filter {
        top: 78px !important;
        right: 56px !important;
        left: 0 !important;
        width: auto !important;
        height: 66px !important;
        min-height: 66px !important;
        padding-inline: 8px !important;
      }
      body:has(.agenda) .s5-filterbar-toggle { top: 96px !important; }
      body:has(.agenda) .agenda--time { flex-basis: 62px !important; width: 62px !important; }
      body:has(.agenda) .agenda--day { flex-basis: 148px !important; min-width: 148px !important; }
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

    /* ---- Platte interface: vaste zijbalk, slanke bovenbalk, rustige kaarten ---- */
    /* Pagina minstens schermhoog, anders tekent de browser het zwevende menu in twee tinten */
    html, body {
      min-height: 100vh !important;
    }

    ${buildNavigationCSS({ accent, surface, text, animations: s.animations })}

    header.header,
    .header,
    .header-wrapper,
    .app-header,
    .page-header,
    header.header:has(> .header-tabs) {
      min-height: 60px !important;
      margin: 0 !important;
      border: 0 !important;
      border-bottom: 1px solid color-mix(in srgb, ${border} 70%, transparent) !important;
      border-radius: 0 !important;
      background: color-mix(in srgb, ${bg} 88%, transparent) !important;
      box-shadow: none !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
    }

    @media (min-width: 960px) {
      header.header {
        left: calc(var(--navigation-width) + 10px) !important;
      }
    }

    header.header .header-toolbar > h1 {
      font-size: 20px !important;
      font-weight: 800 !important;
      letter-spacing: -.02em !important;
    }

    header.header:has(> .header-tabs) > .header-toolbar,
    header.header:has(> .header-tabs) > .header-tabs {
      background: transparent !important;
    }

    header.header:has(> .header-tabs) > .header-tabs {
      min-height: 0 !important;
      padding: 0 12px !important;
    }

    header.header:has(> .header-tabs) > .header-tabs > ul {
      justify-content: flex-start !important;
      min-height: 44px !important;
      gap: 4px !important;
    }

    header.header:has(> .header-tabs) > .header-tabs > ul > li {
      flex: 0 0 auto !important;
      max-width: none !important;
    }

    header.header:has(> .header-tabs) > .header-tabs > ul > li > a {
      min-height: 44px !important;
      padding: 0 14px !important;
      border-radius: 0 !important;
      font-size: 13.5px !important;
    }

    header.header:has(> .header-tabs) > .header-tabs > ul > li > a:hover {
      background: transparent !important;
    }

    header.header:has(> .header-tabs) > .header-tabs > ul > li.is-selected > a {
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: inset 0 -2px ${accent} !important;
    }

    body:has(.agenda) header.header:not(:has(> .header-tabs)) {
      margin-right: 0 !important;
    }

    .card,
    .container-card,
    .container-studiewijzer,
    .result-overview,
    .panel,
    .box {
      border: 1px solid color-mix(in srgb, ${border} 70%, transparent) !important;
      border-radius: 14px !important;
      background: ${surface} !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    .result-overview--table {
      border: 1px solid color-mix(in srgb, ${border} 70%, transparent) !important;
      border-radius: 14px !important;
      background: ${surface} !important;
      box-shadow: none !important;
    }

    .result-overview--table > thead > tr > th {
      background: ${surface} !important;
      color: color-mix(in srgb, ${text} 60%, transparent) !important;
      font-size: 12px !important;
      letter-spacing: .04em !important;
      text-transform: uppercase !important;
    }

    .result-overview--table > tbody > tr > td,
    .result-overview--table > tbody > tr:nth-child(even) > td {
      background: ${surface} !important;
    }

    .result-overview--table > tbody > tr:hover > td {
      background: color-mix(in srgb, ${surface} 90%, ${text} 10%) !important;
    }

    `;
  }

  // Geschulpte cirkel ("cookie") uit de Material 3 Expressive-vormen, als clip-path
  function scallopedShape(lobes = 12, depth = 0.055, steps = 120) {
    const points = [];
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const radius = 50 * (1 - depth + depth * Math.cos(lobes * angle));
      points.push(`${(50 + radius * Math.cos(angle)).toFixed(1)}% ${(50 + radius * Math.sin(angle)).toFixed(1)}%`);
    }
    return `polygon(${points.join(", ")})`;
  }

  // Menu links ("het contextmenu") in Material 3 Expressive-stijl: tonale vlakken, pilvormige
  // items, een actieve indicator die erin veert en een vorm die meegeeft als je klikt.
  // Opbouw van Eduarte: nav > .navigation-header, .navigation-items > ul.navigation-items--main,
  // .navigation-footer > ul. De indicator zit in a::before; a::after is van Eduarte (meldingstip).
  function buildNavigationCSS({ accent, surface, text, animations = true }) {
    const NAV = ":root nav.navigation.navigation--student";
    const LIST = ":is(.navigation-items--main, .navigation-footer ul)";
    const ITEM = `${NAV} ${LIST} > li > a`;
    const SELECTED = `${NAV} :is(.navigation-items--main > li:is(.is-selected, .is-active, .active) > a, .navigation-items--main > li > a[aria-current="page"], .navigation-footer ul > li > a:is(.is-selected, [aria-current="page"]), .navigation-footer ul > li.is-selected > a)`;
    const noMotion = `
      ${NAV} a, ${NAV} a::before, ${NAV} a > * {
        animation: none !important;
        transition: none !important;
      }`;

    return `
    /* Menu links als zwevend paneel, in de stijl van een modern contextmenu (Material 3 Expressive) */
    nav.navigation,
    nav.navigation.navigation--student,
    .sidebar {
      --et-nav-container: color-mix(in srgb, ${surface} 96%, ${text} 4%);
      --et-nav-island: color-mix(in srgb, ${surface} 91%, ${text} 9%);
      --et-nav-on: ${text};
      --et-nav-on-variant: color-mix(in srgb, ${text} 72%, transparent);
      --et-nav-active: color-mix(in srgb, ${accent} 26%, ${surface});
      --et-nav-active-icon: color-mix(in srgb, ${accent} 82%, ${text});
      --et-nav-spring: cubic-bezier(.34, 1.45, .64, 1);
      box-sizing: border-box !important;
      height: calc(100vh - 20px) !important;
      margin: 10px 0 10px 10px !important;
      border: 1px solid color-mix(in srgb, ${text} 7%, transparent) !important;
      border-radius: 28px !important;
      background: var(--et-nav-container) !important;
      box-shadow: 0 16px 40px -16px rgba(0,0,0,.5) !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    /* Echte veer (met een klein beetje doorschieten) waar de browser linear() kent */
    @supports (transition-timing-function: linear(0, 1)) {
      nav.navigation,
      nav.navigation.navigation--student,
      .sidebar {
        --et-nav-spring: linear(0, .13 6.2%, .397 12.5%, .671 18.8%, .885 25%, 1.019 31.2%, 1.082 37.5%, 1.094 43.8%, 1.079 50%, 1.052 56.2%, 1.027 62.5%, 1.008 68.8%, .997 75%, .992 81.2%, .993 93.8%, 1);
      }
    }

    ${NAV} .navigation-header {
      align-self: stretch !important;
      width: auto !important;
      min-height: 0 !important;
      gap: 12px !important;
      padding: 18px 14px 10px 18px !important;
      border-bottom: 0 !important;
    }

    ${NAV} .navigation-header a {
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      gap: 12px !important;
      border: 0 !important;
      border-radius: 12px !important;
      background: transparent !important;
      color: var(--et-nav-on) !important;
    }

    /* Logo in een geschulpte Material-vorm; draait een slag bij aanwijzen */
    ${NAV} .navigation-header--logo :is(img, svg) {
      box-sizing: border-box !important;
      width: 44px !important;
      height: 44px !important;
      padding: 9px !important;
      background: var(--et-nav-island) !important;
      clip-path: ${scallopedShape()} !important;
      filter: none !important;
      transition: transform 700ms var(--et-nav-spring) !important;
    }

    ${NAV} .navigation-header--logo:hover :is(img, svg) {
      transform: rotate(60deg) !important;
    }

    /* Sluitknop van het menu op smalle schermen */
    ${NAV} .navigation-header--close-navigation {
      margin-left: auto !important;
    }

    ${NAV} .navigation-header--close-navigation a {
      display: grid !important;
      place-items: center !important;
      width: 40px !important;
      height: 40px !important;
      border-radius: 20px !important;
      background: var(--et-nav-island) !important;
    }

    ${NAV} .navigation-header--title {
      min-width: 0 !important;
      overflow: hidden !important;
      color: var(--et-nav-on) !important;
      font-size: 14.5px !important;
      font-weight: 700 !important;
      letter-spacing: -.015em !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    ${NAV} :is(.navigation-header--logo, .navigation-header--logo a) {
      min-width: 0 !important;
    }

    /* De agenda heeft een eigen achtergrondvlak; dat mag niet over de rand van het zwevende menu vallen */
    @media (min-width: 960px) {
      body:has(.agenda) .content-wrapper {
        margin-left: 10px !important;
      }
    }

    /* Met de sluitknop erbij (smal scherm) alles een maatje kleiner, zodat het op één regel past */
    ${NAV}.is-open :is(.navigation-header, .navigation-header a) {
      gap: 8px !important;
    }

    ${NAV}.is-open .navigation-header--logo :is(img, svg) {
      width: 36px !important;
      height: 36px !important;
      padding: 7px !important;
    }

    ${NAV}.is-open .navigation-header--title {
      font-size: 15px !important;
    }

    ${NAV}.is-open .navigation-header--close-navigation a {
      width: 36px !important;
      height: 36px !important;
    }

    /* Eduarte tekent lijnen boven en onder de lijst; ruimte en vlakken doen dat werk nu */
    ${NAV} .navigation-items {
      align-self: stretch !important;
      width: auto !important;
      min-height: 0 !important;
      padding: 0 !important;
      border: 0 !important;
    }

    ${NAV} ${LIST} {
      display: flex !important;
      flex-direction: column !important;
      gap: 4px !important;
      box-sizing: border-box !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 12px 12px !important;
      list-style: none !important;
    }

    ${NAV} ${LIST}::before {
      display: block !important;
      padding: 8px 16px 6px !important;
      color: color-mix(in srgb, var(--et-nav-on) 52%, transparent) !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      line-height: 16px !important;
      letter-spacing: .02em !important;
      text-transform: none !important;
    }

    ${NAV} .navigation-items--main::before { content: "Menu" !important; }
    ${NAV} .navigation-footer ul::before { content: "Account" !important; }

    /* Profiel en Uitloggen als eigen eilandje onderaan */
    ${NAV} .navigation-footer {
      align-self: stretch !important;
      width: auto !important;
      margin: auto 8px 8px !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 22px !important;
      background: var(--et-nav-island) !important;
    }

    ${NAV} .navigation-footer ul {
      gap: 2px !important;
      padding: 2px 6px 6px !important;
    }

    ${NAV} .navigation-footer ul::before {
      padding: 10px 14px 4px !important;
    }

    /* Eduarte zet lege <li>'s tussen de items; die gaven ongelijke tussenruimtes */
    ${NAV} ${LIST} > li {
      margin: 0 !important;
      padding: 0 !important;
    }

    ${NAV} ${LIST} > li:not(:has(a)) {
      display: none !important;
    }

    /* Overige links in het menu (bijv. subitems) */
    ${NAV} a {
      min-height: 40px !important;
      margin: 0 !important;
      border: 0 !important;
      border-radius: 20px !important;
      color: var(--et-nav-on-variant) !important;
      font-weight: 600 !important;
      transform: none !important;
    }

    ${NAV} a:hover {
      border: 0 !important;
      background: color-mix(in srgb, var(--et-nav-on) 8%, transparent) !important;
      color: var(--et-nav-on) !important;
      transform: none !important;
    }

    ${NAV} .navigation-header--logo a:hover {
      background: transparent !important;
    }

    ${NAV} .navigation-items--sub {
      display: flex !important;
      flex-direction: column !important;
      gap: 2px !important;
      margin: 0 !important;
      padding: 0 12px 12px !important;
    }

    ${NAV} .navigation-items--sub a {
      display: flex !important;
      align-items: center !important;
      padding: 0 16px 0 52px !important;
      font-size: 13.5px !important;
    }

    ${NAV} .navigation-items--sub li.is-selected > a {
      background: var(--et-nav-active) !important;
      color: var(--et-nav-on) !important;
    }

    /* Menu-item: pil van 48px; de kleur zit in ::before zodat die los van de tekst kan bewegen */
    ${ITEM} {
      position: relative !important;
      isolation: isolate !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      box-sizing: border-box !important;
      width: 100% !important;
      height: 48px !important;
      min-height: 48px !important;
      margin: 0 !important;
      padding: 0 20px 0 16px !important;
      overflow: hidden !important;
      border: 0 !important;
      border-radius: 24px !important;
      background: transparent !important;
      box-shadow: none !important;
      color: var(--et-nav-on-variant) !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      line-height: 20px !important;
      white-space: nowrap !important;
      transform: none !important;
      transition: border-radius 260ms var(--et-nav-spring), color 150ms linear !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    ${NAV} .navigation-footer ul > li > a {
      height: 44px !important;
      min-height: 44px !important;
      padding: 0 16px 0 14px !important;
      border-radius: 22px !important;
    }

    ${ITEM}::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      z-index: -1 !important;
      border-radius: inherit !important;
      background: var(--et-nav-on);
      opacity: 0;
      pointer-events: none !important;
      transition: opacity 150ms linear;
    }

    ${ITEM}:hover {
      background: transparent !important;
      color: var(--et-nav-on) !important;
    }

    ${ITEM}:hover::before { opacity: .08; }

    /* Indrukken: de pil wordt even hoekiger en veert daarna terug */
    ${ITEM}:active { border-radius: 14px !important; }
    ${ITEM}:active::before { opacity: .12; }

    ${ITEM} > :is(svg, i) {
      flex: 0 0 24px !important;
      width: 24px !important;
      height: 24px !important;
      margin: 0 !important;
      overflow: visible !important;
    }

    ${ITEM} :is(svg, i, .icon) {
      color: inherit !important;
      filter: none !important;
      transform: none !important;
      transition: transform 320ms var(--et-nav-spring) !important;
    }

    ${ITEM}:hover :is(svg, i, .icon) { transform: scale(1.1) !important; }
    ${ITEM}:active :is(svg, i, .icon) { transform: scale(.94) !important; }

    /* Huidige pagina: gevulde tonale pil, vettere tekst, icoon in de accentkleur */
    ${SELECTED} {
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      color: var(--et-nav-on) !important;
      font-weight: 700 !important;
    }

    ${SELECTED}::before {
      background: var(--et-nav-active);
      opacity: 1;
      animation: et-nav-indicator 460ms var(--et-nav-spring) both;
    }

    ${SELECTED}:hover::before {
      background: color-mix(in srgb, var(--et-nav-active) 90%, var(--et-nav-on));
      opacity: 1;
    }

    ${SELECTED} :is(svg, i, .icon) {
      color: var(--et-nav-active-icon) !important;
      transform: none !important;
    }

    @keyframes et-nav-indicator {
      from { opacity: 0; transform: scaleX(.7); }
    }

    /* Meldingstip van Eduarte (li.has-notice) iets groter en op de nieuwe plek */
    ${NAV} .navigation-items--main > li.has-notice > a { padding-right: 40px !important; }
    ${NAV} .navigation-items--main > li.has-notice > a::after {
      top: 50% !important;
      right: 18px !important;
      width: 8px !important;
      height: 8px !important;
      margin-top: -4px !important;
    }

    @media (prefers-reduced-motion: reduce) {${noMotion}
    }
    ${animations ? "" : noMotion}
    `;
  }

  // Aurora: gekleurd licht op de achtergrond met glazen menu, kaarten en agenda
  function buildAuroraCSS(accent) {
    const glass = "background: rgba(255,255,255,.06) !important; border: 1px solid rgba(255,255,255,.13) !important; backdrop-filter: blur(24px) saturate(160%) !important; -webkit-backdrop-filter: blur(24px) saturate(160%) !important;";
    return `
    html:root:root, html:root body {
      background-color: #0b0716 !important;
      background-image:
        radial-gradient(60% 50% at 15% 10%, rgba(168,85,247,.45), transparent 70%),
        radial-gradient(50% 50% at 90% 20%, rgba(236,72,153,.35), transparent 70%),
        radial-gradient(60% 60% at 60% 100%, rgba(59,130,246,.35), transparent 70%) !important;
      background-attachment: fixed !important;
    }

    .l-container, .l-flex-content, .content-wrapper, .content, main, body:has(.agenda) .content-wrapper {
      background: transparent !important;
    }

    html body nav.navigation.navigation--student {
      ${glass}
      --et-nav-active: color-mix(in srgb, ${accent} 30%, transparent);
      --et-nav-island: rgba(255,255,255,.07);
      box-shadow: 0 20px 40px -20px rgba(0,0,0,.6) !important;
    }

    header.header, header.header:has(> .header-tabs) {
      background: transparent !important;
      border-bottom: 0 !important;
      backdrop-filter: none !important;
    }

    #eduarte-tools-portal-actions .et-portal-action {
      ${glass}
    }

    /* De profielknop heeft zijn eigen geschulpte vorm; geen glazen cirkel erachter */
    #eduarte-tools-portal-actions .et-portal-avatar {
      border: 0 !important;
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    #eduarte-tools-widgets-container {
      --et-accent-2: #f472b6;
    }

    #eduarte-tools-widgets-container .et-card,
    .card, .container-card, .container-studiewijzer, .result-overview, .panel, .box, .result-overview--table,
    body:has(.agenda) .agenda, body:has(.agenda) .agenda-filter {
      ${glass}
      box-shadow: 0 20px 40px -20px rgba(0,0,0,.6) !important;
    }

    body:has(.agenda) .agenda--day > .lead, body:has(.agenda) .agenda--day.is-today > .lead {
      background: transparent !important;
    }

    .result-overview--table > thead > tr > th,
    .result-overview--table > tbody > tr > td,
    .result-overview--table > tbody > tr:nth-child(even) > td {
      background: transparent !important;
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
        animations: s.animations !== false,
      });
    }

    if (presetKey === "portal" && !useCustom && !hasWallpaper) {
      css += buildPortalGlowCSS();
    }

    if (presetKey === "aurora" && !useCustom && !hasWallpaper) {
      css += buildAuroraCSS(effectiveAccent);
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
          animations: data.eduarteAnimations !== false,
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
