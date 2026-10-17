// Cloudflare Pages Function: GET /api/recipe?url=...
//
// Fetches a recipe page, pulls out its JSON-LD with plain string scanning
// (no DOM parser: the free tier's CPU budget is tight) and returns only the
// normalised recipe. Nothing is stored; successful responses get a short
// Cache-Control so repeat loads are cheap.

import { recipeError } from "../../lib/errors";
import { extractPage, looksLikeBotWall } from "../../lib/extractPage";
import { parseRecipe } from "../../lib/parseRecipe";
import type { RecipeErrorCode, RecipeResponse } from "../../lib/types";
import { validateUrl } from "../../lib/validateUrl";

const TIMEOUT_MS = 8_000;
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const USER_AGENT =
  "CookMode/0.1 (+https://cookmode.pages.dev; reads a single recipe on request and links back to the original)";

const ERROR_STATUS: Record<RecipeErrorCode, number> = {
  INVALID_URL: 400,
  FETCH_FAILED: 502,
  BLOCKED: 502,
  TIMEOUT: 504,
  NO_RECIPE_FOUND: 422,
  TOO_LARGE: 502,
};

class FetchError extends Error {
  constructor(readonly code: RecipeErrorCode) {
    super(code);
  }
}

function json(body: RecipeResponse, status: number, cache: string): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": cache,
      "X-Robots-Tag": "noindex",
    },
  });
}

const fail = (code: RecipeErrorCode) =>
  json({ ok: false, error: recipeError(code) }, ERROR_STATUS[code], "no-store");

/** Follow redirects by hand so every hop goes through the same URL safety check. */
async function fetchPage(
  start: URL,
  signal: AbortSignal,
): Promise<{ response: Response; url: URL }> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let response: Response;
    try {
      response = await fetch(url.href, {
        redirect: "manual",
        signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "Accept-Language": "en-GB,en;q=0.9",
        },
      });
    } catch {
      throw new FetchError(signal.aborted ? "TIMEOUT" : "FETCH_FAILED");
    }

    const location = response.headers.get("Location");
    if (response.status >= 300 && response.status < 400 && location) {
      const next = validateUrl(new URL(location, url).href);
      if (!next.ok) throw new FetchError("FETCH_FAILED");
      url = next.url;
      continue;
    }
    return { response, url };
  }
  throw new FetchError("FETCH_FAILED");
}

/** Read the body as text, bailing out as soon as it exceeds MAX_BYTES. */
async function readCapped(
  response: Response,
  signal: AbortSignal,
): Promise<string> {
  const declared = Number(response.headers.get("Content-Length"));
  if (declared > MAX_BYTES) throw new FetchError("TOO_LARGE");
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new FetchError("TOO_LARGE");
      }
      chunks.push(value);
    }
  } catch (err) {
    if (err instanceof FetchError) throw err;
    throw new FetchError(signal.aborted ? "TIMEOUT" : "FETCH_FAILED");
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const charset = /charset=["']?([\w-]+)/i.exec(
    response.headers.get("Content-Type") ?? "",
  )?.[1];
  try {
    return new TextDecoder(charset ?? "utf-8").decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

export const onRequestGet: PagesFunction = async (context) => {
  const target = validateUrl(
    new URL(context.request.url).searchParams.get("url"),
  );
  if (!target.ok) return fail("INVALID_URL");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const { response, url } = await fetchPage(target.url, controller.signal);

    if (
      response.status === 401 ||
      response.status === 403 ||
      response.status === 429
    ) {
      return fail("BLOCKED");
    }
    if (response.headers.get("cf-mitigated") === "challenge")
      return fail("BLOCKED");
    if (!response.ok) return fail("FETCH_FAILED");

    const type = response.headers.get("Content-Type") ?? "";
    if (type && !/html|xml/i.test(type)) return fail("NO_RECIPE_FOUND");

    const html = await readCapped(response, controller.signal);
    const page = extractPage(html);
    const recipe = parseRecipe({
      jsonLd: page.jsonLd,
      pageUrl: url.href,
      meta: {
        siteName: page.siteName,
        canonicalUrl: page.canonicalUrl,
        image: page.image,
        author: page.author,
      },
    });

    if (!recipe)
      return fail(
        page.jsonLd.length === 0 && looksLikeBotWall(html)
          ? "BLOCKED"
          : "NO_RECIPE_FOUND",
      );

    return json({ ok: true, recipe }, 200, "public, max-age=600");
  } catch (err) {
    if (err instanceof FetchError) return fail(err.code);
    return fail("FETCH_FAILED");
  } finally {
    clearTimeout(timer);
  }
};
