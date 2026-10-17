// Targeted string scanning of a fetched HTML page.
// We only need JSON-LD blocks plus a handful of <meta>/<link> tags, so a few
// linear regex scans are far cheaper than any DOM parser, which matters on
// the Workers free tier's CPU budget.

import { decodeEntities } from "./text";

export interface PageData {
  jsonLd: string[];
  siteName: string | null;
  canonicalUrl: string | null;
  image: string | null;
  author: string | null;
  title: string | null;
}

const JSON_LD_RE =
  /<script\b[^>]*\btype\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script\s*>/gi;
const META_RE = /<meta\b([^>]*)>/gi;
const LINK_RE = /<link\b([^>]*)>/gi;
const ATTR_RE =
  /([a-z_:][-a-z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gi;

function parseAttributes(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of source.matchAll(ATTR_RE)) {
    const name = match[1].toLowerCase();
    if (!(name in attrs))
      attrs[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

export function extractPage(html: string): PageData {
  const jsonLd = Array.from(html.matchAll(JSON_LD_RE), (m) => m[1]).filter(
    (s) => s.trim(),
  );

  const meta = new Map<string, string>();
  for (const match of html.matchAll(META_RE)) {
    const attrs = parseAttributes(match[1]);
    const key = (attrs.property ?? attrs.name ?? "").toLowerCase();
    const content = attrs.content?.trim();
    if (key && content && !meta.has(key)) meta.set(key, content);
  }

  let canonical: string | null = null;
  for (const match of html.matchAll(LINK_RE)) {
    const attrs = parseAttributes(match[1]);
    const rel = (attrs.rel ?? "").toLowerCase().split(/\s+/);
    if (rel.includes("canonical") && attrs.href) {
      canonical = attrs.href.trim();
      break;
    }
  }

  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html);

  return {
    jsonLd,
    siteName: meta.get("og:site_name") ?? meta.get("application-name") ?? null,
    canonicalUrl: canonical ?? meta.get("og:url") ?? null,
    image: meta.get("og:image") ?? meta.get("twitter:image") ?? null,
    author: meta.get("author") ?? null,
    title: titleMatch ? decodeEntities(titleMatch[1]).trim() : null,
  };
}

// Markers of common bot walls / interstitials (Cloudflare, Akamai, PerimeterX,
// DataDome). Used to tell BLOCKED apart from NO_RECIPE_FOUND when a 200 page
// has no JSON-LD.
const BOT_WALL_RE =
  /cf-browser-verification|challenge-platform|cf_chl_|<title>\s*(?:just a moment|attention required|access denied|are you a robot)|px-captcha|captcha-delivery|datadome/i;

export function looksLikeBotWall(html: string): boolean {
  return BOT_WALL_RE.test(html.slice(0, 50_000));
}
