import type { Recipe, RecipeErrorCode, RecipeResponse } from "../../lib/types";

// Client for the one Pages Function. Results are memoised per URL for the
// session, so moving between overview, cook mode and back never refetches.
// Failures are not memoised, so "Try again" really tries again.

/** NETWORK: the function itself couldn't be reached (offline, or `next dev` without Wrangler). */
export type LoadErrorCode = RecipeErrorCode | "NETWORK";

export type LoadResult =
  { ok: true; recipes: Recipe[] } | { ok: false; code: LoadErrorCode };

const cache = new Map<string, Promise<LoadResult>>();

async function request(url: string): Promise<LoadResult> {
  try {
    const res = await fetch(`/api/recipe?url=${encodeURIComponent(url)}`);
    const body = (await res.json()) as RecipeResponse;
    return body.ok
      ? { ok: true, recipes: body.recipes }
      : { ok: false, code: body.error.code };
  } catch {
    return { ok: false, code: "NETWORK" };
  }
}

export function loadRecipes(url: string): Promise<LoadResult> {
  let pending = cache.get(url);
  if (!pending) {
    pending = request(url);
    cache.set(url, pending);
    void pending.then((result) => {
      if (!result.ok) cache.delete(url);
    });
  }
  return pending;
}
