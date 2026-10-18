import type { LoadErrorCode } from "../../lib/recipeClient";

// Copy for each error screen, kept apart from the component so page titles
// can use it without loading the screen itself.

export const COPY: Record<
  LoadErrorCode,
  { title: string; body: string; retry: boolean }
> = {
  INVALID_URL: {
    title: "That link doesn't look right",
    body: "Cook Mode needs the full web address of a recipe page, starting with http:// or https://.",
    retry: false,
  },
  FETCH_FAILED: {
    title: "We couldn't load that page",
    body: "The site may be down, or the link may have changed. Check the link or try again in a moment.",
    retry: true,
  },
  BLOCKED: {
    title: "This site doesn't let Cook Mode in",
    body: "Some sites block apps from reading their pages. You can still cook from the original recipe on their site.",
    retry: false,
  },
  TIMEOUT: {
    title: "That page took too long",
    body: "The site didn't answer in time. It's often temporary, so try again.",
    retry: true,
  },
  NO_RECIPE_FOUND: {
    title: "No recipe found on that page",
    body: "Cook Mode reads the structured recipe data sites publish, and this page doesn't have any. Make sure the link goes to a single recipe, not a collection.",
    retry: false,
  },
  TOO_LARGE: {
    title: "That page is too big to read",
    body: "It's far larger than a normal recipe page, so Cook Mode stopped reading it. Open it on the original site instead.",
    retry: false,
  },
  NETWORK: {
    title: "Can't reach Cook Mode",
    body: "Check your internet connection, then try again.",
    retry: true,
  },
};

export const ERROR_TITLES = Object.fromEntries(
  Object.entries(COPY).map(([k, v]) => [k, v.title]),
) as Record<LoadErrorCode, string>;
