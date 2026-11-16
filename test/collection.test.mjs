import { describe, expect, it } from "vitest";
import {
  groupFor, makeCard, mergeCollection, penaltyOutcome, rarityFor, ratingFor,
  subjectName, teamChemistry, teamRating,
} from "../popup-app/src/collection.js";
import { seasonFor } from "../popup-app/src/seasons.js";

const card = (id, subject, result) => makeCard({ id, subject, result }, 1);

describe("kaarten", () => {
  it("bepaalt rarity en rating uit het echte cijfer", () => {
    expect(rarityFor(5.4).id).toBe("bronze");
    expect(rarityFor(6).id).toBe("silver");
    expect(rarityFor(8).id).toBe("gold");
    expect(rarityFor(9.5).id).toBe("special");
    expect(ratingFor(7.46)).toBe(75);
    expect(ratingFor(0)).toBe(1);
  });

  it("haalt de vaknaam en groep uit de titel", () => {
    expect(subjectName("Engels · Schriftelijk")).toBe("Engels");
    expect(groupFor("Engels").id).toBe("talen");
    expect(groupFor("Linux beheer").id).toBe("ict");
    expect(groupFor("Onbekend").id).toBe("overig");
  });

  it("voegt kaarten toe zonder dubbelen of ongeldige cijfers", () => {
    const first = mergeCollection([], [{ id: "a", subject: "Engels", result: 7 }, { id: "x", subject: "Nep", result: 12 }], 1);
    expect(first.collection).toHaveLength(1);
    const second = mergeCollection(first.collection, [{ id: "a", subject: "Engels", result: 9 }, { id: "b", subject: "Duits", result: 6 }], 2);
    expect(second.collection).toHaveLength(2);
    expect(second.added.map(({ id }) => id)).toEqual(["b"]);
    expect(second.collection.find(({ id }) => id === "a").result).toBe(7);
  });
});

describe("team", () => {
  it("geeft chemie voor kaarten uit dezelfde vakgroep", () => {
    const team = [card("1", "Engels", 7), card("2", "Duits", 7), card("3", "Linux", 7), null, null];
    const chemistry = teamChemistry(team);
    expect(chemistry.perCard.get("1")).toBe(1);
    expect(chemistry.perCard.get("3")).toBe(0);
    expect(chemistry.percent).toBeGreaterThan(0);
  });

  it("berekent het teamgemiddelde met chemiebonus", () => {
    expect(teamRating([])).toBe(0);
    expect(teamRating([card("1", "Engels", 8), card("2", "Duits", 8)])).toBe(81);
  });
});

describe("penalty", () => {
  it("is deterministisch met een gegeven random", () => {
    expect(penaltyOutcome({ rating: 90, aim: 0, power: 0.7, dive: 2 }, () => 0.99)).toBe("goal");
    const values = [0.5, 0.1];
    expect(penaltyOutcome({ rating: 90, aim: 0, power: 0.7, dive: 0 }, () => values.shift())).toBe("saved");
    expect(penaltyOutcome({ rating: 50, aim: 1, power: 1, dive: 2 }, () => 0.01)).toBe("miss");
  });
});

describe("seizoenen", () => {
  it("kiest een seizoen op datum", () => {
    expect(seasonFor(new Date(2026, 10, 8))).toBe("autumn");
    expect(seasonFor(new Date(2026, 9, 30))).toBe("halloween");
    expect(seasonFor(new Date(2026, 0, 15))).toBe("winter");
  });
});
