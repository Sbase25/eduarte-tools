import { describe, expect, it } from "vitest";
import {
  calculateGradeStatistics,
  calculateGradeSummary,
  parseGradeBackup,
} from "../grade-calculator.js";

describe("calculateGradeSummary", () => {
  it("calculates weighted average, median, total weighting, and required grade", () => {
    const result = calculateGradeSummary([
      { result: 8, weight: 2 },
      { result: 6, weight: 1 },
    ], 7, 1);

    expect(result.weightedAverage).toBeCloseTo(22 / 3);
    expect(result.median).toBe(7);
    expect(result.totalWeight).toBe(3);
    expect(result.needed).toBe(6);
    expect(result.roundedNeeded).toBe(6);
    expect(result.projectedAverage).toBe(7);
    expect(result.achievable).toBe(true);
  });

  describe("calculateGradeStatistics", () => {
    it("calculates mean, median, modes, deviation, and sufficient count", () => {
      const result = calculateGradeStatistics([
        { result: 6 },
        { result: 7 },
        { result: 7 },
        { result: 8 },
      ], 5.5);

      expect(result.mean).toBe(7);
      expect(result.median).toBe(7);
      expect(result.modes).toEqual([7]);
      expect(result.modeCount).toBe(2);
      expect(result.standardDeviation).toBeCloseTo(Math.sqrt(.5));
      expect(result.sufficient).toBe(4);
      expect(result.distribution.find(({ grade }) => grade === 7).count).toBe(2);
    });

    it("returns null for an empty selection", () => {
      expect(calculateGradeStatistics([])).toBeNull();
    });
  });

  describe("parseGradeBackup", () => {
    it("loads a supported backup and normalizes its grades", () => {
      expect(parseGradeBackup(JSON.stringify({
        format: "eduarte-tools-grades",
        version: 1,
        grades: [{ result: "8,5", weight: "2", title: "Toets" }],
      }))).toEqual([{ result: 8.5, weight: 2, title: "Toets" }]);
    });

    it("imports weighted entries from Study Tools .stgrades backups", () => {
      expect(parseGradeBackup({
        date: "2026-01-01",
        year: { studie: { code: "MBO" }, lesperiode: { code: "1" } },
        grades: [{
          CijferStr: "7,8",
          CijferKolom: { Weging: 2, KolomOmschrijving: "Praktijktoets" },
        }],
      })).toEqual([{ result: 7.8, weight: 2, title: "Praktijktoets" }]);
    });

    it("rejects malformed or out-of-range backup grades", () => {
      expect(() => parseGradeBackup("not json")).toThrow("geldige JSON");
      expect(() => parseGradeBackup({ format: "other", version: 1, grades: [] })).toThrow("ondersteunde");
      expect(() => parseGradeBackup({
        format: "eduarte-tools-grades",
        version: 1,
        grades: [{ result: 11, weight: 1 }],
      })).toThrow("geldige cijfers");
    });
  });

  it("reports when a target is out of reach and clamps the projected average", () => {
    const result = calculateGradeSummary([{ result: 5, weight: 1 }], 10, 1);

    expect(result.needed).toBe(15);
    expect(result.achievable).toBe(false);
    expect(result.projectedAverage).toBe(7.5);
  });

  it("uses configured grade bounds to filter invalid results", () => {
    const result = calculateGradeSummary([
      { result: 0, weight: 1 },
      { result: 8, weight: 1 },
    ], 5.5, 1, 1, 10);

    expect(result.weightedAverage).toBe(8);
    expect(result.totalWeight).toBe(1);
  });

  it("returns null when no valid, weighted grades are provided", () => {
    expect(calculateGradeSummary([
      { result: 11, weight: 1 },
      { result: 8, weight: 0 },
    ], 5.5, 1)).toBeNull();
  });
});
