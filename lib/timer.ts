// Timer engine. A running timer stores its END TIMESTAMP, never a ticking
// counter, so it stays exact when the tab is backgrounded or throttled: the
// remaining time is always computed from the clock. Pure and framework-free;
// `now` is passed in so it's fully testable.
//
// Timers live in a list so multiple concurrent timers are a one-constant change
// (MAX_ACTIVE_TIMERS); the MVP UI shows one at a time.

export const MAX_ACTIVE_TIMERS = 1;

export type TimerStatus = "running" | "paused" | "done";

export interface Timer {
  /** Stable key for where it came from, e.g. "step-4:0". */
  id: string;
  /** Short context for the timer bar, e.g. "Step 4 · 10–12 minutes". */
  label: string;
  durationMs: number;
  /** Absolute end time while running; null while paused. */
  endsAt: number | null;
  /** Frozen remaining time while paused. */
  remainingMs: number;
}

export function createTimer(
  id: string,
  label: string,
  seconds: number,
  now: number,
): Timer {
  const durationMs = Math.max(0, Math.round(seconds * 1000));
  return {
    id,
    label,
    durationMs,
    endsAt: now + durationMs,
    remainingMs: durationMs,
  };
}

export function remainingMs(timer: Timer, now: number): number {
  return timer.endsAt === null
    ? timer.remainingMs
    : Math.max(0, timer.endsAt - now);
}

export function timerStatus(timer: Timer, now: number): TimerStatus {
  if (remainingMs(timer, now) <= 0) return "done";
  return timer.endsAt === null ? "paused" : "running";
}

/** 0 at the start, 1 when finished. */
export function timerProgress(timer: Timer, now: number): number {
  if (timer.durationMs <= 0) return 1;
  return Math.min(
    1,
    Math.max(0, 1 - remainingMs(timer, now) / timer.durationMs),
  );
}

export function pauseTimer(timer: Timer, now: number): Timer {
  if (timer.endsAt === null) return timer;
  return { ...timer, endsAt: null, remainingMs: remainingMs(timer, now) };
}

export function resumeTimer(timer: Timer, now: number): Timer {
  if (timer.endsAt !== null || timer.remainingMs <= 0) return timer;
  return { ...timer, endsAt: now + timer.remainingMs };
}

export function toggleTimer(timer: Timer, now: number): Timer {
  return timerStatus(timer, now) === "running"
    ? pauseTimer(timer, now)
    : resumeTimer(timer, now);
}

/**
 * Add a timer to the list. Re-adding an existing id replaces it in place;
 * otherwise, when the list is full, the oldest timer makes way.
 */
export function addTimer(
  list: Timer[],
  timer: Timer,
  max = MAX_ACTIVE_TIMERS,
): Timer[] {
  if (list.some((t) => t.id === timer.id))
    return list.map((t) => (t.id === timer.id ? timer : t));
  return [...list, timer].slice(-max);
}

export function updateTimer(
  list: Timer[],
  id: string,
  update: (t: Timer) => Timer,
): Timer[] {
  return list.map((t) => (t.id === id ? update(t) : t));
}

export function removeTimer(list: Timer[], id: string): Timer[] {
  return list.filter((t) => t.id !== id);
}
