import { Suspense } from "react";
import { CookModeApp } from "@/components/CookModeApp";
import { HomeFallback } from "@/components/screens/HomeFallback";
import { OverviewSkeleton } from "@/components/screens/OverviewSkeleton";

// Static export: search params only exist in the browser, so the app reads
// them inside a Suspense boundary. The prerendered fallback holds both the
// home screen (fast first paint; its form works before hydration) and the
// loading skeleton; the pre-paint script in layout.tsx picks which one shows.
export default function Page() {
  return (
    <Suspense
      fallback={
        <>
          <div className="fallback-home">
            <HomeFallback />
          </div>
          <div className="fallback-recipe">
            <OverviewSkeleton />
          </div>
        </>
      }
    >
      <CookModeApp />
    </Suspense>
  );
}
