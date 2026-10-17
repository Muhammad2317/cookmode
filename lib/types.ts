// Shared types for the normalised recipe and the /api/recipe response.
// Used by both the Pages Function and the frontend, so keep this file free of
// runtime code and of any DOM- or Workers-specific types.

export interface RecipeStep {
  text: string;
  /** Section heading from a HowToSection (e.g. "For the sauce"), if any. */
  section: string | null;
}

export interface RecipeYield {
  /** Leading number, used as the base for serving scaling. */
  count: number | null;
  /** Human label, e.g. "Serves 4" or "12 cookies". */
  label: string;
}

export interface Recipe {
  title: string;
  description: string | null;
  authors: string[];
  siteName: string;
  sourceUrl: string;
  image: string | null;
  yield: RecipeYield | null;
  /** Minutes. */
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  ingredients: string[];
  steps: RecipeStep[];
}

export type RecipeErrorCode =
  | "INVALID_URL"
  | "FETCH_FAILED"
  | "BLOCKED"
  | "TIMEOUT"
  | "NO_RECIPE_FOUND"
  | "TOO_LARGE";

export interface RecipeError {
  code: RecipeErrorCode;
  message: string;
}

export type RecipeResponse =
  { ok: true; recipes: Recipe[] } | { ok: false; error: RecipeError };
