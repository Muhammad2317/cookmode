import type { RecipeError, RecipeErrorCode } from "./types";

// Default copy for each error. The UI may show its own richer state, but the
// API always returns a readable message too.
export const ERROR_MESSAGES: Record<RecipeErrorCode, string> = {
  INVALID_URL:
    "That doesn't look like a recipe link. Paste a full web address starting with http:// or https://.",
  FETCH_FAILED:
    "We couldn't load that page. It may be down, or the link may be wrong.",
  BLOCKED:
    "That site didn't let Cook Mode read the page. You can still open the recipe on the original site.",
  TIMEOUT: "That page took too long to respond. Try again in a moment.",
  NO_RECIPE_FOUND:
    "We couldn't find a recipe on that page. Some sites don't publish their recipes in a format Cook Mode can read.",
  TOO_LARGE: "That page is too large for Cook Mode to read.",
};

export function recipeError(code: RecipeErrorCode): RecipeError {
  return { code, message: ERROR_MESSAGES[code] };
}
