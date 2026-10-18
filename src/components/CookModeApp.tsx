"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { validateUrl } from "../../lib/validateUrl";
import { useAnnouncer } from "../hooks/useAnnouncer";
import { useTimers } from "../hooks/useTimers";
import { loadRecipes, type LoadResult } from "../lib/recipeClient";
import { ActiveTimerBar, ReplaceTimerPrompt } from "./ActiveTimerBar";
import { ERROR_TITLES } from "./screens/errorCopy";
import { Home } from "./screens/Home";
import { OverviewSkeleton } from "./screens/OverviewSkeleton";
import { setPageTitle } from "./PageTitle";

// Only the home screen and skeleton ship in the initial bundle. Every other
// screen is loaded on demand, and preloaded as soon as a recipe URL is
// present, in parallel with the recipe fetch, so nobody waits on it. While a
// chunk loads, the skeleton keeps the layout stable.
const loadOverview = () => import("./screens/Overview");
const loadCookMode = () => import("./screens/CookMode");
const Overview = dynamic(() => loadOverview().then((m) => m.Overview), {
  loading: () => <OverviewSkeleton />,
});
const CookMode = dynamic(() => loadCookMode().then((m) => m.CookMode), {
  loading: () => <OverviewSkeleton />,
});
const RecipePicker = dynamic(
  () => import("./screens/RecipePicker").then((m) => m.RecipePicker),
  {
    loading: () => <OverviewSkeleton />,
  },
);
const Finish = dynamic(() => import("./screens/Finish").then((m) => m.Finish), {
  loading: () => <OverviewSkeleton />,
});
const ErrorScreen = dynamic(
  () => import("./screens/ErrorScreen").then((m) => m.ErrorScreen),
  {
    loading: () => <OverviewSkeleton />,
  },
);

// The whole app is one route. The URL is the state, so every view is
// shareable and the back button just works:
//   /?url=<recipe page>          overview (or the picker for multi-recipe pages)
//   &r=2                         which recipe on a multi-recipe page (1-based)
//   &view=cook&step=4            cook mode at step 4 (1-based)
//   &view=done                   finish screen
// Navigation uses the native History API, which Next keeps in sync with
// useSearchParams.

type Params = Record<string, string | null>;

function navigate(
  next: Params,
  mode: "push" | "replace" = "push",
  reset = false,
) {
  const params = reset
    ? new URLSearchParams()
    : new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(next)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  const href = query ? `/?${query}` : "/";
  if (mode === "push") window.history.pushState(null, "", href);
  else window.history.replaceState(null, "", href);
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
const positiveInt = (value: string | null) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export function CookModeApp() {
  const params = useSearchParams();
  const url = params.get("url");
  const view = params.get("view");
  const pickedRecipe = positiveInt(params.get("r"));
  const stepParam = positiveInt(params.get("step"));

  const { announce, regions } = useAnnouncer();
  const timers = useTimers(announce);

  const validUrl = url && validateUrl(url).ok ? url : null;
  const [loaded, setLoaded] = useState<{
    url: string;
    result: LoadResult;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [servingsByRecipe, setServingsByRecipe] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (!validUrl) return;
    let cancelled = false;
    void loadRecipes(validUrl).then((result) => {
      if (!cancelled) setLoaded({ url: validUrl, result });
    });
    return () => {
      cancelled = true;
    };
  }, [validUrl, attempt]);

  // Warm the likely-next screens while the recipe is fetched.
  useEffect(() => {
    if (!validUrl) return;
    void loadOverview();
    void loadCookMode();
  }, [validUrl]);

  const result = validUrl && loaded?.url === validUrl ? loaded.result : null;
  const recipes = result?.ok ? result.recipes : null;
  const needsPick =
    recipes !== null && recipes.length > 1 && pickedRecipe === null;
  const recipeIndex = recipes
    ? clamp((pickedRecipe ?? 1) - 1, 0, recipes.length - 1)
    : 0;
  const recipe = recipes && !needsPick ? recipes[recipeIndex] : null;
  const recipeKey = `${validUrl}#${recipeIndex}`;
  const baseServings = recipe?.yield?.count ?? null;
  const servings = servingsByRecipe[recipeKey] ?? baseServings;
  const factor = baseServings && servings ? servings / baseServings : 1;
  const cooking = recipe !== null && view === "cook" && recipe.steps.length > 0;
  const finished = recipe !== null && view === "done";
  const step = recipe
    ? clamp((stepParam ?? 1) - 1, 0, Math.max(0, recipe.steps.length - 1))
    : 0;

  // A stable name for the current screen, for titles, scroll and focus.
  const screen = !url
    ? "home"
    : !validUrl
      ? "error"
      : !result
        ? "loading"
        : !result.ok
          ? "error"
          : needsPick
            ? "pick"
            : cooking
              ? "cook"
              : finished
                ? "done"
                : "overview";

  const title =
    screen === "home"
      ? "Cook Mode"
      : screen === "loading"
        ? "Loading recipe… · Cook Mode"
        : screen === "error"
          ? `Error: ${ERROR_TITLES[result && !result.ok ? result.code : "INVALID_URL"]} · Cook Mode`
          : screen === "pick"
            ? "Choose a recipe · Cook Mode"
            : screen === "cook"
              ? `Step ${step + 1} · ${recipe!.title} · Cook Mode`
              : `${recipe?.title} · Cook Mode`;

  useEffect(() => {
    setPageTitle(title);
  }, [title]);

  // Recipe views must never compete with creators in search results.
  useEffect(() => {
    if (!url) return;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [url]);

  // New screen: start at the top and move focus to its heading, so keyboard
  // and screen-reader users land on the new content. Skipped on first load.
  const lastScreen = useRef(screen);
  useEffect(() => {
    if (screen === lastScreen.current) return;
    lastScreen.current = screen;
    if (screen === "cook" || screen === "loading") return; // cook mode focuses its own step
    window.scrollTo(0, 0);
    document
      .querySelector<HTMLElement>("[data-view-heading]")
      ?.focus({ preventScroll: true });
  }, [screen]);

  const goHome = useCallback(() => navigate({}, "push", true), []);
  const retry = () => {
    setLoaded(null);
    setAttempt((n) => n + 1);
  };

  const activeTimer = timers.views[0] ?? null;
  const timerSlot =
    timers.pending && activeTimer ? (
      <ReplaceTimerPrompt
        current={activeTimer.timer.label}
        next={timers.pending.label}
        onReplace={timers.confirmReplace}
        onKeep={timers.keepCurrent}
      />
    ) : activeTimer ? (
      <ActiveTimerBar
        label={activeTimer.timer.label}
        status={activeTimer.status}
        remainingSeconds={activeTimer.remainingSeconds}
        progress={activeTimer.progress}
        onToggle={() => timers.toggle(activeTimer.timer.id)}
        onDismiss={() => timers.dismiss(activeTimer.timer.id)}
      />
    ) : null;

  let content;
  if (screen === "home") {
    content = (
      <Home onSubmit={(next) => navigate({ url: next }, "push", true)} />
    );
  } else if (screen === "loading") {
    content = <OverviewSkeleton />;
  } else if (screen === "error") {
    content = (
      <ErrorScreen
        code={result && !result.ok ? result.code : "INVALID_URL"}
        url={validUrl}
        onRetry={retry}
        onHome={goHome}
      />
    );
  } else if (screen === "pick") {
    content = (
      <RecipePicker
        recipes={recipes!}
        onPick={(i) => navigate({ r: String(i + 1) })}
      />
    );
  } else if (screen === "cook") {
    content = (
      <CookMode
        recipe={recipe!}
        step={step}
        factor={factor}
        timers={timers}
        announce={announce}
        onStep={(next) => navigate({ step: String(next + 1) }, "replace")}
        onExit={() => navigate({ view: null, step: null }, "replace")}
        onFinish={() => navigate({ view: "done", step: null }, "replace")}
      />
    );
  } else if (screen === "done") {
    content = (
      <Finish
        recipe={recipe!}
        onBack={() => navigate({ view: null }, "replace")}
        onHome={goHome}
      />
    );
  } else {
    content = (
      <Overview
        recipe={recipe!}
        recipeCount={recipes!.length}
        servings={servings}
        onServingsChange={(n) =>
          setServingsByRecipe((all) => ({ ...all, [recipeKey]: n }))
        }
        onStart={() => navigate({ view: "cook", step: "1" })}
        onChooseAnother={() => navigate({ r: null, view: null, step: null })}
        timerSlot={timerSlot}
      />
    );
  }

  return (
    <>
      {content}
      {regions}
    </>
  );
}
