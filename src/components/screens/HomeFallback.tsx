"use client";

import { Home } from "./Home";

// Prop-less client entry for the static HTML: the home screen without a JS
// submit handler, so its form falls back to a native GET until hydration.
export function HomeFallback() {
  return <Home />;
}
