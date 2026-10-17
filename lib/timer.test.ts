import { describe, expect, it } from "vitest";
import {
  addTimer,
  createTimer,
  pauseTimer,
  remainingMs,
  removeTimer,
  resumeTimer,
  timerProgress,
  timerStatus,
  toggleTimer,
  updateTimer,
} from "./timer";

const T0 = 1_000_000;

describe("timer engine", () => {
  it("counts down from the end timestamp", () => {
    const t = createTimer("a", "Boil", 600, T0);
    expect(t.endsAt).toBe(T0 + 600_000);
    expect(remainingMs(t, T0 + 1000)).toBe(599_000);
    expect(timerStatus(t, T0 + 1000)).toBe("running");
  });

  it("stays exact across a long gap (backgrounded tab)", () => {
    const t = createTimer("a", "Boil", 600, T0);
    // No ticks for 9 minutes: the remaining time is still right.
    expect(remainingMs(t, T0 + 540_000)).toBe(60_000);
  });

  it("is done at and after the end, never negative", () => {
    const t = createTimer("a", "Boil", 10, T0);
    expect(timerStatus(t, T0 + 10_000)).toBe("done");
    expect(remainingMs(t, T0 + 99_000)).toBe(0);
    expect(timerProgress(t, T0 + 99_000)).toBe(1);
  });

  it("pauses by freezing remaining time and resumes with a new end", () => {
    const t = createTimer("a", "Boil", 60, T0);
    const paused = pauseTimer(t, T0 + 20_000);
    expect(paused.endsAt).toBeNull();
    expect(timerStatus(paused, T0 + 500_000)).toBe("paused");
    expect(remainingMs(paused, T0 + 500_000)).toBe(40_000);

    const resumed = resumeTimer(paused, T0 + 500_000);
    expect(resumed.endsAt).toBe(T0 + 540_000);
    expect(remainingMs(resumed, T0 + 510_000)).toBe(30_000);
  });

  it("pause and resume are idempotent", () => {
    const t = createTimer("a", "Boil", 60, T0);
    expect(resumeTimer(t, T0 + 5)).toBe(t);
    const paused = pauseTimer(t, T0 + 1000);
    expect(pauseTimer(paused, T0 + 9000)).toBe(paused);
  });

  it("toggles between running and paused", () => {
    const t = createTimer("a", "Boil", 60, T0);
    const paused = toggleTimer(t, T0 + 1000);
    expect(timerStatus(paused, T0 + 2000)).toBe("paused");
    expect(timerStatus(toggleTimer(paused, T0 + 2000), T0 + 3000)).toBe(
      "running",
    );
  });

  it("reports progress from 0 to 1", () => {
    const t = createTimer("a", "Boil", 100, T0);
    expect(timerProgress(t, T0)).toBe(0);
    expect(timerProgress(t, T0 + 25_000)).toBeCloseTo(0.25);
  });
});

describe("timer list", () => {
  const a = createTimer("a", "A", 60, T0);
  const b = createTimer("b", "B", 60, T0);

  it("keeps at most `max` timers, dropping the oldest", () => {
    expect(addTimer([a], b, 1)).toEqual([b]);
    expect(addTimer([a], b, 2)).toEqual([a, b]);
  });

  it("replaces a timer with the same id in place", () => {
    const a2 = createTimer("a", "A again", 30, T0);
    expect(addTimer([a, b], a2, 2)).toEqual([a2, b]);
  });

  it("updates and removes by id", () => {
    const list = updateTimer([a, b], "b", (t) => pauseTimer(t, T0 + 1000));
    expect(list[1].endsAt).toBeNull();
    expect(removeTimer(list, "a")).toEqual([list[1]]);
  });
});
