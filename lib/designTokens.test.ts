import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { PALETTE, TEXT_PAIRS, type ThemeName } from "./designTokens";

const css = readFileSync(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);

/** Custom properties declared inside the first block whose selector matches. */
function declaredIn(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Selector not found: ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (; end < css.length; end++) {
    if (css[end] === "{") depth++;
    if (css[end] === "}" && --depth === 0) break;
  }
  const body = css.slice(open + 1, end);
  return Object.fromEntries(
    Array.from(body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,6})\s*;/gi), (m) => [
      m[1],
      m[2].toLowerCase(),
    ]),
  );
}

const blocks: [string, ThemeName][] = [
  [":root {", "light"],
  ["@media (prefers-color-scheme: dark)", "dark"],
  [".theme-light {", "light"],
  [".theme-dark {", "dark"],
];

describe("design tokens", () => {
  it.each(blocks)(
    "globals.css %s matches the %s palette",
    (selector, theme) => {
      expect(declaredIn(selector)).toEqual(PALETTE[theme]);
    },
  );

  it.each(["light", "dark"] as const)(
    "every text pair in %s mode is WCAG AAA",
    (theme) => {
      for (const [fg, bg] of TEXT_PAIRS) {
        const ratio = contrastRatio(PALETTE[theme][fg], PALETTE[theme][bg]);
        expect(ratio, `${fg} on ${bg}`).toBeGreaterThanOrEqual(7);
      }
    },
  );
});
