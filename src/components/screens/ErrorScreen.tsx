import type { LoadErrorCode } from "../../lib/recipeClient";
import { AppHeader } from "../AppHeader";
import { Button, ButtonLink } from "../Button";
import { ExternalLink } from "../icons";

// One friendly screen per error type: what happened, what to do next, and
// (whenever there's a real page) a way to open the original recipe.

const COPY: Record<
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

export function ErrorScreen({
  code,
  url,
  onRetry,
  onHome,
}: {
  code: LoadErrorCode;
  /** The original link, offered whenever it's a valid page address. */
  url: string | null;
  onRetry: () => void;
  onHome: () => void;
}) {
  const copy = COPY[code];
  const showOriginal = url !== null && code !== "INVALID_URL";
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main
        id="main"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-5 pb-16 sm:px-8"
      >
        <div className="flex flex-col gap-4">
          <h1
            className="font-display text-display font-bold"
            data-view-heading
            tabIndex={-1}
          >
            {copy.title}
          </h1>
          <p className="text-body max-w-[56ch]">{copy.body}</p>
          {url && <p className="text-small text-muted break-all">{url}</p>}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {copy.retry && (
            <Button size="cta" onClick={onRetry}>
              Try again
            </Button>
          )}
          {showOriginal && (
            <ButtonLink
              href={url}
              target="_blank"
              rel="noopener"
              size="cta"
              variant={copy.retry ? "secondary" : "primary"}
            >
              Open the original page
              <ExternalLink />
              <span className="sr-only">(opens in a new tab)</span>
            </ButtonLink>
          )}
          <Button
            size="cta"
            variant={copy.retry || showOriginal ? "quiet" : "primary"}
            onClick={onHome}
          >
            Try another link
          </Button>
        </div>
      </main>
    </div>
  );
}

export const ERROR_TITLES = Object.fromEntries(
  Object.entries(COPY).map(([k, v]) => [k, v.title]),
) as Record<LoadErrorCode, string>;
