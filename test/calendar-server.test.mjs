import { describe, expect, it } from "vitest";
import { cleanWeek, mergeWeek, toIcs } from "../calendar-server/src/feed.js";

const lesson = (title, start, end) => ({ title, subject: `ka210-${title}-H1ONICT1A-cschm`, location: "ka210", participants: "cschm", start, end });

describe("cleanWeek", () => {
  it("rejects invalid weeks and trims lesson fields", () => {
    expect(cleanWeek(null)).toBeNull();
    expect(cleanWeek({ from: "x", to: "y", lessons: [] })).toBeNull();
    expect(cleanWeek({ from: "2026-11-09T00:00:00Z", to: "2026-12-30T00:00:00Z", lessons: [] })).toBeNull();
    const week = cleanWeek({
      from: "2026-11-08T23:00:00.000Z",
      to: "2026-11-15T23:00:00.000Z",
      lessons: [lesson("BUCO", "2026-11-09T07:45:00Z", "2026-11-09T09:15:00Z"), { title: "kapot", start: "nee", end: "nee" }],
    });
    expect(week.lessons).toHaveLength(1);
    expect(week.lessons[0].start).toBe("2026-11-09T07:45:00.000Z");
  });
});

describe("mergeWeek", () => {
  it("replaces only the lessons in the synced week and drops very old ones", () => {
    const now = Date.parse("2026-11-09T12:00:00Z");
    const existing = [
      lesson("OUD", "2026-08-01T08:00:00.000Z", "2026-08-01T09:00:00.000Z"),
      lesson("VORIGE", "2026-11-02T08:00:00.000Z", "2026-11-02T09:00:00.000Z"),
      lesson("GESCHRAPT", "2026-11-10T08:00:00.000Z", "2026-11-10T09:00:00.000Z"),
    ];
    const week = {
      from: "2026-11-08T23:00:00.000Z",
      to: "2026-11-15T23:00:00.000Z",
      lessons: [lesson("BUCO", "2026-11-09T07:45:00.000Z", "2026-11-09T09:15:00.000Z")],
    };
    expect(mergeWeek(existing, week, now).map((e) => e.title)).toEqual(["VORIGE", "BUCO"]);
  });
});

describe("toIcs", () => {
  it("builds a subscribable calendar with stable ids and folded lines", () => {
    const events = [lesson("BUCO", "2026-11-09T07:45:00.000Z", "2026-11-09T09:15:00.000Z")];
    const a = toIcs(events, "2026-11-09T10:00:00.000Z");
    const b = toIcs(events, "2026-11-10T10:00:00.000Z");
    expect(a).toContain("X-WR-CALNAME:Eduarte rooster");
    expect(a).toContain("DTSTART:20261109T074500Z");
    expect(a.match(/UID:.*/)[0]).toBe(b.match(/UID:.*/)[0]);
    expect(a.split("\r\n").every((line) => line.length <= 75)).toBe(true);
  });
});
