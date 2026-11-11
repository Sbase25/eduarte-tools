import { createRequire } from "node:module";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const Notify = require("../extension/notifications.js");

// Zelfde opbouw als de pagina Presentie van het portaal (week van 9 november 2026)
const ROWS = [
  ["ma", 2, "Aanwezig", "8:45 - 10:15 ka210-BUCO-H1ONICT1A-cschm - mevr. A. Docent", ""],
  ["ma", 3, "Aanwezig", "8:45 - 10:15 ka210-BUCO-H1ONICT1A-cschm - mevr. A. Docent", ""],
  ["ma", 5, "Aanwezig", "10:15 - 12:00 ka101a-NED-H1ONICT1A-fbast - dhr. B. Docent", ""],
  ["di", 10, "Niet geregistreerd", "13:00 - 14:00 ka202c,ka202b,ka202a-MEB-H1ONICT1A-sadri", ""],
  ["wo", 2, "Ziekmelding door deelnemer (8:45 - 9:15)", "8:45 - 9:45 ka006b-THPJ-H1ONICT1A-rolaa - dhr. C. Docent", "Gemeld op 10-11-2026 22:09 door student<br>Geoorloofd, afgehandeld"],
  ["wo", 3, "Ziekmelding door deelnemer (9:15 - 9:45)", "8:45 - 9:45 ka006b-THPJ-H1ONICT1A-rolaa - dhr. C. Docent", "Gemeld op 10-11-2026 22:09 door student<br>Geoorloofd, afgehandeld"],
  ["wo", 10, "Ziekmelding door deelnemer (13:00 - 13:30)", "13:00 - 14:30 ka202c,ka202b,ka202a,ka101a-PJ-H1ONICT1C,H1ONICT1B,H1ONICT1A-sadri,rolaa,mviss", "Gemeld op 10-11-2026 22:09 door student<br>Geoorloofd, afgehandeld"],
];

function presencePage(rows = ROWS) {
  const days = [...new Set(rows.map((row) => row[0]))].map((day) => `
    <div class="student-absence--day"><span class="student-absence--day-title">${day}</span>
      ${rows.filter((row) => row[0] === day).map(([, hour, status, detail, reported]) => `
        <div class="student-absence--hour"><span class="student-absence--hour-title">${hour}</span>
          <div class="student-absence--course"><small class="student-absence--reported">${reported}</small>
            <p class=""><strong>${status}</strong></p><small>${detail}</small></div></div>`).join("")}
    </div>`).join("");
  return new JSDOM(`<div class="abstract-absentie-page"><div class="week-header"><h2 class="is-header">Vanaf 09-11-2026 tot en met 15-11-2026</h2></div></div>
    <div class="content--part"><div class="week-header"><h2>9 november - 13 november</h2></div><div class="tasks student-absence">${days}</div></div>`).window.document;
}

describe("meldingen: presentie", () => {
  it("maakt één item per les en slaat 'Niet geregistreerd' over", () => {
    const items = Notify.presenceFromPresencePage(presencePage());
    expect(items.map((item) => item.key)).toEqual([
      "presence|2026-11-09|8:45–10:15|BUCO|aanwezig",
      "presence|2026-11-09|10:15–12:00|NED|aanwezig",
      "presence|2026-11-11|8:45–9:45|THPJ|ziek gemeld",
      "presence|2026-11-11|13:00–14:30|PJ|ziek gemeld",
    ]);
  });

  it("schrijft de melding in gewone taal", () => {
    const [present, , sick] = Notify.presenceFromPresencePage(presencePage()).map((item) => Notify.toNotification(item, 0));
    expect(present).toMatchObject({ title: "Je staat op aanwezig: BUCO", text: "ma 9 nov 8:45–10:15", tone: "ok", href: "/presentie", read: false });
    expect(sick).toMatchObject({ title: "Ziek gemeld: THPJ", text: "wo 11 nov 8:45–9:45 · geoorloofd", tone: "warn" });
  });

  it("meldt de eerste keer niets en daarna alleen wat erbij is gekomen", () => {
    const first = Notify.diff({}, "presence", Notify.presenceFromPresencePage(presencePage()));
    expect(first.created).toEqual([]);

    // De docent van MEB vult alsnog aanwezig in
    const updated = ROWS.map((row) => (row[2] === "Niet geregistreerd" ? [row[0], row[1], "Aanwezig", row[3], ""] : row));
    const second = Notify.diff(first.state, "presence", Notify.presenceFromPresencePage(presencePage(updated)));
    expect(second.created.map((item) => Notify.toNotification(item, 0).title)).toEqual(["Je staat op aanwezig: MEB"]);

    const third = Notify.diff(second.state, "presence", Notify.presenceFromPresencePage(presencePage(updated)));
    expect(third.created).toEqual([]);
  });

  it("herkent afwezig en te laat als waarschuwing", () => {
    const doc = presencePage([
      ["do", 3, "Ongeoorloofd afwezig", "9:15 - 12:30 ka208-NW-H1ONICT1A-gjori", ""],
      ["vr", 6, "Te laat", "11:00 - 12:30 kc018-F@S-H1ONICT1A-tburg", ""],
    ]);
    const list = Notify.presenceFromPresencePage(doc).map((item) => Notify.toNotification(item, 0));
    expect(list.map((item) => [item.title, item.tone])).toEqual([
      ["Je staat op ongeoorloofd afwezig: NW", "warn"],
      ["Je staat op te laat: F@S", "warn"],
    ]);
  });
});

describe("meldingen: lijst", () => {
  it("zet nieuwe meldingen bovenaan zonder dubbele en telt ongelezen", () => {
    const a = { id: "a", title: "A", read: false, at: 1 };
    const b = { id: "b", title: "B", read: false, at: 2 };
    const list = Notify.addNotifications([a], [b, a]);
    expect(list.map((item) => item.id)).toEqual(["b", "a"]);
    expect(Notify.unreadCount(list)).toBe(2);
    expect(Notify.unreadCount(Notify.markAllRead(list))).toBe(0);
  });

  it("zegt hoe lang geleden iets was", () => {
    const now = 10 * 24 * 3600 * 1000;
    expect(Notify.timeAgo(now - 20 * 1000, now)).toBe("zojuist");
    expect(Notify.timeAgo(now - 12 * 60000, now)).toBe("12 min geleden");
    expect(Notify.timeAgo(now - 3 * 3600000, now)).toBe("3 uur geleden");
    expect(Notify.timeAgo(now - 26 * 3600000, now)).toBe("gisteren");
  });
});
