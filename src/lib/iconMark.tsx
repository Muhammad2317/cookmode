import { ImageResponse } from "next/og";

// Cook Mode's mark, drawn in code (no stock assets): a bold "C" arc (also
// the rim of a pan seen from above) around a cornflower dot, on ink. The
// whole mark sits inside the central 80% circle, the maskable safe zone,
// so Android's circle/squircle crops never clip it.

const INK = "#0d0d0c";
const GROUND = "#fafaf7";
const ACCENT = "#8fbcf7";

/** `scale` < 1 adds extra padding (used for the dedicated maskable icon). */
export function markResponse(size: number, scale = 1) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: INK,
      }}
    >
      <svg width={size * scale} height={size * scale} viewBox="0 0 100 100">
        {/* Arc of radius 28 from 40° to 320°, opening to the right. */}
        <path
          d="M71.45 32 A28 28 0 1 0 71.45 68"
          fill="none"
          stroke={GROUND}
          strokeWidth={14}
          strokeLinecap="round"
        />
        <circle cx="50" cy="50" r="9" fill={ACCENT} />
      </svg>
    </div>,
    { width: size, height: size },
  );
}
