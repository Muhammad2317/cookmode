import { describe, expect, it } from "vitest";
import { displayFractions } from "./displayFractions";

describe("displayFractions", () => {
  it.each([
    ["⅓ cup oil", "1/3 cup oil"],
    ["1⅓ cups flour", "1 1/3 cups flour"],
    ["2⅔ tbsp", "2 2/3 tbsp"],
    ["⅛ tsp salt", "1/8 tsp salt"],
    ["1–1⅓ cups", "1–1 1/3 cups"],
  ])("%s → %s", (input, expected) => {
    expect(displayFractions(input)).toBe(expected);
  });

  it.each([["1½ cups"], ["¾ tsp"], ["¼ onion"], ["400g flour"], ["a pinch of salt"]])("keeps %s", (input) => {
    expect(displayFractions(input)).toBe(input);
  });
});
