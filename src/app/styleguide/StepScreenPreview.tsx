import { ActiveTimerBar } from "@/components/ActiveTimerBar";
import { Button, IconButton } from "@/components/Button";
import {
  ArrowLeft,
  ArrowRight,
  Close,
  List,
  ScreenOn,
} from "@/components/icons";
import { StepProgress } from "@/components/StepProgress";
import { TimerChip } from "@/components/TimerChip";

// A static mock of one cook-mode step, built from the real components, shown
// inside a phone-sized frame. Sample content is invented for illustration.

export function StepScreenPreview({ theme }: { theme: "light" | "dark" }) {
  return (
    <figure className="flex min-w-0 flex-col items-center gap-3">
      <div
        className={`theme-${theme} bg-ground text-ink flex h-[46rem] w-full max-w-[24rem] flex-col gap-6 overflow-hidden rounded-[2rem] p-4`}
      >
        <header className="flex items-start gap-3">
          <IconButton label="Exit cook mode">
            <Close />
          </IconButton>
          <div className="min-w-0 flex-1 pt-1">
            <StepProgress current={4} total={9} />
          </div>
          <p className="text-small text-muted flex items-center gap-1.5 pt-1">
            <ScreenOn size={20} />
            <span>Screen on</span>
          </p>
        </header>

        <section aria-label="Step 4" className="flex flex-1 flex-col gap-3">
          <p className="text-body text-muted font-semibold">For the sauce</p>
          <p className="text-step font-medium">
            Simmer the sauce for <TimerChip label="10–12 minutes" /> until it
            coats the back of a spoon.
          </p>
        </section>

        <ActiveTimerBar
          label="Boil the pasta"
          remaining="7:42"
          progress={0.36}
        />

        <nav aria-label="Steps" className="flex items-center gap-2">
          <IconButton label="Previous step">
            <ArrowLeft />
          </IconButton>
          <Button variant="secondary" className="min-w-0 flex-1 px-4">
            <List />
            Ingredients
          </Button>
          <IconButton label="Next step" variant="primary" className="sm:w-20">
            <ArrowRight />
          </IconButton>
        </nav>
      </div>
      <figcaption className="text-small text-muted">
        {theme === "light" ? "Light" : "Dark"} mode
      </figcaption>
    </figure>
  );
}
