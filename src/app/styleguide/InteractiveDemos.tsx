"use client";

import { useEffect, useRef, useState } from "react";
import { Button, IconButton } from "@/components/Button";
import { ArrowLeft, ArrowRight, Close } from "@/components/icons";
import { ServingsStepper } from "@/components/ServingsStepper";
import { TimerChip, type TimerChipState } from "@/components/TimerChip";
import { scaleIngredient } from "../../../lib/scaleIngredient";

// Live demos for the styleguide. Sample data is invented for illustration.

const BASE_SERVINGS = 4;
const SAMPLE_INGREDIENTS = [
  "400g spaghetti",
  "2 tbsp olive oil",
  "1 x 400g tin chopped tomatoes",
  "3 garlic cloves, sliced",
  "½ tsp chilli flakes",
  "1 cup (250ml) pasta water",
  "a pinch of salt",
];

export function ServingsDemo() {
  const [servings, setServings] = useState(BASE_SERVINGS);
  const factor = servings / BASE_SERVINGS;
  return (
    <div className="flex flex-col items-start gap-6">
      <ServingsStepper value={servings} onChange={setServings} />
      <ul className="text-body flex flex-col gap-3">
        {SAMPLE_INGREDIENTS.map((line) => (
          <li key={line} className="tabular-nums">
            {scaleIngredient(line, factor)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A real 10-second timer: it stores the end timestamp, not a ticking counter. */
export function TimerChipDemo() {
  const DURATION = 10;
  const [state, setState] = useState<TimerChipState>("idle");
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(DURATION);

  useEffect(() => {
    if (state !== "running" || endsAt === null) return;
    const tick = () => {
      const left = (endsAt - Date.now()) / 1000;
      if (left <= 0) {
        setRemaining(0);
        setState("done");
      } else {
        setRemaining(left);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [state, endsAt]);

  const onClick = () => {
    if (state === "idle" || state === "done") {
      setEndsAt(Date.now() + DURATION * 1000);
      setRemaining(DURATION);
      setState("running");
    } else if (state === "running") {
      setState("paused");
    } else {
      setEndsAt(Date.now() + remaining * 1000);
      setState("running");
    }
  };

  return (
    <p className="text-step font-medium">
      Rest the dough for{" "}
      <TimerChip
        label="10 seconds"
        state={state}
        remaining={remaining}
        onClick={onClick}
      />{" "}
      then shape.
    </p>
  );
}

const DEMO_STEPS = [
  "Bring a large pan of salted water to the boil.",
  "Warm the oil and fry the garlic until just golden.",
  "Add the tomatoes and simmer until thick and glossy.",
];

export function MotionDemo() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [reduced, setReduced] = useState(false);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  const go = (delta: number) => {
    setDirection(delta > 0 ? "forward" : "back");
    setIndex((i) => (i + delta + DEMO_STEPS.length) % DEMO_STEPS.length);
  };

  const closeSheet = () => setClosing(true);

  return (
    <div className={`flex flex-col gap-6 ${reduced ? "reduced-motion" : ""}`}>
      <label className="text-body flex items-center gap-3">
        <input
          type="checkbox"
          checked={reduced}
          onChange={(e) => setReduced(e.target.checked)}
          className="size-6 accent-(--ink)"
        />
        Preview with reduced motion
      </label>

      <div className="rounded-surface bg-surface overflow-hidden p-6">
        <p className="text-small text-muted mb-2 tabular-nums">
          Step {index + 1} of {DEMO_STEPS.length}
        </p>
        <p
          key={`${index}-${direction}`}
          className="text-step min-h-[3lh] font-medium"
          style={{
            animation: `step-in-${direction} var(--duration-step) var(--ease-out) both`,
          }}
        >
          {DEMO_STEPS[index]}
        </p>
        <div className="mt-4 flex gap-2">
          <IconButton
            label="Previous step"
            variant="raised"
            onClick={() => go(-1)}
          >
            <ArrowLeft />
          </IconButton>
          <IconButton label="Next step" variant="primary" onClick={() => go(1)}>
            <ArrowRight />
          </IconButton>
          <Button
            variant="raised"
            className="ml-auto"
            onClick={() => sheetRef.current?.showModal()}
          >
            Open sheet
          </Button>
        </div>
      </div>

      <dialog
        ref={sheetRef}
        aria-labelledby="demo-sheet-title"
        onCancel={(e) => {
          e.preventDefault();
          closeSheet();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeSheet();
        }}
        onAnimationEnd={() => {
          if (closing) {
            sheetRef.current?.close();
            setClosing(false);
          }
        }}
        className={`${reduced ? "reduced-motion" : ""} rounded-t-surface bg-ground text-ink backdrop:bg-ink/40 sm:rounded-surface fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[80dvh] w-full max-w-xl overflow-y-auto overscroll-contain p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop:[animation:fade-in_var(--duration-sheet)_var(--ease-out)] sm:bottom-6`}
        style={{
          animation: closing
            ? "sheet-out var(--duration-sheet) var(--ease-in) both"
            : "sheet-in var(--duration-sheet) var(--ease-out) both",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <h3 id="demo-sheet-title" className="text-title font-bold">
            Ingredients
          </h3>
          <IconButton label="Close ingredients" onClick={closeSheet}>
            <Close />
          </IconButton>
        </div>
        <ul className="text-body mt-4 flex flex-col gap-3">
          {SAMPLE_INGREDIENTS.slice(0, 5).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </dialog>
    </div>
  );
}
