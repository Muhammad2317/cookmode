import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { segmentStep } from "../../../lib/segmentStep";
import type { Recipe } from "../../../lib/types";
import type { Announce } from "../../hooks/useAnnouncer";
import type { TimersApi } from "../../hooks/useTimers";
import { useWakeLock } from "../../hooks/useWakeLock";
import { ActiveTimerBar, ReplaceTimerPrompt } from "../ActiveTimerBar";
import { Button, IconButton } from "../Button";
import { ArrowLeft, ArrowRight, Check, Close, List, ScreenOn } from "../icons";
import { IngredientList } from "../IngredientList";
import { Sheet } from "../Sheet";
import { StepProgress } from "../StepProgress";
import { TimerChip, type TimerChipState } from "../TimerChip";

// Full-screen cook mode: one step per screen, giant text, every control
// ≥ 56px in the thumb zone. Advance by swipe, the big buttons or the arrow
// keys; space starts/pauses the step's timer. The screen is kept awake.

const SWIPE_MIN_PX = 60;

export function timerId(step: number, index: number): string {
  return `step-${step + 1}:${index}`;
}

export function CookMode({
  recipe,
  step,
  factor,
  timers,
  announce,
  onStep,
  onExit,
  onFinish,
}: {
  recipe: Recipe;
  /** Zero-based. */
  step: number;
  factor: number;
  timers: TimersApi;
  announce: Announce;
  onStep: (step: number) => void;
  onExit: () => void;
  onFinish: () => void;
}) {
  const total = recipe.steps.length;
  const current = recipe.steps[step];
  const isLast = step === total - 1;
  const wakeLocked = useWakeLock(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const segments = useMemo(() => segmentStep(current.text), [current.text]);
  const regionRef = useRef<HTMLElement>(null);

  // Direction drives which side the new step slides in from.
  // Derived when the step prop changes (React's "adjust state on prop change").
  const [shownStep, setShownStep] = useState(step);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  if (step !== shownStep) {
    setShownStep(step);
    setDirection(step > shownStep ? "forward" : "back");
  }

  // Announce every step change (not the first render: focus handles that).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      regionRef.current?.focus();
      return;
    }
    const section = current.section ? `${current.section}. ` : "";
    announce(`Step ${step + 1} of ${total}. ${section}${current.text}`);
  }, [step, total, current, announce]);

  const go = (delta: number) => {
    const next = step + delta;
    if (next < 0) return;
    if (next >= total) onFinish();
    else onStep(next);
  };

  // The first timer in this step, used by the space bar.
  const firstTimer = segments.find((s) => s.kind === "timer");
  const active = timers.views[0] ?? null;

  const toggleTimerFromKeyboard = () => {
    if (active) {
      if (active.status === "done") timers.dismiss(active.timer.id);
      else timers.toggle(active.timer.id);
    } else if (firstTimer && firstTimer.kind === "timer") {
      timers.activate(
        timerId(step, firstTimer.index),
        `Step ${step + 1} · ${firstTimer.text}`,
        firstTimer.timer.seconds,
      );
    }
  };

  // Keyboard: arrows/PageUp/PageDown between steps, space for the timer,
  // Escape to leave. Ignored while the ingredients sheet is open.
  // Re-subscribed after each render (cheap) so the handler sees fresh state.
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (
        sheetOpen ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const target = event.target as HTMLElement | null;
      const onControl = target?.closest("button, a, input, [role=spinbutton]");
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        go(1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        go(-1);
      } else if (event.key === " " && !onControl) {
        event.preventDefault();
        toggleTimerFromKeyboard();
      } else if (event.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  // Swipe: horizontal, deliberate (60px+, mostly sideways). Taps on chips
  // and buttons are left alone.
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: PointerEvent) => {
    if (
      e.pointerType === "mouse" ||
      (e.target as HTMLElement).closest("button")
    )
      return;
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5)
      go(dx < 0 ? 1 : -1);
  };

  const chipState = (
    id: string,
  ): { state: TimerChipState; remaining?: number } => {
    const view = timers.views.find((v) => v.timer.id === id);
    if (!view) return { state: "idle" };
    return { state: view.status, remaining: view.remainingSeconds };
  };

  return (
    <div className="flex h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 overflow-hidden px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
        <header className="flex items-start gap-3">
          <IconButton label="Exit cook mode" onClick={onExit}>
            <Close />
          </IconButton>
          <div className="min-w-0 flex-1 pt-1">
            <StepProgress current={step + 1} total={total} />
          </div>
          {wakeLocked && (
            <p className="text-small text-muted flex shrink-0 items-center gap-1.5 pt-1">
              <ScreenOn size={20} />
              <span>Screen on</span>
            </p>
          )}
        </header>

        <section
          ref={regionRef}
          tabIndex={-1}
          aria-label={`Step ${step + 1} of ${total}`}
          aria-roledescription="step"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (swipeStart.current = null)}
          className="flex flex-1 touch-pan-y flex-col gap-3 overflow-y-auto overscroll-contain outline-none"
        >
          <h1 className="sr-only">{recipe.title}</h1>
          <div
            key={step}
            className="flex flex-col gap-3"
            style={{
              animation: `step-in-${direction} var(--duration-step) var(--ease-out) both`,
            }}
          >
            {current.section && (
              <p className="text-body text-muted font-semibold">
                {current.section}
              </p>
            )}
            <p className="text-step font-medium break-words">
              {segments.map((segment, i) => {
                if (segment.kind === "text")
                  return <span key={i}>{segment.text}</span>;
                const id = timerId(step, segment.index);
                const { state, remaining } = chipState(id);
                return (
                  <TimerChip
                    key={i}
                    label={segment.text}
                    state={state}
                    remaining={remaining}
                    onClick={() =>
                      timers.activate(
                        id,
                        `Step ${step + 1} · ${segment.text}`,
                        segment.timer.seconds,
                      )
                    }
                  />
                );
              })}
            </p>
          </div>
        </section>

        {timers.pending && active ? (
          <ReplaceTimerPrompt
            current={active.timer.label}
            next={timers.pending.label}
            onReplace={timers.confirmReplace}
            onKeep={timers.keepCurrent}
          />
        ) : (
          active && (
            <ActiveTimerBar
              label={active.timer.label}
              status={active.status}
              remainingSeconds={active.remainingSeconds}
              progress={active.progress}
              onToggle={() => timers.toggle(active.timer.id)}
              onDismiss={() => timers.dismiss(active.timer.id)}
            />
          )
        )}

        <nav aria-label="Steps" className="flex items-center gap-2">
          <IconButton
            label="Previous step"
            onClick={() => go(-1)}
            disabled={step === 0}
          >
            <ArrowLeft />
          </IconButton>
          <Button
            variant="secondary"
            onClick={() => setSheetOpen(true)}
            className="min-w-0 flex-1 px-4"
          >
            <List />
            Ingredients
          </Button>
          {isLast ? (
            <Button onClick={onFinish} className="px-5">
              <Check />
              Finish
            </Button>
          ) : (
            <IconButton
              label="Next step"
              variant="primary"
              onClick={() => go(1)}
              className="sm:w-24"
            >
              <ArrowRight />
            </IconButton>
          )}
        </nav>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Ingredients"
      >
        <IngredientList ingredients={recipe.ingredients} factor={factor} />
      </Sheet>
    </div>
  );
}
