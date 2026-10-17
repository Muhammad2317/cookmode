import { Archivo, Inter, Inter_Tight, Public_Sans } from "next/font/google";

// Comparison fonts for the pairing options. Loaded only on /styleguide, and
// not preloaded, so they never cost the real app anything. Each sets the same
// CSS variables the app uses (--font-text / --font-heading) inside its card.

export const interText = Inter({
  variable: "--font-text",
  subsets: ["latin"],
  preload: false,
});
export const interTightHeading = Inter_Tight({
  variable: "--font-heading",
  subsets: ["latin"],
  preload: false,
});

export const publicSansText = Public_Sans({
  variable: "--font-text",
  subsets: ["latin"],
  preload: false,
});
export const archivoHeading = Archivo({
  variable: "--font-heading",
  subsets: ["latin"],
  axes: ["wdth"],
  preload: false,
});
