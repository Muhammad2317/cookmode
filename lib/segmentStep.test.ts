import { describe, expect, it } from "vitest";
import { segmentStep } from "./segmentStep";

const shape = (text: string) =>
  segmentStep(text).map((s) =>
    s.kind === "text" ? s.text : `[${s.text}|${s.timer.seconds}]`,
  );

describe("segmentStep", () => {
  it("returns a single text segment when there are no timers", () => {
    expect(shape("Chop the onions.")).toEqual(["Chop the onions."]);
  });

  it("splits text around timers, preserving every character", () => {
    const text = "Fry for 5 minutes, then simmer for 10–12 minutes.";
    expect(shape(text)).toEqual([
      "Fry for ",
      "[5 minutes|300]",
      ", then simmer for ",
      "[10–12 minutes|600]",
      ".",
    ]);
    expect(
      segmentStep(text)
        .map((s) => s.text)
        .join(""),
    ).toBe(text);
  });

  it("handles a timer at the very start and end", () => {
    expect(shape("10 minutes")).toEqual(["[10 minutes|600]"]);
  });

  it("numbers timer segments in order", () => {
    const timers = segmentStep("Rest 5 min, bake 20 min").filter(
      (s) => s.kind === "timer",
    );
    expect(timers.map((t) => (t.kind === "timer" ? t.index : -1))).toEqual([
      0, 1,
    ]);
  });

  it("handles empty text", () => {
    expect(segmentStep("")).toEqual([]);
  });
});
