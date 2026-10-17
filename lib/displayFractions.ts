// The app typeface has glyphs for ½ ¼ ¾ but not ⅓ ⅔ ⅛ ⅜ ⅝ ⅞, which would
// otherwise render in a mismatched fallback font. For display, rewrite those
// as plain fractions: "1⅓ cups" → "1 1/3 cups". ½ ¼ ¾ stay as single glyphs,
// which read better at a distance.

const MISSING: Record<string, string> = {
  "⅓": "1/3",
  "⅔": "2/3",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

const MISSING_RE = /(\d)?([⅓⅔⅛⅜⅝⅞])/g;

export function displayFractions(text: string): string {
  return text.replace(MISSING_RE, (_, whole: string | undefined, glyph: string) =>
    whole ? `${whole} ${MISSING[glyph]}` : MISSING[glyph],
  );
}
