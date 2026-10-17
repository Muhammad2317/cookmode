import { formatClock, formatClockSpoken } from "../../lib/format";
import type { TimerStatus } from "../../lib/timer";
import { Check, Close, Pause, Timer as TimerIcon } from "./icons";

// The one active timer, kept visible across steps (and on the overview).
// Running: accent fill. Paused: surface tone with "Paused". Finished: the
// colours invert to ink with "Time's up", the loudest state on the screen.
// Progress is a scaleX bar (transform only); the time is tabular and large.

const tone: Record<TimerStatus, string> = {
  running: "bg-accent text-on-accent",
  paused: "bg-surface text-ink",
  done: "bg-ink text-ground",
};

const roundButton =
  "tap inline-flex size-14 shrink-0 items-center justify-center rounded-control transition-transform duration-(--duration-press) ease-out active:scale-[0.94]";

export function ActiveTimerBar({
  label,
  status,
  remainingSeconds,
  progress,
  onToggle,
  onDismiss,
}: {
  /** What the timer is for, e.g. "Step 4 · 10–12 minutes". */
  label: string;
  status: TimerStatus;
  remainingSeconds: number;
  /** 0 → 1, fraction elapsed. */
  progress: number;
  onToggle?: () => void;
  onDismiss?: () => void;
}) {
  const done = status === "done";
  return (
    <div
      role="timer"
      aria-label={`${label}: ${done ? "time's up" : `${formatClockSpoken(remainingSeconds)} left${status === "paused" ? ", paused" : ""}`}`}
      className={`${tone[status]} rounded-surface relative flex items-center gap-3 overflow-hidden py-2 pr-2 pl-5 ${done ? "animate-[fade-in_var(--duration-quick)_var(--ease-out)]" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-small truncate">
          {label}
          {status === "paused" && " · Paused"}
        </p>
        <p className="text-title leading-none font-bold tabular-nums">
          {done ? "Time's up" : formatClock(remainingSeconds)}
        </p>
      </div>
      {done ? (
        <button
          type="button"
          onClick={onDismiss}
          className="tap-min rounded-control bg-ground text-ink inline-flex min-h-14 items-center gap-2 px-5 font-semibold transition-transform duration-(--duration-press) ease-out active:scale-[0.96]"
        >
          <Check />
          Dismiss
        </button>
      ) : (
        <>
          <button
            type="button"
            aria-label={status === "running" ? "Pause timer" : "Resume timer"}
            onClick={onToggle}
            className={`${roundButton} ${status === "running" ? "bg-on-accent text-accent" : "bg-ink text-ground"}`}
          >
            {status === "running" ? <Pause /> : <TimerIcon />}
          </button>
          <button
            type="button"
            aria-label="Cancel timer"
            onClick={onDismiss}
            className={roundButton}
          >
            <Close />
          </button>
        </>
      )}
      {!done && (
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 bottom-0 h-1 ${status === "running" ? "bg-on-accent/30" : "bg-line"}`}
        >
          <span
            className={`absolute inset-0 origin-left ${status === "running" ? "bg-on-accent" : "bg-ink"}`}
            style={{ transform: `scaleX(${progress})` }}
          />
        </span>
      )}
    </div>
  );
}

/** Shown in place of the bar when starting a timer would replace a running one. */
export function ReplaceTimerPrompt({
  current,
  next,
  onReplace,
  onKeep,
}: {
  current: string;
  next: string;
  onReplace: () => void;
  onKeep: () => void;
}) {
  return (
    <div
      role="group"
      aria-label="Replace timer?"
      className="rounded-surface bg-surface flex flex-col gap-3 p-4"
    >
      <p className="text-body">
        <span className="font-semibold">{current}</span> is still running. Start{" "}
        <span className="font-semibold">{next}</span> instead?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onReplace}
          className="tap rounded-control bg-ink text-ground flex-1 px-5 font-semibold transition-transform duration-(--duration-press) ease-out active:scale-[0.97]"
        >
          Replace timer
        </button>
        <button
          type="button"
          onClick={onKeep}
          className="tap rounded-control bg-ground text-ink hover:bg-line flex-1 px-5 font-semibold transition-transform duration-(--duration-press) ease-out active:scale-[0.97]"
        >
          Keep current
        </button>
      </div>
    </div>
  );
}
