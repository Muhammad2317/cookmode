import { Close, Pause } from "./icons";

// The one active timer, kept visible across steps. Progress is a scaleX bar
// (transform only), and the time is the large, tabular, primary content.

export function ActiveTimerBar({
  label,
  remaining,
  progress,
}: {
  /** What the timer is for, e.g. "Boil the pasta". */
  label: string;
  /** Pre-formatted time left, e.g. "7:42". */
  remaining: string;
  /** 0 → 1, fraction of the timer elapsed. */
  progress: number;
}) {
  return (
    <div
      role="timer"
      aria-label={`${label}: ${remaining} left`}
      className="rounded-surface bg-accent text-on-accent relative flex items-center gap-3 overflow-hidden py-2 pr-2 pl-5"
    >
      <div className="min-w-0 flex-1">
        <p className="text-small truncate">{label}</p>
        <p className="text-title leading-none font-bold tabular-nums">
          {remaining}
        </p>
      </div>
      <button
        type="button"
        aria-label="Pause timer"
        className="tap rounded-control bg-on-accent text-accent inline-flex size-14 items-center justify-center transition-transform duration-(--duration-press) ease-out active:scale-[0.94]"
      >
        <Pause />
      </button>
      <button
        type="button"
        aria-label="Cancel timer"
        className="tap rounded-control inline-flex size-14 items-center justify-center transition-transform duration-(--duration-press) ease-out active:scale-[0.94]"
      >
        <Close />
      </button>
      <span
        aria-hidden="true"
        className="bg-on-accent/30 absolute inset-x-0 bottom-0 h-1"
      >
        <span
          className="bg-on-accent absolute inset-0 origin-left"
          style={{ transform: `scaleX(${progress})` }}
        />
      </span>
    </div>
  );
}
