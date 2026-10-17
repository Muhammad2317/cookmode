// ISO 8601 duration → whole minutes.
// Recipes only ever use days and smaller, so years/months are rejected rather
// than guessed at. Decimal parts ("PT1.5H") are accepted because real sites emit them.

const DURATION_RE =
  /^P(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

export function parseDuration(input: unknown): number | null {
  if (typeof input !== "string") return null;
  const value = input.trim().toUpperCase();
  if (value === "P" || value === "PT" || value.endsWith("T")) return null;

  const match = DURATION_RE.exec(value);
  if (!match) return null;

  const [, weeks, days, hours, minutes, seconds] = match.map((part) =>
    part === undefined ? 0 : Number(part),
  ) as number[];

  const total =
    weeks * 7 * 24 * 60 + days * 24 * 60 + hours * 60 + minutes + seconds / 60;
  return Math.round(total);
}
