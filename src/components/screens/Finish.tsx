import type { Recipe } from "../../../lib/types";
import { AppHeader } from "../AppHeader";
import { Button, ButtonLink } from "../Button";
import { ExternalLink } from "../icons";

// The last screen sends people back to the creator: the thank-you is the
// single primary action.

export function Finish({
  recipe,
  onBack,
  onHome,
}: {
  recipe: Recipe;
  onBack: () => void;
  onHome: () => void;
}) {
  const author = recipe.authors.length
    ? recipe.authors.join(" & ")
    : recipe.siteName;
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main
        id="main"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8"
      >
        <div className="flex flex-col gap-4">
          <h1
            className="font-display text-display font-bold"
            data-view-heading
            tabIndex={-1}
          >
            Enjoyed it?
          </h1>
          <p className="text-step font-medium">
            Thank {author} by visiting the original recipe.
          </p>
          <p className="text-body text-muted">
            {recipe.title} · {recipe.siteName}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <ButtonLink
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener"
            size="cta"
            className="w-full"
          >
            Visit the original recipe
            <ExternalLink />
            <span className="sr-only">(opens in a new tab)</span>
          </ButtonLink>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={onBack}>
              Back to the recipe
            </Button>
            <Button variant="quiet" onClick={onHome}>
              Cook something else
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
