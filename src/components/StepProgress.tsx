// "Step X of Y": the text carries the meaning; the segmented bar reinforces it.
// Segments collapse into a continuous bar past 16 steps to stay legible.

export function StepProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const segmented = total <= 16;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-small font-semibold tabular-nums">
        Step {current}{" "}
        <span className="text-muted font-normal">of {total}</span>
      </p>
      <div
        role="progressbar"
        aria-label="Recipe progress"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`Step ${current} of ${total}`}
        className="flex h-1.5 gap-1"
      >
        {segmented ? (
          Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`rounded-control flex-1 ${i < current ? "bg-ink" : "bg-line"}`}
            />
          ))
        ) : (
          <span className="rounded-control bg-line relative flex-1 overflow-hidden">
            <span
              className="bg-ink absolute inset-0 origin-left transition-transform duration-(--duration-step) ease-out"
              style={{ transform: `scaleX(${current / total})` }}
            />
          </span>
        )}
      </div>
    </div>
  );
}
