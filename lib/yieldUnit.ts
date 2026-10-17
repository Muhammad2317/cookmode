// The noun the servings stepper should use, taken from the recipe's own yield
// label: "12 cookies" → "cookies", "4 people" → "people", "Serves 4" →
// "servings". Falls back to "servings" whenever the label has no clear noun.

const SKIP = new Set(["to", "or", "x", "about", "approx", "approximately"]);

export function yieldUnit(label: string, count: number | null): string {
  if (count === null) return "servings";
  const words = label
    .toLowerCase()
    .split(/[\s,()]+/)
    .filter(Boolean);
  const at = words.findIndex((w) => parseFloat(w) === count);
  if (at === -1) return "servings";
  // Skip ranges like "4-6" / "4 to 6" to reach the noun.
  let i = at + 1;
  while (
    i < words.length &&
    (SKIP.has(words[i]) || /^[\d.\-–]+$/.test(words[i]))
  )
    i++;
  const noun = words[i];
  if (!noun || !/^[a-z]+$/.test(noun) || noun === "serves" || noun === "makes")
    return "servings";
  return noun;
}
