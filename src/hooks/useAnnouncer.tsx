"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Screen-reader announcements through two persistent live regions. Messages
 * are cleared then set, so repeating the same text is still announced.
 */
export function useAnnouncer() {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((message: string, urgent = false) => {
    const set = urgent ? setAssertive : setPolite;
    set("");
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => set(message), 60);
  }, []);

  const regions = (
    <>
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {polite}
      </div>
      <div
        className="sr-only"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {assertive}
      </div>
    </>
  );

  return { announce, regions };
}

export type Announce = (message: string, urgent?: boolean) => void;
