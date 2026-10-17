// Small text utilities for cleaning strings that come out of JSON-LD and HTML.
// Deliberately regex-based: we never need a DOM, only "readable plain text".

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  sbquo: "‚",
  ldquo: "“",
  rdquo: "”",
  bdquo: "„",
  laquo: "«",
  raquo: "»",
  bull: "•",
  middot: "·",
  deg: "°",
  times: "×",
  divide: "÷",
  frac12: "½",
  frac13: "⅓",
  frac23: "⅔",
  frac14: "¼",
  frac34: "¾",
  frac18: "⅛",
  frac38: "⅜",
  frac58: "⅝",
  frac78: "⅞",
  copy: "©",
  reg: "®",
  trade: "™",
  pound: "£",
  euro: "€",
  cent: "¢",
  eacute: "é",
  egrave: "è",
  ecirc: "ê",
  euml: "ë",
  aacute: "á",
  agrave: "à",
  acirc: "â",
  auml: "ä",
  atilde: "ã",
  aring: "å",
  iacute: "í",
  igrave: "ì",
  icirc: "î",
  iuml: "ï",
  oacute: "ó",
  ograve: "ò",
  ocirc: "ô",
  ouml: "ö",
  otilde: "õ",
  oslash: "ø",
  uacute: "ú",
  ugrave: "ù",
  ucirc: "û",
  uuml: "ü",
  ntilde: "ñ",
  ccedil: "ç",
  szlig: "ß",
  aelig: "æ",
  oelig: "œ",
  Eacute: "É",
  Agrave: "À",
  Ccedil: "Ç",
};

const ENTITY_RE = /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi;

function decodeOnce(input: string): string {
  return input.replace(ENTITY_RE, (match, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      return String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[body] ?? NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

/** Decode HTML entities. Runs twice to handle the common double-encoding (`&amp;frac12;`). */
export function decodeEntities(input: string): string {
  if (!input.includes("&")) return input;
  return decodeOnce(decodeOnce(input));
}

// Only treat `<` as a tag when followed by a letter, `/` or `!`, so text like
// "cook for < 5 minutes" survives.
const TAG_RE = /<\/?[a-z!][^<>]*>/gi;
const BLOCK_BREAK_RE = /<(?:br\s*\/?|\/(?:p|div|li|h[1-6]|tr)\s*)>/gi;

/**
 * Turn an HTML-ish string into plain text, keeping line breaks for block
 * elements. Entities are decoded before stripping so entity-encoded markup
 * (`&lt;p&gt;`) is removed too.
 */
export function htmlToText(input: string): string {
  let s = decodeEntities(input);
  s = s.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "");
  s = s.replace(BLOCK_BREAK_RE, "\n");
  s = s.replace(TAG_RE, "");
  s = decodeEntities(s);
  return s
    .split(/\r?\n/)
    .map((line) => line.replace(/[\s ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** Plain text on a single line: tags stripped, entities decoded, whitespace collapsed. */
export function cleanText(input: unknown): string {
  if (typeof input !== "string") return "";
  return htmlToText(input).replace(/\s+/g, " ").trim();
}
