import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { getGrades, parseGrade } from "../eduarte-api.js";

describe("parseGrade", () => {
  it("parses Dutch decimal grades and respects configured bounds", () => {
    expect(parseGrade(" 8,75 ")).toBe(8.75);
    expect(parseGrade("10")).toBe(10);
    expect(parseGrade("0", 0, 10)).toBe(0);
    expect(parseGrade("11")).toBeNull();
    expect(parseGrade("V")).toBeNull();
  });
});

describe("getGrades", () => {
  it("reads normalized grade entries and available row weights from Eduarte tables", () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <section class="result-overview--grades">
        <table>
          <thead><tr><th>Vak</th><th>Toets 1</th><th>Toets 2</th></tr></thead>
          <tbody>
            <tr data-weight="2"><th>Wiskunde</th><td id="grade-a">8,5</td><td>6</td></tr>
          </tbody>
        </table>
      </section>
      <table><tr><td>2026</td></tr></table>
    </body></html>`);

    const grades = getGrades(dom.window.document);
    expect(grades).toHaveLength(2);
    expect(grades[0]).toMatchObject({
      id: "grade-a",
      result: 8.5,
      weight: 2,
      hasWeight: true,
      title: "Wiskunde · Toets 1",
    });
    expect(grades[1]).toMatchObject({
      result: 6,
      weight: 2,
      title: "Wiskunde · Toets 2",
    });
  });

  it("ignores non-grade cells and grades outside the configured range", () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div class="container-card"><table>
        <tr><th>Vak</th><th>Toets</th></tr>
        <tr><td>Engels</td><td>V</td></tr>
        <tr><td>Nederlands</td><td>0</td></tr>
        <tr><td>Biologie</td><td>7,2</td></tr>
      </table></div>
    </body></html>`);

    expect(getGrades(dom.window.document)).toHaveLength(1);
    expect(getGrades(dom.window.document, { minimum: 7.5 })).toHaveLength(0);
  });

  it("uses explicit weight attributes when present and defaults unknown weights to one", () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <table id="id-grades"><tr><td data-weegfactor="1,5">8</td></tr></table>
    </body></html>`);
    const [grade] = getGrades(dom.window.document);
    expect(grade.weight).toBe(1.5);
    expect(grade.hasWeight).toBe(true);
  });
});
