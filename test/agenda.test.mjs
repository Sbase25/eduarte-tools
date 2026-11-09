import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { formatTime, getTodayLessons, shortenSubject } from "../agenda.js";

describe("shortenSubject", () => {
  it("keeps only the course code from Eduarte lesson names", () => {
    expect(shortenSubject("ka210-BUCO-H1ONICT1A-cschm", "ka210", "cschm")).toBe("BUCO");
    expect(shortenSubject("ka202c,ka202b,ka202a,ka101a-PJ-H1ONICT1C,H1ONICT1B,H1ONICT1A-sadri,rolaa,mviss", "ka202c, ka202b, ka202a, ka101a", "sadri, rolaa, mviss")).toBe("PJ");
    expect(shortenSubject("kc018-F@S-H1ONICT1A-tburg", "kc018", "tburg")).toBe("F@S");
  });

  it("leaves names without dashes untouched", () => {
    expect(shortenSubject("Mentorgesprek", "", "")).toBe("Mentorgesprek");
  });
});

describe("getTodayLessons", () => {
  it("reads times from Eduarte's per-lesson position styles", () => {
    const dom = new JSDOM(`<!doctype html><html><head>
      <style id="id1-style">#id1 { top: 81px; left: 0%; width: 100%; height: 162px; }</style>
      <style id="id2-style">#id2 { top: 540px; height: 351px; }</style>
    </head><body><div class="agenda">
      <div class="agenda--time"><ul><li><span>08:00</span></li></ul></div>
      <div class="agenda--days">
        <div class="agenda--day is-today"><ul>
          <li id="id2" class="agenda--course"><div><span class="is-subject">ka006b-OPSYS-H1ONICT1A-apelt</span><span class="is-location">ka006b</span><span class="is-participant">apelt</span></div></li>
          <li id="id1" class="agenda--course"><div><span class="is-subject">ka210-BUCO-H1ONICT1A-cschm</span><span class="is-location">ka210</span><span class="is-participant">cschm</span></div></li>
        </ul></div>
      </div>
    </div></body></html>`);

    const lessons = getTodayLessons(dom.window.document);
    expect(lessons.map((l) => l.title)).toEqual(["BUCO", "OPSYS"]);
    expect(formatTime(lessons[0].start)).toBe("08:45");
    expect(formatTime(lessons[0].end)).toBe("10:15");
    expect(formatTime(lessons[1].start)).toBe("13:00");
    expect(formatTime(lessons[1].end)).toBe("16:15");
  });
});
