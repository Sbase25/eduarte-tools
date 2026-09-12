import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import { BADGE_SCAN_SELECTOR, extractBadgeCount, sumBadgeCounts } from "../badge-logic.js";

function elementFromHtml(html) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
  return dom.window.document.body.firstElementChild;
}

describe("extractBadgeCount", () => {
  it("leest een puur numerieke tekstinhoud", () => {
    const el = elementFromHtml("<span class='badge'>3</span>");
    expect(extractBadgeCount(el)).toBe(3);
  });

  it("leest een getal uit het aria-label als tekst niet numeriek is", () => {
    const el = elementFromHtml("<span class='badge' aria-label='5 ongelezen berichten'></span>");
    expect(extractBadgeCount(el)).toBe(5);
  });

  it("geeft 0 voor niet-numerieke tekst zonder bruikbaar aria-label (valse-positiefpreventie)", () => {
    const el = elementFromHtml("<span class='badge'>Actief</span>");
    expect(extractBadgeCount(el)).toBe(0);
  });

  it("geeft 0 voor een leeg element", () => {
    const el = elementFromHtml("<span class='badge'></span>");
    expect(extractBadgeCount(el)).toBe(0);
  });

  it("negeert getallen langer dan 3 cijfers in de tekst (geen match, dus 0)", () => {
    const el = elementFromHtml("<span class='badge'>12345</span>");
    expect(extractBadgeCount(el)).toBe(0);
  });
});

describe("sumBadgeCounts", () => {
  it("telt meerdere elementen bij elkaar op", () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <header><span class="badge">2</span></header>
      <nav><span class="counter">1</span></nav>
    </body></html>`);
    const elements = dom.window.document.querySelectorAll(BADGE_SCAN_SELECTOR);
    expect(elements.length).toBe(2);
    expect(sumBadgeCounts(elements)).toBe(3);
  });

  it("geeft 0 als er geen enkel badge-element gevonden wordt", () => {
    expect(sumBadgeCounts([])).toBe(0);
  });
});

describe("BADGE_SCAN_SELECTOR", () => {
  it("matcht statuspillen zoals 'Actief' niet als meldingen (0 telling)", () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <nav><span class="status-pill">Actief</span></nav>
    </body></html>`);
    const elements = dom.window.document.querySelectorAll(BADGE_SCAN_SELECTOR);
    expect(sumBadgeCounts(elements)).toBe(0);
  });
});
