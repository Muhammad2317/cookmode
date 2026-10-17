import { describe, expect, it } from "vitest";
import { detectTimers } from "./detectTimers";

const summary = (text: string) =>
  detectTimers(text).map(({ label, seconds, maxSeconds }) => ({
    label,
    seconds,
    maxSeconds,
  }));

describe("detectTimers", () => {
  it.each([
    ["Simmer for 10 minutes.", "10 minutes", 600],
    ["Bake for 1 hour 15 mins until golden.", "1 hour 15 mins", 4500],
    ["Roast for 1 hour and 15 minutes.", "1 hour and 15 minutes", 4500],
    ["Braise for 1½ hours.", "1½ hours", 5400],
    ["Braise for 1 1/2 hours.", "1 1/2 hours", 5400],
    ["Braise for 1.5 hrs.", "1.5 hrs", 5400],
    ["Microwave for 45 secs.", "45 secs", 45],
    ["Rest for 30 seconds.", "30 seconds", 30],
    ["Cook for an hour, stirring.", "an hour", 3600],
    ["Leave for a minute.", "a minute", 60],
    ["Chill for half an hour.", "half an hour", 1800],
    ["Simmer for an hour and a half.", "an hour and a half", 5400],
    ["Simmer for 2 and a half hours.", "2 and a half hours", 9000],
    ["Leave to rise for two hours.", "two hours", 7200],
    ["Fry for twenty-five minutes.", "twenty-five minutes", 1500],
    ["Give it a 5-minute rest.", "5-minute", 300],
    ["Bake 25 min.", "25 min", 1500],
    ["Prove for 2h.", "2h", 7200],
    ["Cook 1 hr 5 min.", "1 hr 5 min", 3900],
  ])("%s", (text, label, seconds) => {
    expect(summary(text)).toEqual([{ label, seconds, maxSeconds: null }]);
  });

  it("starts ranges at the lower bound and keeps the range", () => {
    expect(summary("Cook for 10–12 minutes.")).toEqual([
      { label: "10–12 minutes", seconds: 600, maxSeconds: 720 },
    ]);
    expect(summary("Cook for 10-12 mins.")).toEqual([
      { label: "10-12 mins", seconds: 600, maxSeconds: 720 },
    ]);
    expect(summary("Roast for 2 to 3 hours.")).toEqual([
      { label: "2 to 3 hours", seconds: 7200, maxSeconds: 10800 },
    ]);
    expect(summary("Simmer 1–1½ hours.")).toEqual([
      { label: "1–1½ hours", seconds: 3600, maxSeconds: 5400 },
    ]);
  });

  it.each([
    ["Stir for a few minutes."],
    ["Leave overnight in the fridge."],
    ["Cook for several minutes."],
    ["Preheat the oven to 200C."],
    ["Add 2 tbsp of the herbs."],
    ["Add an herb sprig."],
    ["Marinate for 48 hours."],
    ["Bake at 180C/gas 4."],
  ])("ignores %s", (text) => {
    expect(detectTimers(text)).toEqual([]);
  });

  it("finds multiple timers with positions", () => {
    const text = "Fry for 5 minutes, then simmer for 20 minutes.";
    const timers = detectTimers(text);
    expect(timers.map((t) => t.seconds)).toEqual([300, 1200]);
    for (const t of timers)
      expect(text.slice(t.index, t.index + t.length)).toBe(t.label);
  });

  it("does not merge two durations of the same unit", () => {
    expect(
      summary("Cook 10 minutes, 5 minutes per side.").map((t) => t.seconds),
    ).toEqual([600, 300]);
    expect(
      summary("Sear 2 minutes 3 minutes more").map((t) => t.label),
    ).toEqual(["2 minutes", "3 minutes"]);
  });

  it("returns nothing for empty text", () => {
    expect(detectTimers("")).toEqual([]);
  });
});
