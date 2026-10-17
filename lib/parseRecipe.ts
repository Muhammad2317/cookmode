// JSON-LD → normalised Recipe.
// Handles the shapes seen in the wild: Recipe at the top level, inside an
// array, inside @graph, nested under mainEntity, @type as an array, and
// Yoast-style `{ "@id": ... }` references to Person/ImageObject nodes.

import { parseDuration } from "./parseDuration";
import { parseJsonLoose } from "./parseJsonLoose";
import { cleanText, htmlToText } from "./text";
import type { Recipe, RecipeStep, RecipeYield } from "./types";

export interface ParseRecipeInput {
  /** Raw contents of every `<script type="application/ld+json">` block on the page. */
  jsonLd: string[];
  /** Final URL the page was fetched from (after redirects). */
  pageUrl: string;
  /** Optional page metadata used as fallbacks. */
  meta?: {
    siteName?: string | null;
    canonicalUrl?: string | null;
    image?: string | null;
    author?: string | null;
  };
}

type Node = Record<string, unknown>;

// Upper bound on nodes visited, so a pathological page can't burn the
// Worker's CPU budget.
const MAX_NODES = 5000;

const isObject = (value: unknown): value is Node =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toArray = (value: unknown): unknown[] =>
  value === undefined || value === null
    ? []
    : Array.isArray(value)
      ? value
      : [value];

function typeNames(node: Node): string[] {
  return toArray(node["@type"])
    .filter((t): t is string => typeof t === "string")
    .map((t) =>
      t.replace(/^(?:https?:\/\/schema\.org\/|schema:)/i, "").toLowerCase(),
    );
}

const hasType = (node: Node, type: string) => typeNames(node).includes(type);

interface Graph {
  recipes: Node[];
  byId: Map<string, Node>;
}

/** Breadth-first walk of every parsed block, collecting Recipe nodes and an @id index. */
function walk(roots: unknown[]): Graph {
  const recipes: Node[] = [];
  const byId = new Map<string, Node>();
  const queue: unknown[] = [...roots];

  for (let head = 0; head < queue.length && head < MAX_NODES; head++) {
    const value = queue[head];

    if (Array.isArray(value)) {
      queue.push(...value);
      continue;
    }
    if (!isObject(value)) continue;

    const id = value["@id"];
    // Index only "real" nodes, not bare references, so a reference never
    // shadows the full node it points to.
    if (
      typeof id === "string" &&
      Object.keys(value).length > 1 &&
      !byId.has(id)
    ) {
      byId.set(id, value);
    }
    if (hasType(value, "recipe")) recipes.push(value);

    for (const child of Object.values(value)) {
      if (typeof child === "object" && child !== null) queue.push(child);
    }
  }
  return { recipes, byId };
}

function resolver(byId: Map<string, Node>) {
  return (value: unknown): unknown => {
    if (
      isObject(value) &&
      typeof value["@id"] === "string" &&
      Object.keys(value).length === 1
    ) {
      return byId.get(value["@id"]) ?? value;
    }
    return value;
  };
}

type Resolve = ReturnType<typeof resolver>;

/** Prefer the Recipe node that actually has content; some pages include stubs. */
function pickRecipe(recipes: Node[]): Node | undefined {
  return (
    recipes.find(
      (r) =>
        r.recipeInstructions !== undefined && r.recipeIngredient !== undefined,
    ) ??
    recipes.find(
      (r) =>
        r.recipeInstructions !== undefined || r.recipeIngredient !== undefined,
    ) ??
    recipes[0]
  );
}

// ---------------------------------------------------------------------------
// Field normalisers

function absoluteHttpUrl(value: unknown, base: string): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(cleanText(value), base);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function normaliseAuthors(value: unknown, resolve: Resolve): string[] {
  const names: string[] = [];
  for (const item of toArray(value)) {
    const node = resolve(item);
    let name = "";
    if (typeof node === "string") name = cleanText(node);
    else if (isObject(node)) {
      const rawName = Array.isArray(node.name) ? node.name[0] : node.name;
      name = cleanText(rawName);
    }
    name = name.replace(/^by\s+/i, "").trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

function normaliseImage(
  value: unknown,
  resolve: Resolve,
  base: string,
): string | null {
  let best: { url: string; area: number } | null = null;

  for (const item of toArray(value)) {
    const node = resolve(item);
    let url: string | null = null;
    let area = 0;
    if (typeof node === "string") {
      url = absoluteHttpUrl(node, base);
    } else if (isObject(node)) {
      url =
        absoluteHttpUrl(node.url, base) ??
        absoluteHttpUrl(node.contentUrl, base);
      const width = Number(node.width);
      const height = Number(node.height);
      if (width > 0 && height > 0) area = width * height;
      else if (width > 0) area = width * width;
    }
    // First image wins unless a later one is known to be larger.
    if (url && (!best || area > best.area)) best = { url, area };
  }
  return best?.url ?? null;
}

// Some CMSs serialise whole numbers as floats ("Serves 2.0", "5.0tbsp").
const tidyNumbers = (text: string) => text.replace(/(\d)\.0+(?!\d)/g, "$1");

const firstNumber = (text: string): number | null => {
  const match = /\d+(?:\.\d+)?/.exec(text);
  return match && Number(match[0]) > 0 ? Number(match[0]) : null;
};

function normaliseYield(value: unknown): RecipeYield | null {
  const candidates = toArray(value)
    .map((v) => tidyNumbers(typeof v === "number" ? String(v) : cleanText(v)))
    .filter(Boolean);
  if (candidates.length === 0) return null;

  const count =
    candidates.map(firstNumber).find((n): n is number => n !== null) ?? null;

  // Prefer a descriptive label ("4 servings") over a bare number ("4"), but
  // only one that agrees with the count: ["8", "1 (9x5-inch) loaf"] must not
  // label 8 servings as "1 loaf".
  const descriptive = candidates.find(
    (c) => /[a-z]/i.test(c) && (count === null || firstNumber(c) === count),
  );
  const bare =
    count === null
      ? candidates[0]
      : (candidates.find((c) => firstNumber(c) === count) ?? String(count));
  const label =
    descriptive ?? `${bare} ${bare === "1" ? "serving" : "servings"}`;
  return { count, label };
}

function normaliseIngredients(value: unknown): string[] {
  const lines: string[] = [];
  for (const item of toArray(value)) {
    const raw = isObject(item) ? (item.text ?? item.name) : item;
    if (typeof raw !== "string") continue;
    for (const line of htmlToText(raw).split("\n")) {
      const text = tidyNumbers(cleanText(line));
      if (text) lines.push(text);
    }
  }
  return lines;
}

// "1. Preheat", "2) Mix", "Step 3: Bake" — but not "1.5 kg" or "1-2 minutes".
const STEP_NUMBER_RE = /^(?:step\s*)?\d{1,2}\s*[.):](?!\d)\s*/i;
const BARE_STEP_LABEL_RE = /^step\s*\d{1,2}\s*:?$/i;

/** Split a free-text instruction block into individual steps. */
function splitInstructionText(raw: string): string[] {
  const html = raw.includes("<li") ? raw.split(/<li\b[^>]*>/i).slice(1) : [raw];
  const lines = html.flatMap((chunk) => htmlToText(chunk).split("\n"));
  return lines
    .map((line) => cleanText(line).replace(STEP_NUMBER_RE, "").trim())
    .filter((line) => line && !BARE_STEP_LABEL_RE.test(line));
}

function collectSteps(
  value: unknown,
  section: string | null,
  resolve: Resolve,
  out: RecipeStep[],
  depth = 0,
): void {
  if (depth > 6) return;

  for (const item of toArray(value)) {
    const node = resolve(item);

    if (typeof node === "string") {
      for (const text of splitInstructionText(node))
        out.push({ text, section });
      continue;
    }
    if (!isObject(node)) continue;
    if (hasType(node, "howtotip")) continue;

    const text = typeof node.text === "string" ? node.text : undefined;
    const children = node.itemListElement;
    const isSection =
      hasType(node, "howtosection") ||
      hasType(node, "itemlist") ||
      (children !== undefined && text === undefined);

    if (isSection) {
      const name = cleanText(node.name);
      collectSteps(children, name || section, resolve, out, depth + 1);
      continue;
    }

    // HowToStep / HowToDirection. Fall back to the name when text is missing,
    // and to nested directions when neither is present.
    const body =
      text ?? (typeof node.name === "string" ? node.name : undefined);
    if (body !== undefined) {
      for (const stepText of splitInstructionText(body))
        out.push({ text: stepText, section });
    } else if (children !== undefined) {
      collectSteps(children, section, resolve, out, depth + 1);
    }
  }
}

function normaliseSteps(value: unknown, resolve: Resolve): RecipeStep[] {
  const steps: RecipeStep[] = [];
  collectSteps(value, null, resolve, steps);
  return steps;
}

function minutes(value: unknown): number | null {
  const m = parseDuration(value);
  return m !== null && m > 0 ? m : null;
}

function hostnameLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------

/** Parse the page's JSON-LD into a Recipe, or null if no usable Recipe node exists. */
export function parseRecipe(input: ParseRecipeInput): Recipe | null {
  const parsed = input.jsonLd
    .map(parseJsonLoose)
    .filter((v) => v !== undefined);
  const { recipes, byId } = walk(parsed);
  const node = pickRecipe(recipes);
  if (!node) return null;

  const resolve = resolver(byId);
  const meta = input.meta ?? {};
  const base = input.pageUrl;

  const ingredients = normaliseIngredients(
    node.recipeIngredient ?? node.ingredients,
  );
  const steps = normaliseSteps(node.recipeInstructions, resolve);
  if (ingredients.length === 0 && steps.length === 0) return null;

  let authors = normaliseAuthors(node.author, resolve);
  if (authors.length === 0) authors = normaliseAuthors(node.creator, resolve);
  if (authors.length === 0 && meta.author)
    authors = normaliseAuthors(meta.author, resolve);

  const prepTime = minutes(node.prepTime);
  const cookTime = minutes(node.cookTime);
  const totalTime =
    minutes(node.totalTime) ??
    (prepTime !== null && cookTime !== null ? prepTime + cookTime : null);

  return {
    title:
      cleanText(node.name) || cleanText(node.headline) || "Untitled recipe",
    description: cleanText(node.description) || null,
    authors,
    siteName: cleanText(meta.siteName) || hostnameLabel(base),
    sourceUrl: absoluteHttpUrl(meta.canonicalUrl, base) ?? base,
    image:
      normaliseImage(node.image, resolve, base) ??
      absoluteHttpUrl(meta.image, base),
    yield: normaliseYield(node.recipeYield ?? node.yield),
    prepTime,
    cookTime,
    totalTime,
    ingredients,
    steps,
  };
}
