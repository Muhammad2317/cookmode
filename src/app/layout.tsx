import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

// Atkinson Hyperlegible Next (OFL, see src/fonts/OFL.txt): approved at the
// Phase 2 checkpoint for its low-vision legibility. Self-hosted from a local
// file rather than next/font/google so Next can read the font's metrics and
// generate a size-matched Arial fallback, so there's no layout shift when it swaps in.
const text = localFont({
  src: "../fonts/AtkinsonHyperlegibleNext-Latin.woff2",
  weight: "200 800",
  variable: "--font-text",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: "Cook Mode",
  description:
    "Paste a recipe link and cook from a clean, step-by-step view that credits the original creator.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0c" },
  ],
};

// Runs before first paint: a shared recipe link (/?url=…) shows the loading
// skeleton straight away instead of flashing the home screen while the app
// hydrates. First-party, inline, a single line; see page.tsx for the CSS hook.
const PRE_PAINT = `if(/[?&]url=/.test(location.search))document.documentElement.classList.add("has-recipe-url")`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The pre-paint script may add a class before React hydrates.
    <html
      lang="en"
      className={`${text.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
