// Split step text into plain-text runs and timer phrases, so the UI can turn
// "Simmer for 10 minutes" into text + a tappable timer chip.

import { detectTimers, type TimerSuggestion } from "./detectTimers";

export type StepSegment =
  | { kind: "text"; text: string }
  | { kind: "timer"; text: string; timer: TimerSuggestion; index: number };

export function segmentStep(text: string): StepSegment[] {
  const segments: StepSegment[] = [];
  let cursor = 0;
  detectTimers(text).forEach((timer, index) => {
    if (timer.index > cursor)
      segments.push({ kind: "text", text: text.slice(cursor, timer.index) });
    segments.push({ kind: "timer", text: timer.label, timer, index });
    cursor = timer.index + timer.length;
  });
  if (cursor < text.length)
    segments.push({ kind: "text", text: text.slice(cursor) });
  return segments;
}
