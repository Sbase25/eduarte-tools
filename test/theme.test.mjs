import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";

const themeSource = readFileSync(new URL("../theme.js", import.meta.url), "utf8");

function buildTheme(settings) {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    runScripts: "outside-only",
  });
  dom.window.chrome = {
    runtime: {
      getURL(path) {
        return `chrome-extension://test/${path}`;
      },
    },
    storage: {
      local: {
        get(_keys, callback) {
          callback(settings);
        },
      },
      onChanged: {
        addListener() {},
      },
    },
  };
  dom.window.eval(themeSource);
  return dom.window.document.getElementById("eduarte-tools-theme-style")?.textContent || "";
}

describe("theme CSS generation", () => {
  it("builds the default portal layout without breaking theme injection", () => {
    const css = buildTheme({});

    expect(css).toContain("header.header:has(> .header-tabs)");
    expect(css).toContain("left: calc(var(--navigation-width) + 12px)");
    expect(css).toContain("body:has(.agenda) header.header:not(:has(> .header-tabs))");
    expect(css).toContain("height: 56px !important");
    expect(css).toContain("flex-wrap: wrap");
    expect(css).toContain("flex: 1 1 0");
    expect(css).toContain("li:not(:has(> a))");
    expect(css).toContain("max-width: 220px");
    expect(css).toContain(".result-overview--table > tbody > tr > td");
    expect(css).toContain("#111827");
  });

  it("uses the selected theme background and accent in the portal layout", () => {
    const css = buildTheme({
      eduarteThemePreset: "purple",
      eduartePortalLayoutEnabled: true,
    });

    expect(css).toContain("background: color-mix(in srgb, #20163b 97%, #130e24)");
    expect(css).toContain("inset 0 -3px #c084fc");
  });

  it("styles the agenda as a full-width weekly grid without hiding the header actions", () => {
    const css = buildTheme({ eduartePortalLayoutEnabled: true });

    expect(css).toContain("body:has(.agenda) #eduarte-tools-portal-actions");
    expect(css).toContain("margin-right: 2px !important");
    expect(css).toContain("height: 70px !important");
    expect(css).toContain("top: 92px !important");
    expect(css).toContain("left: calc(var(--navigation-width, 16rem) + 16px) !important");
    expect(css).toContain("width: 190px !important");
    expect(css).toContain("width: 330px !important");
    expect(css).toContain("flex: 1 0 168px !important");
    expect(css).toContain("padding: 10px 12px !important");
    expect(css).toContain("overflow-wrap: break-word !important");
    expect(css).toContain(".agenda-filter div.datepicker .input-group > svg.svg-sprites.datepicker");
    expect(css).toContain("padding: 0 12px 0 42px !important");
    expect(css).toContain("body:has(.agenda) .s5-filterbar-toggle");
    expect(css).toContain("body:has(.agenda) .agenda--schedule");
    expect(css).toContain("body:has(.agenda) .agenda--days");
    expect(css).toContain("body:has(.agenda) .agenda--day li.agenda--course > div");
    expect(css).toContain("white-space: normal");
  });

  it("styles the left menu as a Material 3 Expressive panel in the theme colours", () => {
    const css = buildTheme({ eduarteThemePreset: "oled" });

    expect(css).toContain("--et-nav-active: color-mix(in srgb, #38bdf8 26%, #09090b)");
    expect(css).toContain("border-radius: 28px !important");
    expect(css).toContain("@keyframes et-nav-indicator");
    expect(css).toContain("clip-path: polygon(");
    // Eduarte markeert de huidige pagina in de voettekst op de link zelf, niet op de <li>
    expect(css).toContain('.navigation-footer ul > li > a:is(.is-selected, [aria-current="page"])');
    // De lijnen van Eduarte's eigen .navigation-items-wrapper gaan weg
    expect(css).toMatch(/\.navigation-items \{[^}]*border: 0 !important/);
  });

  it("only switches menu motion off when animations are disabled", () => {
    const count = (css) => css.split("animation: none !important").length - 1;

    expect(count(buildTheme({}))).toBe(1); // alleen binnen prefers-reduced-motion
    expect(count(buildTheme({ eduarteAnimations: false }))).toBe(2);
  });

  it("omits portal layout styling when it is disabled", () => {
    const css = buildTheme({ eduartePortalLayoutEnabled: false });

    expect(css).not.toContain("header.header:has(> .header-tabs)");
    expect(css).not.toContain(".result-overview--table > tbody > tr > td");
    expect(css).not.toContain("--et-nav-active");
  });
});
