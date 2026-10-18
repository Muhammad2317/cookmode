import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { formatMinutes } from "../../../lib/format";
import type { Recipe } from "../../../lib/types";
import { yieldUnit } from "../../../lib/yieldUnit";
import { AppHeader } from "../AppHeader";
import { Attribution } from "../Attribution";
import { Button } from "../Button";
import { ArrowRight } from "../icons";
import { IngredientList } from "../IngredientList";
import { ServingsStepper } from "../ServingsStepper";

// Recipe overview. On phones the order is image → title → attribution, so
// the credit is on screen without scrolling; the start button is pinned in
// the thumb zone. On desktop it becomes two deliberate columns.

function RecipeImage({ recipe }: { recipe: Recipe }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="rounded-surface bg-surface relative aspect-[3/2] w-full overflow-hidden lg:aspect-[16/9]">
      {recipe.image && !failed ? (
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          priority
          sizes="(min-width: 1024px) 640px, 100vw"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        // Same box, so a missing or broken image never shifts the layout.
        <figcaption className="text-title text-muted absolute inset-0 flex items-center justify-center p-6 text-center font-bold">
          {recipe.siteName}
        </figcaption>
      )}
    </figure>
  );
}

function Times({ recipe }: { recipe: Recipe }) {
  const items = [
    ["Prep", recipe.prepTime],
    ["Cook", recipe.cookTime],
    ["Total", recipe.totalTime],
  ].filter((item): item is [string, number] => item[1] !== null);
  if (items.length === 0) return null;
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      {items.map(([label, minutes]) => (
        <div key={label} className="flex flex-col">
          <dt className="text-small text-muted">{label}</dt>
          <dd className="text-body font-semibold tabular-nums">
            {formatMinutes(minutes)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Overview({
  recipe,
  recipeCount,
  servings,
  onServingsChange,
  onStart,
  onChooseAnother,
  timerSlot,
}: {
  recipe: Recipe;
  recipeCount: number;
  servings: number | null;
  onServingsChange: (n: number) => void;
  onStart: () => void;
  onChooseAnother: () => void;
  /** The running timer, if any, so it stays visible here too. */
  timerSlot?: ReactNode;
}) {
  const base = recipe.yield?.count ?? null;
  const factor = base && servings ? servings / base : 1;
  const canCook = recipe.steps.length > 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader>
        <Link
          href="/"
          prefetch={false}
          className="tap-min text-body inline-flex items-center underline decoration-2 underline-offset-4 hover:decoration-4"
        >
          New recipe
        </Link>
      </AppHeader>

      <main
        id="main"
        className="mx-auto w-full max-w-6xl flex-1 px-5 pb-12 sm:px-8 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16"
      >
        <article className="flex flex-col gap-6">
          <RecipeImage recipe={recipe} />
          <h1
            className="font-display text-display font-bold break-words"
            data-view-heading
            tabIndex={-1}
          >
            {recipe.title}
          </h1>
          <Attribution recipe={recipe} />
          {recipe.description && (
            <p className="text-body text-muted line-clamp-4">
              {recipe.description}
            </p>
          )}
          <Times recipe={recipe} />
          {recipeCount > 1 && (
            <Button
              variant="quiet"
              onClick={onChooseAnother}
              className="self-start"
            >
              This page has {recipeCount} recipes. Choose another
            </Button>
          )}
        </article>

        <section
          aria-labelledby="ingredients-heading"
          className="mt-12 flex flex-col gap-5 lg:mt-0"
        >
          <h2 id="ingredients-heading" className="text-title font-bold">
            Ingredients
          </h2>
          {base && servings ? (
            <ServingsStepper
              value={servings}
              onChange={onServingsChange}
              unit={yieldUnit(recipe.yield?.label ?? "", base)}
            />
          ) : (
            recipe.yield && <p className="text-body">{recipe.yield.label}</p>
          )}
          <IngredientList ingredients={recipe.ingredients} factor={factor} />
        </section>
      </main>

      <div className="bg-ground pointer-events-none sticky bottom-0 pb-[max(1rem,env(safe-area-inset-bottom))] lg:bg-transparent lg:pb-0">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 pt-3 sm:px-8 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 lg:pt-0">
          <div className="pointer-events-auto hidden self-end pb-[max(1rem,env(safe-area-inset-bottom))] lg:block">
            {timerSlot}
          </div>
          <div className="lg:bg-ground pointer-events-auto flex flex-col gap-3 lg:pt-3 lg:pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="lg:hidden">{timerSlot}</div>
            {canCook ? (
              <Button size="cta" onClick={onStart} className="w-full">
                Start cooking
                <ArrowRight />
              </Button>
            ) : (
              <p className="text-body">
                This recipe has no method steps to cook from. Use the link above
                to open the original.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
