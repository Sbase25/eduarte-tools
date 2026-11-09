import { describe, expect, it } from "vitest";
import { CATEGORY, planSync, toEvent } from "../outlook-sync.js";

const lesson = (title, start, end) => ({ title, subject: `x-${title}`, location: "ka210", participants: "cschm", start, end });

describe("planSync", () => {
  it("only touches events created by Eduarte Tools and keeps unchanged lessons", () => {
    const existing = [
      { id: "keep", subject: "BUCO", categories: [CATEGORY], start: { dateTime: "2026-11-09T07:45:00.0000000" }, end: { dateTime: "2026-11-09T09:15:00.0000000" } },
      { id: "old", subject: "NED", categories: [CATEGORY], start: { dateTime: "2026-11-09T09:15:00.0000000" }, end: { dateTime: "2026-11-09T11:00:00.0000000" } },
      { id: "dup", subject: "BUCO", categories: [CATEGORY], start: { dateTime: "2026-11-09T07:45:00.0000000" }, end: { dateTime: "2026-11-09T09:15:00.0000000" } },
      { id: "mine", subject: "Tandarts", categories: [], start: { dateTime: "2026-11-09T12:00:00.0000000" }, end: { dateTime: "2026-11-09T13:00:00.0000000" } },
    ];
    const lessons = [
      lesson("BUCO", "2026-11-09T07:45:00.000Z", "2026-11-09T09:15:00.000Z"),
      lesson("OPSYS", "2026-11-09T12:00:00.000Z", "2026-11-09T15:15:00.000Z"),
    ];
    const plan = planSync(existing, lessons);
    expect(plan.remove.sort()).toEqual(["dup", "old"]);
    expect(plan.create.map((l) => l.title)).toEqual(["OPSYS"]);
  });

  it("builds Outlook events in UTC with the Eduarte category", () => {
    const event = toEvent(lesson("BUCO", "2026-11-09T07:45:00.000Z", "2026-11-09T09:15:00.000Z"));
    expect(event.start).toEqual({ dateTime: "2026-11-09T07:45:00.000", timeZone: "UTC" });
    expect(event.categories).toEqual([CATEGORY]);
    expect(event.location.displayName).toBe("ka210");
  });
});
