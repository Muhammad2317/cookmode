import { Check, Pause, Timer } from "./icons";

// The tappable chip a detected duration becomes inside step text.
// Presentational: the timer engine (Phase 3) owns state and passes it in.
// State is always carried by text and icon, never by colour alone.

export type TimerChipState = "idle" | "running" | "paused" | "done";

const stateClasses: Record<TimerChipState, string> = {
  idle: "bg-surface text-ink hover:bg-line",
  running: "bg-accent text-on-accent",
  paused:
    "bg-surface text-ink outline-2 outline-dashed outline-ink -outline-offset-2",
  done: "bg-ink text-ground",
};

function formatRemaining(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

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
  const time = remaining !== undefined ? formatRemaining(remaining) : null;
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
        ? `Pause timer, ${time} left`
        : state === "paused"
          ? `Resume timer, ${time} left`
          : `Timer for ${label} finished`;
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
