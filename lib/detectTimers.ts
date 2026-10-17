// Step text → timer suggestions.
// Finds explicit durations ("10 minutes", "1 hour 15 mins", "1½ hours",
// "10–12 minutes", "an hour") and ignores vague ones ("a few minutes",
// "overnight"). Each match carries its position so the UI can render the
// phrase itself as a tappable chip.

export interface TimerSuggestion {
  /** The matched phrase, exactly as written in the step. */
  label: string;
  /** Duration to start the timer with (the lower bound of a range). */
  seconds: number;
  /** Upper bound when the step gives a range ("10–12 minutes"), else null. */
  maxSeconds: number | null;
  /** Position of the phrase in the step text. */
  index: number;
  length: number;
}

const FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const UNITS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  ninety: 90,
};

const FRAC_CHARS = "½⅓⅔¼¾⅛⅜⅝⅞";
const WORD_NUM =
  "(?:twenty|thirty|forty|fifty)(?:[-\\s](?:one|two|three|four|five|six|seven|eight|nine))?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|ninety";
// Order matters: longer, more specific forms first.
const NUM = [
  `\\d+\\s+and\\s+a\\s+half`,
  `\\d+\\s+\\d+\\/\\d+`,
  `\\d+\\s*[${FRAC_CHARS}]`,
  `\\d+\\/\\d+`,
  `\\d+(?:\\.\\d+)?`,
  `[${FRAC_CHARS}]`,
  `half\\s+an?`,
  WORD_NUM,
  `an?`,
].join("|");

const HOUR = "hours?|hrs?|h";
const MIN = "minutes?|mins?";
const SEC = "seconds?|secs?";
const UNIT = `${HOUR}|${MIN}|${SEC}`;
const RANGE_SEP = "\\s*(?:-|–|—|to)\\s*";

// Groups: 1 number, 2 range upper bound, 3 unit, 4 compound number,
// 5 compound unit ("1 hour 15 minutes"), 6 "and a half".
const TIMER_RE = new RegExp(
  `(?<![\\w./])(${NUM})(?:${RANGE_SEP}(${NUM}))?[\\s-]*(${UNIT})\\b` +
    `(?:\\s*(?:and\\s+)?(${NUM})[\\s-]*(${MIN}|${SEC})\\b)?` +
    `(\\s+and\\s+a\\s+half)?`,
  "gi",
);

function parseNumber(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");

  let m = /^(\d+) and a half$/.exec(s);
  if (m) return Number(m[1]) + 0.5;
  m = /^(\d+) (\d+)\/(\d+)$/.exec(s);
  if (m)
    return Number(m[3]) ? Number(m[1]) + Number(m[2]) / Number(m[3]) : null;
  m = new RegExp(`^(\\d+) ?([${FRAC_CHARS}])$`).exec(s);
  if (m) return Number(m[1]) + FRACTIONS[m[2]];
  m = /^(\d+)\/(\d+)$/.exec(s);
  if (m) return Number(m[2]) ? Number(m[1]) / Number(m[2]) : null;
  if (/^\d+(?:\.\d+)?$/.test(s)) return Number(s);
  if (s in FRACTIONS) return FRACTIONS[s];
  if (/^half an?$/.test(s)) return 0.5;
  if (s === "a" || s === "an") return 1;

  m = /^(\w+)(?:[- ](\w+))?$/.exec(s);
  if (m && m[1] in UNITS) {
    if (m[2] === undefined) return UNITS[m[1]];
    if (m[2] in UNITS && UNITS[m[2]] < 10) return UNITS[m[1]] + UNITS[m[2]];
  }
  return null;
}

function unitSeconds(unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith("h")) return 3600;
  if (u.startsWith("m")) return 60;
  return 1;
}

const MAX_SECONDS = 24 * 3600;

export function detectTimers(text: string): TimerSuggestion[] {
  const results: TimerSuggestion[] = [];
  const re = new RegExp(TIMER_RE.source, TIMER_RE.flags);

  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    let [label] = match;
    const [, first, second, unit, extraNum, extraUnit, andAHalf] = match;
    const scale = unitSeconds(unit);

    // "a"/"an" only count before a singular unit ("an hour", not "a hours").
    const isArticle = /^an?$/i.test(first.trim());
    if (isArticle && /s$/i.test(unit)) continue;
    // "h" alone is only a unit straight after digits ("2h"), never after words.
    if (unit.toLowerCase() === "h" && !/\d\s*$/.test(second ?? first)) continue;

    const low = parseNumber(first);
    const high = second !== undefined ? parseNumber(second) : null;
    if (low === null || (second !== undefined && high === null)) continue;

    let extra = 0;
    let half = andAHalf ? 0.5 * scale : 0;
    if (extraNum !== undefined && extraUnit !== undefined) {
      const extraScale = unitSeconds(extraUnit);
      const n = parseNumber(extraNum);
      if (n !== null && extraScale < scale) {
        extra = n * extraScale;
      } else {
        // Not a compound ("5 minutes 2 minutes"): keep only the first
        // duration and rescan from just after its unit.
        const unitEnd =
          label.toLowerCase().indexOf(unit.toLowerCase()) + unit.length;
        label = label.slice(0, unitEnd);
        half = 0;
        re.lastIndex = match.index + unitEnd;
      }
    }

    const seconds = Math.round(low * scale + extra + half);
    const maxSeconds =
      high !== null ? Math.round(high * scale + extra + half) : null;
    if (seconds <= 0 || seconds > MAX_SECONDS) continue;
    if (maxSeconds !== null && maxSeconds <= seconds) continue;

    results.push({
      label,
      seconds,
      maxSeconds,
      index: match.index,
      length: label.length,
    });
  }
  return results;
}
