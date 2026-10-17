// Palette tokens as data, so the styleguide can compute contrast and a test
// can verify these match the CSS custom properties in src/app/globals.css.

export type ThemeName = "light" | "dark";

export const PALETTE: Record<ThemeName, Record<string, string>> = {
  light: {
    ground: "#fafaf7",
    surface: "#efefe9",
    ink: "#0d0d0c",
    muted: "#45453f",
    line: "#d6d6cc",
    accent: "#1d3fa3",
    "on-accent": "#ffffff",
  },
  dark: {
    ground: "#0d0d0c",
    surface: "#1c1c1a",
    ink: "#f4f4ee",
    muted: "#bdbdb3",
    line: "#3a3a36",
    accent: "#8fbcf7",
    "on-accent": "#0d0d0c",
  },
};

export const TOKEN_ROLES: Record<string, string> = {
  ground: "Page background",
  surface: "Raised areas: chips, sheet, secondary buttons",
  ink: "Text, primary buttons, focus ring",
  muted: "Secondary text (still AAA)",
  line: "Unfilled progress and hover fills. Never a text colour",
  accent: "Running timers and selection. Nothing else",
  "on-accent": "Text on accent",
};

/** Foreground/background pairs that carry text, each of which must be AAA. */
export const TEXT_PAIRS: [fg: string, bg: string][] = [
  ["ink", "ground"],
  ["ink", "surface"],
  ["muted", "ground"],
  ["muted", "surface"],
  ["ground", "ink"],
  ["on-accent", "accent"],
  ["accent", "ground"],
  ["accent", "surface"],
];
