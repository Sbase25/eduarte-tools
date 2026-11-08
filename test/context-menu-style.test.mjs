import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../popup-app/src/context-menu.css", import.meta.url), "utf8");

describe("context menu spacing", () => {
  it("keeps menu actions comfortably sized and readable", () => {
    expect(css).toContain("width: min(360px, calc(100vw - 16px))");
    expect(css).toContain("gap: 5px");
    expect(css).toContain("min-height: 68px");
    expect(css).toContain("padding: 11px 14px");
    expect(css).toContain("font-size: 15px");
    expect(css).toContain("font-size: 13px");
  });
});
