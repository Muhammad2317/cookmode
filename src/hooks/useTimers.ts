"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatClockSpoken } from "../../lib/format";
import {
  addTimer,
  createTimer,
  MAX_ACTIVE_TIMERS,
  remainingMs,
  removeTimer,
  timerProgress,
  timerStatus,
  toggleTimer,
  updateTimer,
  type Timer,
  type TimerStatus,
} from "../../lib/timer";
import { startAlarm, unlockAudio } from "../lib/alarm";
import { useNow } from "./useNow";
import type { Announce } from "./useAnnouncer";

export interface TimerView {
  timer: Timer;
  status: TimerStatus;
  remainingSeconds: number;
  progress: number;
}

export interface PendingTimer {
  id: string;
  label: string;
  seconds: number;
}

/**
 * App-level timer state, so a timer keeps running (and stays visible) when
 * leaving cook mode for the overview. Owns the alarm: it rings once per
 * finished timer until that timer is dismissed.
 */
export function useTimers(announce: Announce) {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [pending, setPending] = useState<PendingTimer | null>(null);
  const now = useNow(timers.length > 0);

  const views: TimerView[] = useMemo(
    () =>
      timers.map((timer) => ({
        timer,
        status: timerStatus(timer, now),
        remainingSeconds: remainingMs(timer, now) / 1000,
        progress: timerProgress(timer, now),
      })),
    [timers, now],
  );

  // Ring for any finished timer; stop when it's dismissed or replaced.
  const ringingKey = views
    .filter((v) => v.status === "done")
    .map((v) => `${v.timer.id}@${v.timer.endsAt}`)
    .join("|");
  const ringingLabel = views.find((v) => v.status === "done")?.timer.label;
  useEffect(() => {
    if (!ringingKey) return;
    announce(`Time's up: ${ringingLabel}`, true);
    return startAlarm();
  }, [ringingKey, ringingLabel, announce]);

  const add = useCallback(
    (id: string, label: string, seconds: number) => {
      setTimers((list) =>
        addTimer(list, createTimer(id, label, seconds, Date.now())),
      );
      setPending(null);
      announce(`Timer started: ${formatClockSpoken(seconds)}`);
    },
    [announce],
  );

  /** Start a timer, asking first if it would replace one that's still counting. */
  const start = useCallback(
    (id: string, label: string, seconds: number) => {
      unlockAudio();
      const t = Date.now();
      const counting = timers.filter(
        (x) => x.id !== id && timerStatus(x, t) !== "done",
      );
      if (counting.length >= MAX_ACTIVE_TIMERS) {
        setPending({ id, label, seconds });
        announce(`A timer is already running. Replace it?`);
        return;
      }
      add(id, label, seconds);
    },
    [timers, add, announce],
  );

  const toggle = useCallback(
    (id: string) => {
      unlockAudio();
      setTimers((list) =>
        updateTimer(list, id, (t) => toggleTimer(t, Date.now())),
      );
      const t = timers.find((x) => x.id === id);
      if (t)
        announce(
          timerStatus(t, Date.now()) === "running"
            ? "Timer paused"
            : "Timer resumed",
        );
    },
    [timers, announce],
  );

  const dismiss = useCallback(
    (id: string) => setTimers((list) => removeTimer(list, id)),
    [],
  );

  /** One entry point for chips and the space bar: start, pause/resume, or dismiss. */
  const activate = useCallback(
    (id: string, label: string, seconds: number) => {
      const existing = timers.find((t) => t.id === id);
      if (!existing) start(id, label, seconds);
      else if (timerStatus(existing, Date.now()) === "done") dismiss(id);
      else toggle(id);
    },
    [timers, start, toggle, dismiss],
  );

  return {
    views,
    pending,
    activate,
    toggle,
    dismiss,
    confirmReplace: () =>
      pending && add(pending.id, pending.label, pending.seconds),
    keepCurrent: () => setPending(null),
  };
}

export type TimersApi = ReturnType<typeof useTimers>;
