import { describe, expect, it } from "vitest";
import { formatClock, formatClockSpoken, formatMinutes } from "./format";

describe("formatMinutes", () => {
  it.each([
    [0, "0 min"],
    [45, "45 min"],
    [60, "1 hr"],
    [75, "1 hr 15 min"],
    [305, "5 hr 5 min"],
    [12.6, "13 min"],
  ])("%d → %s", (input, expected) =>
    expect(formatMinutes(input)).toBe(expected),
  );
});

describe("formatClock", () => {
  it.each([
    [0, "0:00"],
    [-3, "0:00"],
    [9.2, "0:10"],
    [59, "0:59"],
    [462, "7:42"],
    [3600, "1:00:00"],
    [3723, "1:02:03"],
  ])("%d → %s", (input, expected) => expect(formatClock(input)).toBe(expected));
});

describe("formatClockSpoken", () => {
  it.each([
    [0, "0 seconds"],
    [1, "1 second"],
    [60, "1 minute"],
    [462, "7 minutes 42 seconds"],
    [3723, "1 hour 2 minutes 3 seconds"],
  ])("%d → %s", (input, expected) =>
    expect(formatClockSpoken(input)).toBe(expected),
  );
});
