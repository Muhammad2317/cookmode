import { describe, expect, it } from "vitest";
import { yieldUnit } from "./yieldUnit";

describe("yieldUnit", () => {
  it.each([
    ["Serves 4", 4, "servings"],
    ["4 servings", 4, "servings"],
    ["4 people", 4, "people"],
    ["Makes 12 cookies", 12, "cookies"],
    ["12 cookies", 12, "cookies"],
    ["2 dozen", 2, "dozen"],
    ["Serves 6-8", 6, "servings"],
    ["4 to 6 portions", 4, "portions"],
    ["Makes 12", 12, "servings"],
    ["1 (9x5-inch) loaf", 1, "servings"],
    ["One large loaf", null, "servings"],
  ] as const)("%j → %s", (label, count, expected) => {
    expect(yieldUnit(label, count)).toBe(expected);
  });
});
