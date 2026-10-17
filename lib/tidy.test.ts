// Inputs mimic the *shapes* of recipe-plugin output seen in live testing
// (WP Recipe Maker notes/markup, per-ingredient cost annotations).

import { describe, expect, it } from "vitest";
import { isSummarySection, tidyIngredient, tidyStep } from "./tidy";

describe("tidyIngredient", () => {
  it.each([
    // prices
    ["1 lb. chicken breast ($6.25)", "1 lb. chicken breast"],
    ["2 Tbsp butter ($0.28)", "2 Tbsp butter"],
    ["1 onion (£0.40)", "1 onion"],
    ["1 lemon (80p)", "1 lemon"],
    // note references
    ["1/4 cup brandy ((Note 2))", "1/4 cup brandy"],
    [
      "4 chicken thighs, skin on ((~250g/8oz each) (Note 1))",
      "4 chicken thighs, skin on (~250g/8oz each)",
    ],
    ["1 cup stock (see note 4)", "1 cup stock"],
    // doubled parens
    [
      "3 tbsp plain flour ((all-purpose flour))",
      "3 tbsp plain flour (all-purpose flour)",
    ],
    // comma-parens
    ["400g mushrooms (, sliced 6mm)", "400g mushrooms, sliced 6mm"],
    [
      "2 1/2 cups beef stock (, low-sodium (note 4))",
      "2 1/2 cups beef stock, low-sodium",
    ],
    [
      "30g butter (, COLD and cubed (KEEP REFRIGERATED) )",
      "30g butter, COLD and cubed (KEEP REFRIGERATED)",
    ],
    [
      "1 tbsp tarragon (, finely chopped (Note 5))",
      "1 tbsp tarragon, finely chopped",
    ],
  ])("%s → %s", (input, expected) => {
    expect(tidyIngredient(input)).toBe(expected);
  });

  it.each([
    ["200g plain flour"],
    ["1 x 400g tin chopped tomatoes"],
    ["1 (14-ounce) can coconut milk"],
    ["2 eggs (large)"],
    ["Salt, to taste"],
    ["1 cup (250ml) milk"],
    ["3 oz. cream cheese*"],
    ["1 bunch spring onions (about 6)"],
  ])("leaves %j unchanged", (input) => {
    expect(tidyIngredient(input)).toBe(input);
  });
});

describe("tidyStep", () => {
  it("removes note references", () => {
    expect(tidyStep("Pour in the brandy (Note 2) and flambé.")).toBe(
      "Pour in the brandy and flambé.",
    );
  });

  it("keeps ordinary parentheses", () => {
    expect(tidyStep("Use a large (30cm) skillet.")).toBe(
      "Use a large (30cm) skillet.",
    );
  });
});

describe("isSummarySection", () => {
  it.each([
    ["Abbreviated Recipe"],
    ["Recipe summary"],
    ["Quick version"],
    ["At a glance"],
  ])("flags %s", (name) => expect(isSummarySection(name)).toBe(true));

  it.each([["For the sauce"], ["Chicken"], ["To serve"], [null]])(
    "keeps %s",
    (name) => expect(isSummarySection(name)).toBe(false),
  );
});
