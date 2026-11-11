import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";

const agendaSource = readFileSync(new URL("../agenda.js", import.meta.url), "utf8");
const overlaySource = readFileSync(new URL("../overlay.js", import.meta.url), "utf8");

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
