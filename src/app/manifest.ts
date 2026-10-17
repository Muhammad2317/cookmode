import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Installable app: opens full-screen (no browser chrome), which suits cook
// mode. Colours match the light palette; per-scheme theme colours come from
// the <meta name="theme-color"> tags in layout.tsx.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cook Mode",
    short_name: "Cook Mode",
    description:
      "Paste a recipe link and cook from a clean, step-by-step view that credits the original creator.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf7",
    theme_color: "#fafaf7",
    categories: ["food", "lifestyle", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
