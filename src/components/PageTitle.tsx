"use client";

import { useSyncExternalStore } from "react";

// The one <title> on the home route. It's rendered outside the Suspense
// boundary so it's in the static HTML, and React hoists it into <head>.
// CookModeApp sets it per screen. Setting document.title directly instead
// lost a race with Next's metadata <title> whenever the recipe arrived
// before hydration finished.

const DEFAULT_TITLE = "Cook Mode";
let current = DEFAULT_TITLE;
const listeners = new Set<() => void>();

export function setPageTitle(title: string) {
  if (title === current) return;
  current = title;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function PageTitle() {
  const title = useSyncExternalStore(
    subscribe,
    () => current,
    () => DEFAULT_TITLE,
  );
  return <title>{title}</title>;
}
