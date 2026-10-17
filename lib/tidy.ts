// Cook-time clean-up of ingredient and step text.
// Sites' own data often carries noise that's useful on a blog but distracting
// at the stove: per-ingredient prices, "(Note 3)" pointers to notes we don't
// show, and recipe-plugin markup like "((…))" or "(, finely chopped)". Each
// rule is narrow so real content is never removed.

// "($6.25)", "(£1.20)", "(80p)", "(€2)"
const PRICE_RE =
  /\s*\(\s*(?:[$£€]\s?\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s?(?:p|€))\s*\)/gi;
// "(Note 1)", "(see note 4)", "(Notes 2a)"
const NOTE_REF_RE = /\s*\(\s*(?:see\s+)?notes?\s*\d+[a-z]?\s*\)/gi;
const EMPTY_PARENS_RE = /\s*\(\s*\)/g;
const DOUBLE_PARENS_RE = /\(\s*\(([^()]*)\)\s*\)/g;
// "(, sliced 6mm)" → ", sliced 6mm", allowing one level of nested parens inside.
const COMMA_PARENS_RE = /\s*\(\s*,\s*((?:[^()]|\([^()]*\))*?)\s*\)/g;

function tidySpacing(text: string): string {
  return text
    .replace(/\(\s+/g, "(")
    .replace(/\s+([,)])/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function tidyIngredient(line: string): string {
  let s = line
    .replace(PRICE_RE, "")
    .replace(NOTE_REF_RE, "")
    .replace(EMPTY_PARENS_RE, "");
  let previous;
  do {
    previous = s;
    s = s.replace(DOUBLE_PARENS_RE, "($1)");
  } while (s !== previous);
  s = s.replace(COMMA_PARENS_RE, (_, inner: string) =>
    inner ? `, ${inner}` : "",
  );
  return tidySpacing(s.replace(EMPTY_PARENS_RE, ""));
}

export function tidyStep(text: string): string {
  return tidySpacing(
    text.replace(NOTE_REF_RE, "").replace(EMPTY_PARENS_RE, ""),
  );
}

// Section names recipe plugins use for a condensed duplicate of the method.
// Cooking from it as well as the full method would mean doing everything twice.
const SUMMARY_SECTION_RE =
  /\b(?:abbreviated|summary|summari[sz]ed|condensed|at a glance|tl;?dr|short version|quick version)\b/i;

export function isSummarySection(name: string | null): boolean {
  return name !== null && SUMMARY_SECTION_RE.test(name);
}
