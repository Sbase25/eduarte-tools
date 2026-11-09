import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import {
  buildIcs, collectRooster, describeClass, foldLine, hashEvents, parseAgendaDocument, resolveDay,
} from "../rooster-sync.js";

function row(hours, start, end, code, teacher, location) {
  return `<tr class="clickable-row">
    <td class="agenda-item"><div>${hours}</div></td>
    <td class="agenda-time"><span class="agenda-time top">${start}</span><br><span class="agenda-time bottom">${end}</span></td>
    <td class="agenda-details"><span class="agenda-class">${code}</span><br><span class="agenda-teacher">${teacher}</span></td>
    <td class="agenda-homework-icon"></td><td class="agenda-homework"></td>
    <td class="agenda-location">${location}</td>
  </tr>`;
}

function agendaPage({ date, days, prev = "./agenda?2-1.-filter-terug&op=2", next = "./agenda?2-1.-filter-vooruit&op=2" }) {
  return new JSDOM(`<!doctype html><html><body>
    <div class="agenda-filter time-filter">
      ${prev ? `<a class="btn" href="${prev}">&lt;</a>` : ""}
      ${next ? `<a class="btn" href="${next}">&gt;</a>` : ""}
      <div class="datepicker"><div class="input-group"><input value="${date}"></div></div>
    </div>
    <div class="agenda-list">
      ${days.map(([title, rows]) => `<div class="agenda-title">${title}</div>
        <table class="table table-borderless"><tbody>${rows.join("")}</tbody></table>`).join("")}
    </div>
  </body></html>`).window.document;
}

const WEEK = agendaPage({
  date: "09-11-2026",
  days: [
    ["maandag 9 november", [
      row("2-4", "8:45", "10:15", "ka210-BUCO-H1ONICT1A-cschm", "cschm", "ka210"),
      row("10-15", "13:00", "16:15", "ka006b-OPSYS-H1ONICT1A-apelt", "apelt", "ka006b"),
    ]],
    ["woensdag 25 november", [
      row("", "9:00", "11:30", "_Rekenen LIE 4 variant 1 TR20261125 09.00 uur", "", "Kasteeldreef 116 - D1.08"),
    ]],
  ],
});

describe("parseAgendaDocument", () => {
  it("reads lessons from the Eduarte list view", () => {
    const parsed = parseAgendaDocument(WEEK);
    expect(parsed.isAgenda).toBe(true);
    expect(parsed.next).toContain("filter-vooruit");
    expect(parsed.events).toHaveLength(3);
    expect(parsed.events[1]).toMatchObject({
      year: 2026, month: 11, day: 9,
      start: { hour: 13, minute: 0 }, end: { hour: 16, minute: 15 },
      title: "Operating Systems (OPSYS)", teacher: "apelt", location: "ka006b", hours: "10-15",
    });
    expect(parsed.events[2].title).toBe("Rekenen LIE 4 variant 1 (toets)");
  });

  it("reports pages without an agenda list (e.g. login redirect)", () => {
    const doc = new JSDOM("<html><body><form id='login'></form></body></html>").window.document;
    expect(parseAgendaDocument(doc)).toMatchObject({ isAgenda: false, events: [] });
  });
});

describe("helpers", () => {
  it("picks the right year around new year", () => {
    const ref = new Date(Date.UTC(2026, 11, 28));
    expect(resolveDay("maandag 4 januari", ref)).toEqual({ year: 2027, month: 1, day: 4 });
    expect(resolveDay("dinsdag 29 december", ref)).toEqual({ year: 2026, month: 12, day: 29 });
  });

  it("names subjects from the Eduarte class code", () => {
    expect(describeClass("ka209-COA-H1ONICT1A-sadri")).toBe("COA");
    expect(describeClass("ka202c,ka202b-PJ-H1ONICT1C,H1ONICT1A-sadri,rolaa")).toBe("Project (PJ)");
  });

  it("folds long lines at 75 octets", () => {
    const folded = foldLine("DESCRIPTION:" + "é".repeat(80));
    for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, "")).toBe("DESCRIPTION:" + "é".repeat(80));
  });
});

describe("buildIcs", () => {
  it("creates a valid calendar in Europe/Amsterdam time with stable UIDs", () => {
    const { events } = parseAgendaDocument(WEEK);
    const ics = buildIcs(events, { now: new Date("2026-11-09T12:00:00Z") });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics).toContain("DTSTART;TZID=Europe/Amsterdam:20261109T084500");
    expect(ics).toContain("DTEND;TZID=Europe/Amsterdam:20261109T161500");
    expect(ics).toContain("LOCATION:Kasteeldreef 116 - D1.08");
    expect(ics.replace(/\r\n /g, "")).toContain("DESCRIPTION:Docent: apelt\\nLesuren: 10-15\\nEduarte: ka006b-OPSYS-H1ONICT1A-apelt");
    const again = buildIcs(events, { now: new Date("2026-11-10T12:00:00Z") });
    expect(again.match(/UID:.*/g)).toEqual(ics.match(/UID:.*/g));
    expect(hashEvents(events)).toBe(hashEvents(parseAgendaDocument(WEEK).events));
  });
});

describe("collectRooster", () => {
  it("walks back and forward through weeks and de-duplicates lessons", async () => {
    const base = "https://tilburg-student.educus.nl";
    const pages = {
      [`${base}/agenda`]: WEEK,
      [`${base}/agenda?2-1.-filter-terug&op=2`]: agendaPage({ date: "02-11-2026", days: [["maandag 2 november", [row("2-4", "8:45", "10:15", "ka210-BUCO-H1ONICT1A-cschm", "cschm", "ka210")]]], next: "./agenda?2-1.-filter-vooruit&op=3" }),
      [`${base}/agenda?2-1.-filter-vooruit&op=3`]: WEEK,
      [`${base}/agenda?2-1.-filter-vooruit&op=2`]: agendaPage({ date: "16-11-2026", days: [], next: null }),
    };
    const fetchDocument = async (url) => {
      if (!pages[url]) throw new Error(`unexpected ${url}`);
      return { url, document: pages[url] };
    };
    const events = await collectRooster({ fetchDocument, baseUrl: base, weeksBack: 1, weeksForward: 3 });
    expect(events.map((event) => `${event.month}-${event.day} ${event.start.hour}`)).toEqual([
      "11-2 8", "11-9 8", "11-9 13", "11-25 9",
    ]);
  });

  it("fails clearly when not logged in", async () => {
    const login = new JSDOM("<html><body></body></html>").window.document;
    await expect(collectRooster({ fetchDocument: async (url) => ({ url, document: login }), baseUrl: "https://x.educus.nl" }))
      .rejects.toThrow(/Niet ingelogd/);
  });
});
