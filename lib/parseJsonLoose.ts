// Tolerant JSON parsing for real-world JSON-LD blocks.
// Sites ship trailing commas, raw newlines inside strings, invalid escapes
// (`\'`), HTML comment / CDATA wrappers and occasionally entity-encoded JSON.
// We try strict JSON.parse first and only repair when it fails.

function stripWrappers(raw: string): string {
  return raw
    .trim()
    .replace(/^(?:\/\/\s*)?<!\[CDATA\[/, "")
    .replace(/(?:\/\/\s*)?\]\]>$/, "")
    .replace(/^<!--/, "")
    .replace(/-->$/, "")
    .trim();
}

const VALID_ESCAPES = new Set(['"', "\\", "/", "b", "f", "n", "r", "t", "u"]);

/**
 * Single string-aware pass that fixes the common breakages:
 * control characters inside strings, invalid escapes, and trailing commas.
 */
function repair(input: string): string {
  let out = "";
  let inString = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inString) {
      if (ch === "\\") {
        const next = input[i + 1];
        if (next !== undefined && VALID_ESCAPES.has(next)) {
          out += ch + next;
        } else if (next !== undefined) {
          out += next === "\n" || next === "\r" ? " " : next;
        }
        i++;
      } else if (ch === '"') {
        inString = false;
        out += ch;
      } else if (ch === "\n" || ch === "\r" || ch === "\t") {
        out += " ";
      } else if (ch < " ") {
        // Other control characters are never meaningful in recipe text.
      } else {
        out += ch;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === ",") {
      let j = i + 1;
      while (j < input.length && /\s/.test(input[j])) j++;
      if (input[j] !== "}" && input[j] !== "]") out += ch;
    } else {
      out += ch;
    }
  }
  return out;
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

const ENTITY_JSON_RE = /&(?:quot|#34|#x22);/i;

export function parseJsonLoose(raw: string): unknown {
  const text = stripWrappers(raw);
  if (!text) return undefined;

  const strict = tryParse(text);
  if (strict !== undefined) return strict;

  const repaired = tryParse(repair(text));
  if (repaired !== undefined) return repaired;

  // Whole block entity-encoded (`{&quot;@type&quot;: ...}`): decode the
  // structural characters, then repair again.
  if (ENTITY_JSON_RE.test(text)) {
    const decoded = text
      .replace(/&(?:quot|#34|#x22);/gi, '"')
      .replace(/&(?:amp|#38);/gi, "&")
      .replace(/&(?:lt|#60);/gi, "<")
      .replace(/&(?:gt|#62);/gi, ">");
    return tryParse(repair(decoded));
  }

  return undefined;
}
