import { describe, expect, it } from "vitest";
import { parseDuration } from "./parseDuration";

describe("parseDuration", () => {
  it.each([
    ["PT15M", 15],
    ["PT1H", 60],
    ["PT1H15M", 75],
    ["PT90M", 90],
    ["PT1.5H", 90],
    ["PT45S", 1],
    ["PT30S", 1],
    ["PT1H15M0S", 75],
    ["P0DT1H30M", 90],
    ["P1D", 1440],
    ["P1DT2H", 1560],
    ["P1W", 10080],
    ["PT0M", 0],
    ["  pt20m  ", 20],
  ])("%s → %i minutes", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it.each([
    ["P"],
    ["PT"],
    ["P1DT"],
    ["1 hour"],
    ["45"],
    [""],
    ["P1Y"],
    ["P2M"],
    ["PTXM"],
  ])("rejects %j", (input) => {
    expect(parseDuration(input)).toBeNull();
  });

  it("rejects non-strings", () => {
    expect(parseDuration(undefined)).toBeNull();
    expect(parseDuration(30)).toBeNull();
    expect(parseDuration(null)).toBeNull();
  });
});
