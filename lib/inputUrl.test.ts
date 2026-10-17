import { describe, expect, it } from "vitest";
import { extractUrl } from "./inputUrl";

describe("extractUrl", () => {
  it.each([
    [
      "https://www.bbcgoodfood.com/recipes/easy-pancakes",
      "https://www.bbcgoodfood.com/recipes/easy-pancakes",
    ],
    ["  https://example.com/a  ", "https://example.com/a"],
    [
      "Try this! https://example.com/r/1?x=2 so good",
      "https://example.com/r/1?x=2",
    ],
    ["(https://example.com/recipe).", "https://example.com/recipe"],
    [
      "bbcgoodfood.com/recipes/easy-pancakes",
      "https://bbcgoodfood.com/recipes/easy-pancakes",
    ],
    ["www.example.co.uk/pie", "https://www.example.co.uk/pie"],
    ["http://example.com", "http://example.com"],
  ])("%j → %s", (input, expected) => {
    expect(extractUrl(input)).toBe(expected);
  });

  it.each([
    [""],
    ["   "],
    ["lemon pasta"],
    ["not a url at all"],
    ["localhost"],
  ])("returns null for %j", (input) => {
    expect(extractUrl(input)).toBeNull();
  });
});
