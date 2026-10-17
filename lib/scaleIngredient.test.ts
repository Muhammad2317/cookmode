import { describe, expect, it } from "vitest";
import {
  formatFraction,
  formatMetric,
  scaleIngredient,
} from "./scaleIngredient";

describe("scaleIngredient", () => {
  it.each([
    // integers and counts
    ["2 eggs", 2, "4 eggs"],
    ["3 eggs", 0.5, "1½ eggs"],
    // decimals
    ["1.5 cups milk", 2, "3 cups milk"],
    ["0.5 tsp salt", 3, "1½ tsp salt"],
    // unicode fractions
    ["½ tsp chilli flakes", 2, "1 tsp chilli flakes"],
    ["¾ cup sugar", 2, "1½ cups sugar"],
    ["1½ cups flour", 2, "3 cups flour"],
    ["⅓ cup oil", 3, "1 cup oil"],
    // ascii fractions and mixed numbers
    ["1/2 cup cream", 3, "1½ cups cream"],
    ["1 1/2 cups flour", 2, "3 cups flour"],
    ["2 1/4 tsp yeast", 0.5, "1⅛ tsp yeast"],
    // ranges
    ["2-3 cloves garlic", 2, "4-6 cloves garlic"],
    ["2–3 tbsp olive oil", 0.5, "1–1½ tbsp olive oil"],
    ["4 to 6 chicken thighs", 1.5, "6 to 9 chicken thighs"],
    // "1 x 400g tin": scale the count, never the pack size
    ["1 x 400g tin chopped tomatoes", 2, "2 x 400g tin chopped tomatoes"],
    ["2 x 400g cans chickpeas", 1.5, "3 x 400g cans chickpeas"],
    // metric rounding
    ["400g plain flour", 1.5, "600g plain flour"],
    ["250 ml stock", 1.5, "375 ml stock"],
    ["125g butter", 1.5, "190g butter"],
    ["15g parmesan", 1.5, "23g parmesan"],
    ["5g salt", 1.5, "7.5g salt"],
    ["1kg potatoes", 1.25, "1.25kg potatoes"],
    ["1.5 litres water", 2, "3 litres water"],
    ["800g chicken", 2, "1600g chicken"],
    // equivalent measures right after the unit
    ["200g/7oz plain flour", 2, "400g/14oz plain flour"],
    ["1 cup (250ml) milk", 2, "2 cups (500ml) milk"],
    // unit agreement
    ["1 cup rice", 2, "2 cups rice"],
    ["2 cups rice", 0.5, "1 cup rice"],
    ["1 clove garlic", 3, "3 cloves garlic"],
    ["1 pinch saffron", 2, "2 pinches saffron"],
    // prefixes
    ["about 2 cups spinach", 2, "about 4 cups spinach"],
    // fraction slash
    ["1⁄2 tsp cumin", 2, "1 tsp cumin"],
  ])("%s × %d → %s", (line, factor, expected) => {
    expect(scaleIngredient(line, factor)).toBe(expected);
  });

  it.each([
    ["a pinch of salt"],
    ["salt to taste"],
    ["Freshly ground black pepper"],
    ["Juice of half a lemon"],
    [""],
  ])("leaves %j untouched", (line) => {
    expect(scaleIngredient(line, 2)).toBe(line);
  });

  it("does not scale a parenthesised pack size after a count", () => {
    expect(scaleIngredient("1 (14-ounce) can coconut milk", 2)).toBe(
      "2 (14-ounce) can coconut milk",
    );
  });

  it("returns the line unchanged for factor 1 or invalid factors", () => {
    expect(scaleIngredient("1 1/2 cups flour", 1)).toBe("1 1/2 cups flour");
    expect(scaleIngredient("2 eggs", 0)).toBe("2 eggs");
    expect(scaleIngredient("2 eggs", Number.NaN)).toBe("2 eggs");
  });
});

describe("formatFraction", () => {
  it.each([
    [0.5, "½"],
    [1.33, "1⅓"],
    [2.66, "2⅔"],
    [1.125, "1⅛"],
    [0.97, "1"],
    [0.02, "⅛"],
    [3, "3"],
    [24.4, "24"],
  ])("%d → %s", (value, expected) => {
    expect(formatFraction(value)).toBe(expected);
  });
});

describe("formatMetric", () => {
  it.each([
    [7.5, false, "7.5"],
    [7.25, false, "7.3"],
    [42.4, false, "42"],
    [187.5, false, "190"],
    [1234, false, "1230"],
    [1.25, true, "1.25"],
    [12.34, true, "12.3"],
  ])("%d (large: %s) → %s", (value, large, expected) => {
    expect(formatMetric(value, large)).toBe(expected);
  });
});
