import { formatClock, formatClockSpoken } from "../../lib/format";
import { Check, Pause, Timer } from "./icons";

// The tappable chip a detected duration becomes inside step text.
// Presentational: the timer engine (useTimers) owns state and passes it in.
// State is always carried by text and icon, never by colour alone.

export type TimerChipState = "idle" | "running" | "paused" | "done";

const stateClasses: Record<TimerChipState, string> = {
  idle: "bg-surface text-ink hover:bg-line",
  running: "bg-accent text-on-accent",
  paused:
    "bg-surface text-ink outline-2 outline-dashed outline-ink -outline-offset-2",
  done: "bg-ink text-ground",
};

export function TimerChip({
  label,
  state = "idle",
  remaining,
  onClick,
}: {
  /** The phrase from the step, e.g. "10–12 minutes". */
  label: string;
  state?: TimerChipState;
  /** Seconds left, shown while running or paused. */
  remaining?: number;
  onClick?: () => void;
}) {
  const time = remaining !== undefined ? formatClock(remaining) : null;
  const spoken = remaining !== undefined ? formatClockSpoken(remaining) : "";
  const text =
    state === "running" && time
      ? time
      : state === "paused" && time
        ? `${time} paused`
        : state === "done"
          ? "Done"
          : label;
  const action =
    state === "idle"
      ? `Start timer for ${label}`
      : state === "running"
        ? `Pause timer, ${spoken} left`
        : state === "paused"
          ? `Resume timer, ${spoken} left`
          : `Timer for ${label} finished. Dismiss`;
  const Icon = state === "done" ? Check : state === "running" ? Pause : Timer;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={action}
      className={`${stateClasses[state]} rounded-control inline-flex min-h-11 items-center gap-2 px-4 align-middle text-[0.8em] leading-none font-semibold tabular-nums transition-transform duration-(--duration-press) ease-out active:scale-[0.96]`}
    >
      <Icon size={20} className="shrink-0" />
      <span>{text}</span>
    </button>
  );
}
