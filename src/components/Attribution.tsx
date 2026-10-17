import type { Recipe } from "../../lib/types";
import { ExternalLink } from "./icons";

// Credit is a first-class element: body size or larger, always linked, and
// placed above the fold wherever a recipe is shown. The link deliberately
// keeps the default referrer policy so creators can see visits came from
// Cook Mode.

export function creditLine(
  recipe: Pick<Recipe, "authors" | "siteName">,
): string {
  const by = recipe.authors.length ? recipe.authors.join(" & ") : null;
  return by
    ? `Recipe by ${by} · ${recipe.siteName}`
    : `Recipe from ${recipe.siteName}`;
}

export function Attribution({ recipe }: { recipe: Recipe }) {
  const by = recipe.authors.length ? recipe.authors.join(" & ") : null;
  return (
    <div className="rounded-surface bg-surface flex flex-col gap-2 p-5">
      <p className="text-body">
        {by ? (
          <>
            Recipe by <span className="font-bold">{by}</span> ·{" "}
            {recipe.siteName}
          </>
        ) : (
          <>
            Recipe from <span className="font-bold">{recipe.siteName}</span>
          </>
        )}
      </p>
      <a
        href={recipe.sourceUrl}
        target="_blank"
        rel="noopener"
        className="tap-min text-body inline-flex items-center gap-2 self-start font-semibold underline decoration-2 underline-offset-4 hover:decoration-4"
      >
        View the original recipe
        <ExternalLink size={20} />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );
}
