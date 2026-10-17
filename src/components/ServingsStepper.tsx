// Interactive: render from a client component (it takes an onChange callback).

import { useId, type KeyboardEvent } from "react";
import { Minus, Plus } from "./icons";

// APG spinbutton: the value is a focusable spinbutton (arrow keys, Page
// Up/Down, Home/End) and the large +/- buttons stay focusable too, so touch,
// mouse and keyboard all work.

export function ServingsStepper({
  value,
  onChange,
  min = 1,
  max = 48,
  unit = "servings",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  const labelId = useId();
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowUp: value + 1,
      ArrowRight: value + 1,
      ArrowDown: value - 1,
      ArrowLeft: value - 1,
      PageUp: value + 4,
      PageDown: value - 4,
      Home: min,
      End: max,
    };
    if (event.key in keys) {
      event.preventDefault();
      set(keys[event.key]);
    }
  };

  return (
    <div className="rounded-control bg-surface inline-flex items-center gap-2 p-1">
      <button
        type="button"
        aria-label={`Fewer ${unit}`}
        disabled={value <= min}
        onClick={() => set(value - 1)}
        className="tap rounded-control bg-ground text-ink hover:bg-line inline-flex size-14 items-center justify-center transition-[transform,opacity] duration-(--duration-press) ease-out active:scale-[0.94] disabled:opacity-40"
      >
        <Minus />
      </button>
      <span id={labelId} className="sr-only">
        Servings
      </span>
      <div
        role="spinbutton"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={`${value} ${unit}`}
        onKeyDown={onKeyDown}
        className="rounded-control text-title min-w-[5.5ch] px-2 text-center font-bold tabular-nums"
      >
        {value}
        <span className="text-small text-muted block font-normal">{unit}</span>
      </div>
      <button
        type="button"
        aria-label={`More ${unit}`}
        disabled={value >= max}
        onClick={() => set(value + 1)}
        className="tap rounded-control bg-ground text-ink hover:bg-line inline-flex size-14 items-center justify-center transition-[transform,opacity] duration-(--duration-press) ease-out active:scale-[0.94] disabled:opacity-40"
      >
        <Plus />
      </button>
    </div>
  );
}
