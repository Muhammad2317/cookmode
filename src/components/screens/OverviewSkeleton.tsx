import { AppHeader } from "../AppHeader";

// Mirrors the Overview layout box for box, so the real content replaces it
// without anything moving (CLS ≈ 0). No spinner; the pulse is opacity-only and
// switched off under reduced motion.

const block = "rounded-surface bg-surface motion-safe:animate-pulse";

export function OverviewSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col" aria-busy="true">
      <AppHeader />
      <main
        id="main"
        className="mx-auto w-full max-w-6xl flex-1 px-5 pb-40 sm:px-8 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16"
      >
        <p role="status" className="sr-only">
          Loading recipe…
        </p>
        <div aria-hidden="true" className="flex flex-col gap-6">
          <div className={`${block} aspect-[3/2] w-full lg:aspect-[16/9]`} />
          <div className="flex flex-col gap-3">
            <div className={`${block} h-[2.4rem] w-11/12 sm:h-14`} />
            <div className={`${block} h-[2.4rem] w-2/3 sm:h-14`} />
          </div>
          <div className={`${block} h-[6.5rem] w-full`} />
          <div className="flex gap-8">
            <div className={`${block} h-12 w-20`} />
            <div className={`${block} h-12 w-20`} />
            <div className={`${block} h-12 w-20`} />
          </div>
        </div>
        <div aria-hidden="true" className="mt-12 flex flex-col gap-5 lg:mt-0">
          <div className={`${block} h-9 w-44`} />
          <div className={`${block} h-16 w-60`} />
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className={`${block} h-6`}
              style={{ width: `${88 - ((i * 17) % 40)}%` }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
