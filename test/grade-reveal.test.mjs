import { createRequire } from "node:module";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { drawPackCards, gradeKey, starCard } from "../popup-app/src/pack-cards.js";

const require = createRequire(import.meta.url);
const Reveal = require("../extension/grade-reveal.js");
const EduarteApi = require("../extension/eduarte-api.js");
const Notify = require("../extension/notifications.js");

const PAGE = (rows) => `<!doctype html><html><head></head><body><div class="result-overview--grades"><table>
  <thead><tr><th>Vak</th><th>Toets 1</th><th>Toets 2</th></tr></thead>
  <tbody>${rows.map(([name, a, b]) => `<tr><th>${name}</th><td>${a}</td><td>${b}</td></tr>`).join("")}</tbody></table></div></body></html>`;

function mount(rows, stored) {
  const dom = new JSDOM(PAGE(rows), { url: "https://tilburg-student.educus.nl/resultaten", pretendToBeVisual: true });
  const { window } = dom;
  const sets = [];
  const messages = [];
  const listeners = [];
  window.EduarteApi = EduarteApi;
  window.chrome = {
    runtime: { lastError: null, sendMessage: (message) => messages.push(message) },
    storage: {
      local: {
        get: (_keys, callback) => callback({ ...stored }),
        set: (value) => { sets.push(value); Object.assign(stored, value); },
      },
      onChanged: { addListener: (listener) => listeners.push(listener) },
    },
  };
  Reveal.start(window);
  const cells = () => [...window.document.querySelectorAll("tbody td")].map((cell) => cell.classList.contains("et-grade-hidden"));
  return { window, sets, messages, listeners, cells };
}

describe("cijfers verbergen tot het pack open is", () => {
  it("gebruikt op het portaal en in het pack dezelfde sleutel", () => {
    const grade = { title: "Rekenen · Toets 1", result: 7.5 };
    expect(Reveal.gradeKey(grade)).toBe("Rekenen · Toets 1|7.5");
    expect(gradeKey(grade)).toBe(Reveal.gradeKey(grade));
  });

  it("ziet de eerste keer alles als al gezien", () => {
    const { sets, cells, window } = mount([["Rekenen", "7,5", "6,0"]], {});
    expect(cells()).toEqual([false, false]);
    expect(sets[0].eduarteRevealedGrades).toEqual(["Rekenen · Toets 1|7.5", "Rekenen · Toets 2|6"]);
    expect(window.document.getElementById("eduarte-tools-grade-banner")).toBeNull();
    expect(window.document.documentElement.dataset.etGrades).toBeUndefined();
  });

  it("verbergt alleen het nieuwe cijfer en opent het pack bij een klik", () => {
    const stored = { eduarteRevealedGrades: ["Rekenen · Toets 1|7.5"] };
    const { cells, window, messages, sets } = mount([["Rekenen", "7,5", "8,2"]], stored);
    expect(cells()).toEqual([false, true]);
    expect(window.document.documentElement.dataset.etGrades).toBe("verborgen");
    const banner = window.document.getElementById("eduarte-tools-grade-banner");
    expect(banner).not.toBeNull();

    window.document.querySelector(".et-grade-hidden").click();
    expect(messages.at(-1)).toEqual({ type: "OPEN_EDUARTE_TOOLS_PAGE", page: "packs" });

    banner.querySelector(".et-show").click();
    expect(cells()).toEqual([false, false]);
    expect(sets.at(-1).eduarteRevealedGrades).toContain("Rekenen · Toets 2|8.2");
    expect(window.document.getElementById("eduarte-tools-grade-banner")).toBeNull();
  });

  it("laat het cijfer zien zodra het pack het onthuld heeft, of als de optie uit gaat", () => {
    const stored = { eduarteRevealedGrades: ["Rekenen · Toets 1|7.5"] };
    const first = mount([["Rekenen", "7,5", "8,2"]], stored);
    first.listeners[0]({ eduarteRevealedGrades: { newValue: ["Rekenen · Toets 1|7.5", "Rekenen · Toets 2|8.2"] } }, "local");
    expect(first.cells()).toEqual([false, false]);

    const second = mount([["Rekenen", "7,5", "8,2"]], { eduarteRevealedGrades: ["Rekenen · Toets 1|7.5"] });
    expect(second.cells()).toEqual([false, true]);
    second.listeners[0]({ eduarteHidePackGrades: { newValue: false } }, "local");
    expect(second.cells()).toEqual([false, false]);
    expect(second.window.localStorage.getItem("eduarteToolsHideGrades")).toBe("0");
  });

  it("doet niets als de optie uit staat", () => {
    const { cells, sets } = mount([["Rekenen", "7,5", "8,2"]], { eduarteHidePackGrades: false });
    expect(cells()).toEqual([false, false]);
    expect(sets).toEqual([]);
  });

  it("noemt het cijfer niet in de melding zolang het verborgen is", () => {
    const item = { key: "grade|Rekenen|8.2", kind: "grade", title: "Rekenen", result: 8.2 };
    expect(Notify.toNotification(item, 1, { hideGrade: true })).toMatchObject({ title: "Nieuw cijfer", text: "Open een pack om het te onthullen" });
    expect(Notify.toNotification(item, 1).title).toBe("Nieuw cijfer: 8,2");
  });
});

describe("drawPackCards", () => {
  const grades = [
    { id: "a", result: 6, title: "A", hasWeight: true, weight: 2 },
    { id: "b", result: 9, title: "B" },
    { id: "c", result: 7, title: "C" },
    { id: "d", result: 8, title: "D" },
  ];

  it("haalt nieuwe cijfers als eerste uit het pack", () => {
    const cards = drawPackCards(grades, ["A|6", "B|9", "C|7"], () => 0.3);
    expect(cards).toHaveLength(3);
    expect(cards[0]).toMatchObject({ id: "d", isNew: true, key: "D|8" });
    expect(cards.filter((card) => card.isNew)).toHaveLength(1);
    expect(starCard(cards).id).toBe("d");
  });

  it("zonder verbergen is niets nieuw en krijgt het hoogste cijfer de walkout", () => {
    const cards = drawPackCards(grades.slice(0, 3), null, () => 0.3);
    expect(cards.some((card) => card.isNew)).toBe(false);
    expect(starCard(cards).id).toBe("b");
    expect(starCard([])).toBeNull();
  });
});
