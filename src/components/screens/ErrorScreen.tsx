import type { LoadErrorCode } from "../../lib/recipeClient";
import { COPY } from "./errorCopy";
import { AppHeader } from "../AppHeader";
import { Button, ButtonLink } from "../Button";
import { ExternalLink } from "../icons";

// One friendly screen per error type: what happened, what to do next, and
// (whenever there's a real page) a way to open the original recipe.

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
