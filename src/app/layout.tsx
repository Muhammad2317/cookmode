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

// No title here: the home route renders its own (PageTitle), so <head> only
// ever holds one. Other routes set theirs in their metadata.
export const metadata: Metadata = {
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
// hydrates (see page.tsx for the CSS hook). It also starts the recipe request
// now rather than after the JS has loaded (recipeClient.ts picks it up), and
// on the overview preloads the recipe photo, the largest thing on screen, as
// soon as its URL is known. The referrer policy matches RecipeImage's so the
// browser reuses the preload. First-party and inline.
const PRE_PAINT = `var q=new URLSearchParams(location.search),u=q.get("url");if(u){document.documentElement.classList.add("has-recipe-url");window.__cookModeEarly={url:u,body:fetch("/api/recipe?url="+encodeURIComponent(u)).then(function(r){return r.json()}).then(function(b){var i=!q.get("view")&&b&&b.ok&&b.recipes.length===1&&b.recipes[0].image;if(i){var l=document.createElement("link");l.rel="preload";l.as="image";l.href=i;l.referrerPolicy="no-referrer";l.fetchPriority="high";document.head.appendChild(l)}return b}).catch(function(){return null})}}`;

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
        <a
          href="#main"
          className="bg-ink text-ground rounded-control sr-only z-50 px-6 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
