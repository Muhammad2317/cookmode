import { describe, expect, it } from "vitest";
import {
  contrastLevel,
  contrastRatio,
  parseHex,
  relativeLuminance,
} from "./contrast";

describe("contrast", () => {
  it("parses 3- and 6-digit hex", () => {
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
    expect(parseHex("0b0b0a")).toEqual([11, 11, 10]);
    expect(() => parseHex("#12")).toThrow();
  });

  it("computes luminance at the extremes", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
  });

  it("matches known WCAG ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#767676")).toBeCloseTo(4.54, 2);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#1a1a18", "#f5f5f0")).toBe(
      contrastRatio("#f5f5f0", "#1a1a18"),
    );
  });

  it.each([
    [21, "AAA"],
    [7, "AAA"],
    [6.99, "AA"],
    [4.5, "AA"],
    [3.2, "AA Large"],
    [2.9, "Fail"],
  ] as const)("%d → %s", (ratio, level) => {
    expect(contrastLevel(ratio)).toBe(level);
  });
});
