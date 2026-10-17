"use client";

import { useEffect, useState } from "react";

/**
 * The current time, refreshed while `active`. Timers compute remaining time
 * from end timestamps, so this only drives repaints. It also refreshes the
 * moment the tab becomes visible again, so a backgrounded timer is right
 * immediately rather than on the next tick.
 */
export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [active, intervalMs]);

  return now;
}
