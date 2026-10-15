import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Fully static export: no Node server, no Next API routes. The only
  // backend is the Cloudflare Pages Function in /functions.
  output: "export",
  images: {
    unoptimized: true,
  },
  turbopack: {
    // Pin the root explicitly: a stray lockfile in the user's home
    // directory makes Turbopack's auto-detection walk up past the
    // project folder otherwise.
    root: projectRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
