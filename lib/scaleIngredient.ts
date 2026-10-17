// Scale the leading quantity of an ingredient line.
// "1 1/2 cups flour" × 2 → "3 cups flour"; "1 x 400g tin" × 2 → "2 x 400g tin".
// Metric weights/volumes get sensibly rounded decimals; everything else
// (cups, spoons, counts, imperial) gets friendly fractions. Anything without
// a leading number ("a pinch of salt") is returned untouched.

const FRACTIONS: Record<string, number> = {
  "½": 1 / 2,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 1 / 4,
  "¾": 3 / 4,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};
const FRAC_CHARS = Object.keys(FRACTIONS).join("");

// Fractions we're happy to show in output, as [value, glyph].
const FRIENDLY: [number, string][] = [
  [0, ""],
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [1 / 2, "½"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [1, ""],
];

const QTY = `\\d+\\s+\\d+\\/\\d+|\\d+\\s*[${FRAC_CHARS}]|\\d+\\/\\d+|\\d+(?:\\.\\d+)?|[${FRAC_CHARS}]`;
const RANGE_SEP = `\\s*(?:-|–|—|to)\\s*`;
const LEADING_RE = new RegExp(
  `^(\\s*(?:about|approx\\.?|approximately|roughly)?\\s*)(${QTY})(?:(${RANGE_SEP})(${QTY}))?`,
  "i",
);

// Units whose quantities read best as rounded decimals.
const METRIC_RE =
  /^\s*(kg|g|grams?|kilograms?|mg|ml|millilitres?|milliliters?|cl|dl|l|litres?|liters?)\b/i;
const LARGE_METRIC = /^(kg|kilograms?|l|litres?|liters?)$/i;
// Any recognised unit word, used to decide whether a trailing "/7oz" or
// "(250ml)" is an equivalent measure worth scaling too.
const UNIT_WORD =
  "kg|g|grams?|kilograms?|mg|ml|millilitres?|milliliters?|cl|dl|l|litres?|liters?|oz|ounces?|lbs?|pounds?|fl\\.?\\s?oz|cups?|tbsp|tsp|tablespoons?|teaspoons?";
const LEADING_UNIT_RE = new RegExp(`^\\s*(${UNIT_WORD})\\b\\.?`, "i");
const EQUIVALENT_RE = new RegExp(
  `^(\\s*(?:\\/|\\(|\\/\\s*\\()\\s*)(${QTY})(\\s*(${UNIT_WORD})\\b)`,
  "i",
);

// Countable unit words that should agree in number with the new quantity.
const PLURALISABLE =
  /^(\s*)(cup|tablespoon|teaspoon|pound|ounce|clove|tin|can|slice|stick|sprig|handful|litre|liter|pinch|bunch)(es|s)?\b/i;

function parseQty(raw: string): number | null {
  const s = raw.replace(/\s+/g, " ").trim();
  let m = /^(\d+) (\d+)\/(\d+)$/.exec(s);
  if (m)
    return Number(m[3]) ? Number(m[1]) + Number(m[2]) / Number(m[3]) : null;
  m = new RegExp(`^(\\d+) ?([${FRAC_CHARS}])$`).exec(s);
  if (m) return Number(m[1]) + FRACTIONS[m[2]];
  m = /^(\d+)\/(\d+)$/.exec(s);
  if (m) return Number(m[2]) ? Number(m[1]) / Number(m[2]) : null;
  if (s in FRACTIONS) return FRACTIONS[s];
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function trimDecimal(n: number, places: number): string {
  return String(Number(n.toFixed(places)));
}

/** Rounded decimal for metric quantities: 7.5 g, 45 g, 375 g, 1250 g, 1.25 kg. */
export function formatMetric(value: number, large = false): string {
  if (large) return trimDecimal(value, value < 10 ? 2 : 1);
  if (value < 10) return trimDecimal(value, 1);
  if (value < 100) return String(Math.round(value));
  if (value < 1000) return String(Math.round(value / 5) * 5);
  return String(Math.round(value / 10) * 10);
}

/** Friendly fraction for cups/spoons/counts: 1½, ⅔, 3¼. */
export function formatFraction(value: number): string {
  if (value >= 20) return String(Math.round(value));
  let whole = Math.floor(value);
  const remainder = value - whole;

  let best = FRIENDLY[0];
  for (const candidate of FRIENDLY) {
    if (Math.abs(candidate[0] - remainder) < Math.abs(best[0] - remainder))
      best = candidate;
  }
  if (best[0] === 1) whole += 1;
  // Never round a real quantity down to nothing.
  if (whole === 0 && best[1] === "") return "⅛";
  return whole === 0 ? best[1] : `${whole}${best[1]}`;
}

export function scaleIngredient(line: string, factor: number): string {
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return line;

  const normalised = line.replace(/⁄/g, "/");
  const lead = LEADING_RE.exec(normalised);
  if (!lead) return line;

  const [whole, prefix, firstRaw, sep, secondRaw] = lead;
  const first = parseQty(firstRaw);
  const second = secondRaw !== undefined ? parseQty(secondRaw) : null;
  if (first === null || (secondRaw !== undefined && second === null))
    return line;

  let rest = normalised.slice(whole.length);
  const metric = METRIC_RE.exec(rest);
  const format = (n: number) =>
    metric ? formatMetric(n, LARGE_METRIC.test(metric[1])) : formatFraction(n);

  const scaledFirst = first * factor;
  let quantity = format(scaledFirst);
  if (second !== null) quantity += sep + format(second * factor);

  // Keep a space before word units ("1 cup"), but not where the original had
  // none ("400g").
  const leadingUnit = LEADING_UNIT_RE.exec(rest);
  if (leadingUnit) {
    // Scale an immediately following equivalent measure too:
    // "200g/7oz", "1 cup (250ml)".
    const afterUnit = rest.slice(leadingUnit[0].length);
    const equivalent = EQUIVALENT_RE.exec(afterUnit);
    if (equivalent) {
      const value = parseQty(equivalent[2]);
      if (value !== null) {
        const isMetric = METRIC_RE.test(equivalent[3]);
        const formatted = isMetric
          ? formatMetric(value * factor, LARGE_METRIC.test(equivalent[4]))
          : formatFraction(value * factor);
        rest =
          leadingUnit[0] +
          equivalent[1] +
          formatted +
          equivalent[3] +
          afterUnit.slice(equivalent[0].length);
      }
    }
  }

  // Agree the unit's number with the new quantity: "1 cup" → "2 cups".
  const plural = PLURALISABLE.exec(rest);
  if (plural) {
    const upper = second !== null ? second * factor : scaledFirst;
    const word = plural[2];
    const suffix = /(?:ch|sh|x|s)$/i.test(word) ? "es" : "s";
    rest =
      plural[1] +
      word +
      (upper > 1 ? suffix : "") +
      rest.slice(plural[0].length);
  }

  return prefix + quantity + rest;
}
