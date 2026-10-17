import Image from "next/image";
import { formatMinutes } from "../../../lib/format";
import type { Recipe } from "../../../lib/types";
import { AppHeader } from "../AppHeader";
import { creditLine } from "../Attribution";
import { ArrowRight } from "../icons";

// Shown when one page holds several recipes (e.g. a newspaper article).
// A short explanation first, then one large target per recipe.

function summary(recipe: Recipe): string {
  const parts = [
    recipe.yield?.label,
    recipe.totalTime ? formatMinutes(recipe.totalTime) : null,
    `${recipe.steps.length} ${recipe.steps.length === 1 ? "step" : "steps"}`,
  ];
  return parts.filter(Boolean).join(" · ");
}

export function RecipePicker({
  recipes,
  onPick,
}: {
  recipes: Recipe[];
  onPick: (index: number) => void;
}) {
  const first = recipes[0];
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main
        id="main"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 pb-16 sm:px-8"
      >
        <div className="flex flex-col gap-4">
          <h1
            className="font-display text-display font-bold"
            data-view-heading
            tabIndex={-1}
          >
            This page has {recipes.length} recipes
          </h1>
          <p className="text-body text-muted max-w-[56ch]">
            Some pages, like newspaper articles, hold more than one recipe.
            Choose the one you want to cook. You can come back to this list from
            the recipe page at any time.
          </p>
          <p className="text-body">{creditLine(first)}</p>
        </div>

        <ul className="flex flex-col gap-3">
          {recipes.map((recipe, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onPick(i)}
                className="rounded-surface bg-surface hover:bg-line flex w-full items-center gap-4 p-4 text-left transition-transform duration-(--duration-press) ease-out active:scale-[0.99]"
              >
                {recipe.image ? (
                  <span className="rounded-surface bg-line relative size-20 shrink-0 overflow-hidden">
                    <Image
                      src={recipe.image}
                      alt=""
                      fill
                      sizes="80px"
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </span>
                ) : null}
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-title font-bold break-words">
                    {recipe.title}
                  </span>
                  <span className="text-small text-muted">
                    {summary(recipe)}
                  </span>
                </span>
                <ArrowRight className="shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
