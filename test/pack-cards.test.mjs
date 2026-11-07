import { describe, expect, it } from "vitest";
import { drawGradeCards } from "../popup-app/src/pack-cards.js";

describe("drawGradeCards", () => {
  it("uses only actual Eduarte grade values and titles", () => {
    const grades = [
      { id: "math-1", result: 8.5, title: "Wiskunde · Toets 1", weight: 2, hasWeight: true },
      { id: "english-1", result: 6.2, title: "Engels · Schriftelijk", weight: 1, hasWeight: false },
    ];

    expect(drawGradeCards(grades, () => 0)).toEqual([
      { id: "english-1", subject: "Engels · Schriftelijk", result: 6.2, weight: null },
      { id: "math-1", subject: "Wiskunde · Toets 1", result: 8.5, weight: 2 },
    ]);
  });

  it("reveals no more than three unique grades and rejects invalid values", () => {
    const grades = [
      { id: "a", result: 10, title: "A" },
      { id: "b", result: 0, title: "B" },
      { id: "c", result: 4.5, title: "C" },
      { id: "d", result: 12, title: "Fake" },
    ];

    const cards = drawGradeCards(grades, () => 0.5);
    expect(cards).toHaveLength(3);
    expect(new Set(cards.map(({ id }) => id)).size).toBe(3);
    expect(cards.some(({ subject }) => subject === "Fake")).toBe(false);
  });

  it("returns an empty result when the current Eduarte page has no grades", () => {
    expect(drawGradeCards([])).toEqual([]);
  });
});
