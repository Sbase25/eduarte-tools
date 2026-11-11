import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";

const agendaSource = readFileSync(new URL("../extension/agenda.js", import.meta.url), "utf8");
const overlaySource = readFileSync(new URL("../extension/overlay.js", import.meta.url), "utf8");

// Eduarte tekent het rooster met 108px per uur vanaf 08:00
const lesson = (id, start, end, subject, location, teacher) => {
  const top = (start - 8) * 108;
  const height = (end - start) * 108;
  return `<style>#${id} { top: ${top}px; height: ${height}px; }</style>
    <li id="${id}" class="agenda--course"><div>
      <span class="is-subject">${location}-${subject}-H1ONICT1A-${teacher}</span>
      <span class="is-location">${location}</span><span class="is-participant">${teacher}</span>
    </div></li>`;
};

const AGENDA_HTML = `<!doctype html><html><body><div class="agenda">
  <div class="agenda--time"><ul><li><span>08:00</span></li></ul></div>
  <div class="agenda--days">
    <div class="agenda--day"><p class="lead">ma 9 nov</p><ul>${lesson("a1", 8.75, 10.25, "BUCO", "ka210", "cschm")}</ul></div>
    <div class="agenda--day is-today"><p class="lead">di 10 nov</p><ul>
      ${lesson("b1", 8.75, 11.5, "SECUR", "ka106", "gjori")}
      ${lesson("b2", 11.5, 12.5, "DIVAALG", "ka106", "mviss")}
      ${lesson("b3", 13, 14, "MEB", "ka202c", "sadri")}
      ${lesson("b4", 14, 15, "COA", "ka209", "sadri")}
    </ul></div>
    <div class="agenda--day"><p class="lead">wo 11 nov</p><ul>
      ${lesson("c1", 8.75, 10.25, "OPSYS", "ka006b", "apelt")}
      ${lesson("c2", 10.5, 12.5, "PJ", "ka202c", "rolaa")}
    </ul></div>
  </div>
</div></body></html>`;

let dom;
afterEach(() => dom?.window.close());

async function mountHome({ hour, minute, nativeNow = "" }) {
  dom = new JSDOM(`<!doctype html><html><head></head><body>
    <div class="now--wrapper"><h1>Goedemiddag Stijn</h1><ul>
      ${nativeNow}
      <li class="now--tomorrow">Morgen begin je om 8:45.</li>
    </ul></div>
  </body></html>`, { runScripts: "outside-only", url: "https://tilburg-student.educus.nl/" });
  const { window } = dom;

  const RealDate = window.Date;
  const fixed = new RealDate(2026, 10, 10, hour, minute).getTime();
  window.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [fixed])); }
    static now() { return fixed; }
  };
  window.MutationObserver = class { observe() {} disconnect() {} };
  window.fetch = async () => ({ ok: true, text: async () => AGENDA_HTML });
  window.chrome = {
    runtime: {
      onMessage: { addListener() {} },
      sendMessage(_message, callback) { callback?.({ success: false }); },
      lastError: null,
    },
    storage: {
      local: { get(_keys, callback) { callback({}); }, set() {} },
      onChanged: { addListener() {} },
    },
  };

  window.eval(agendaSource);
  window.eval(overlaySource);
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));

  const root = window.document.getElementById("eduarte-tools-widgets-container");
  const text = (selector) => root.querySelector(selector)?.textContent.replace(/\s+/g, " ").trim() ?? null;
  return { root, text };
}

describe("startpagina: nu bezig / volgende les", () => {
  it("toont na de laatste les de eerste les van morgen met een aftelling", async () => {
    const { root, text } = await mountHome({ hour: 23, minute: 57 });

    expect(root.querySelector(".et-now").classList.contains("is-next")).toBe(true);
    expect(text(".et-now .et-tag")).toBe("Morgen");
    expect(text(".et-now h4")).toBe("OPSYS");
    expect(text(".et-now .et-meta")).toBe("ka006b · apelt");
    expect(text(".et-when")).toBe("08:45 – 10:15over 8u 48m");
    expect(text(".et-today-title")).toBe("Morgen");
    expect([...root.querySelectorAll(".et-tl strong")].map((el) => el.textContent)).toEqual(["OPSYS", "PJ"]);
    expect(text(".et-lesson-count")).toBe("4 lessen gehad");
  });

  it("toont tijdens een les de voortgang en wat er daarna komt", async () => {
    const { root, text } = await mountHome({
      hour: 10,
      minute: 5,
      nativeNow: `<li><div class="now--body is-now"><h4><strong>Nu</strong> SECUR</h4><p>ka106 met gjori</p></div></li>`,
    });

    expect(root.querySelector(".et-now").classList.contains("is-live")).toBe(true);
    expect(text(".et-now .et-tag")).toBe("Nu bezig");
    expect(text(".et-now h4")).toBe("SECUR");
    expect(text(".et-after")).toBe("Hierna DIVAALG · 11:30");
    expect(text(".et-left")).toBe("nog 1u 25m");
    expect(root.querySelector(".et-when").hidden).toBe(true);
    expect(text(".et-today-title")).toBe("Vandaag");
    expect(root.querySelector(".et-tl li").className).toBe("is-current");
  });

  it("toont in een tussenuur de volgende les van vandaag", async () => {
    const { root, text } = await mountHome({ hour: 12, minute: 40 });

    expect(text(".et-now .et-tag")).toBe("Volgende les");
    expect(text(".et-now h4")).toBe("MEB");
    expect(text(".et-when")).toBe("13:00 – 14:00over 20 min");
    expect(root.querySelector(".et-progress").hidden).toBe(true);
    expect([...root.querySelectorAll(".et-tl li")].map((li) => li.className)).toEqual(["is-past", "is-past", "", ""]);
  });
});

describe("startpagina: wat moet ik halen?", () => {
  async function calc(values) {
    const { root, text } = await mountHome({ hour: 12, minute: 0 });
    const event = new dom.window.Event("input", { bubbles: true });
    Object.entries(values).forEach(([id, value]) => {
      const input = root.querySelector(`#et-calc-${id}`);
      input.value = value;
      input.dispatchEvent(event);
    });
    return { root, needed: text("#et-calc-needed"), hint: text("#et-calc-hint") };
  }

  it("rekent met komma's én punten", async () => {
    expect((await calc({ avg: "6,5", weights: "3", target: "7,0", future: "1" })).needed).toBe("8,5");
    expect((await calc({ avg: "6.5", weights: "3", target: "7.0", future: "1" })).needed).toBe("8,5");
  });

  it("rondt naar boven af, zodat het cijfer ook echt genoeg is", async () => {
    // (5,5 × 4 − 6,1 × 3) / 1 = 3,7 ; (7 × 7 − 6,8 × 6) / 1 = 8,2 ; (6 × 3 − 5,7 × 2,5) / 0,5 = 7,5
    expect((await calc({ avg: "6,13", weights: "3", target: "5,5", future: "1" })).needed).toBe("3,7");
    expect((await calc({ avg: "6,81", weights: "6", target: "7", future: "1" })).needed).toBe("8,2");
  });

  it("zegt het erbij als het doel niet haalbaar is", async () => {
    const { root, needed, hint } = await calc({ avg: "5", weights: "10", target: "8", future: "1" });
    expect(needed).toBe("38,0");
    expect(root.querySelector("#et-calc-needed").className).toBe("is-bad");
    expect(hint).toBe("niet haalbaar met één toets · met een 10 kom je op 5,4");
  });

  it("zegt het erbij als elk cijfer genoeg is", async () => {
    const { needed, hint } = await calc({ avg: "9", weights: "10", target: "5,5", future: "1" });
    expect(needed).toBe("1,0");
    expect(hint).toBe("elk cijfer is genoeg voor een 5,5 gemiddeld");
  });

  it("markeert ongeldige invoer in plaats van onzin te rekenen", async () => {
    const { root, needed, hint } = await calc({ avg: "12", weights: "3", target: "7", future: "1" });
    expect(needed).toBe("—");
    expect(hint).toBe("vul cijfers tussen 1 en 10 in");
    expect(root.querySelector("#et-calc-avg").classList.contains("is-invalid")).toBe(true);
    expect((await calc({ avg: "6", weights: "3", target: "7", future: "0" })).hint).toBe("vul een weging groter dan 0 in");
    expect((await calc({ avg: "abc", weights: "3", target: "7", future: "1" })).needed).toBe("—");
  });
});

describe("startpagina: eigen snelkoppelingen", () => {
  async function add(root, name, url) {
    root.querySelector(".et-bm-name").value = name;
    root.querySelector(".et-bm-url").value = url;
    root.querySelector(".et-bm form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  }

  it("voegt een eigen link toe, vult https:// aan en bewaart hem", async () => {
    const { root, text } = await mountHome({ hour: 12, minute: 0 });
    const saved = [];
    dom.window.chrome.storage.local.set = (value) => saved.push(value);
    root.querySelector(".et-link.is-add").click();
    expect(root.querySelector(".et-bm").hidden).toBe(false);

    await add(root, "itslearning", "tilburg.itslearning.com");
    const link = root.querySelector(".et-link.is-custom");
    expect(link.href).toBe("https://tilburg.itslearning.com/");
    expect(link.querySelector("em").textContent).toBe("itslearning");
    expect(saved.at(-1)).toEqual({ eduarteBookmarks: [{ name: "itslearning", url: "https://tilburg.itslearning.com/" }] });

    root.querySelector(".et-bm-list button").click();
    expect(root.querySelector(".et-link.is-custom")).toBeNull();
    expect(saved.at(-1)).toEqual({ eduarteBookmarks: [] });
  });

  it("weigert links die geen gewone webpagina zijn", async () => {
    const { root, text } = await mountHome({ hour: 12, minute: 0 });
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "geen link", "localhost"]) {
      await add(root, "x", bad);
      expect(root.querySelector(".et-link.is-custom")).toBeNull();
    }
    expect(text(".et-bm-error")).toBe("Vul een geldige link in, bijvoorbeeld itslearning.com.");
  });

  it("gebruikt de sitenaam als je geen naam invult en weigert dubbele links", async () => {
    const { root, text } = await mountHome({ hour: 12, minute: 0 });
    await add(root, "", "https://www.youtube.com/watch?v=1");
    expect(root.querySelector(".et-link.is-custom em").textContent).toBe("youtube");
    await add(root, "nog een keer", "https://www.youtube.com/watch?v=1");
    expect(root.querySelectorAll(".et-link.is-custom").length).toBe(1);
    expect(text(".et-bm-error")).toBe("Deze link staat er al tussen.");
  });
});

describe("startpagina: takenlijst", () => {
  it("voegt taken toe, vinkt af, wist afgevinkte en bewaart alles", async () => {
    const { root, text } = await mountHome({ hour: 12, minute: 0 });
    const saved = [];
    dom.window.chrome.storage.local.set = (value) => saved.push(value);
    const submit = (value) => {
      root.querySelector(".et-todo-form input").value = value;
      root.querySelector(".et-todo-form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    };
    expect(root.querySelector(".et-todo-empty").hidden).toBe(false);

    submit("Verslag PJ inleveren");
    submit("   ");
    submit("<b>Rekenen</b> oefenen");
    const labels = () => [...root.querySelectorAll(".et-todo-list label")].map((el) => el.textContent);
    expect(labels()).toEqual(["Verslag PJ inleveren", "<b>Rekenen</b> oefenen"]);
    expect(root.querySelector(".et-todo-list b")).toBeNull();
    expect(text(".et-todo-count")).toBe("2 open");
    expect(saved.at(-1).eduarteTodos.map((t) => [t.text, t.done])).toEqual([["Verslag PJ inleveren", false], ["<b>Rekenen</b> oefenen", false]]);

    const first = root.querySelector(".et-todo-list input[type=checkbox]");
    first.checked = true;
    first.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    expect(labels()).toEqual(["<b>Rekenen</b> oefenen", "Verslag PJ inleveren"]);
    expect(text(".et-todo-count")).toBe("1 open");
    expect(root.querySelector(".et-todo-clear").hidden).toBe(false);

    root.querySelector(".et-todo-clear").click();
    expect(labels()).toEqual(["<b>Rekenen</b> oefenen"]);
    expect(saved.at(-1).eduarteTodos.length).toBe(1);
  });
});
