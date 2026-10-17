import { describe, expect, it } from "vitest";
import { extractPage, looksLikeBotWall } from "./extractPage";

const html = `<!doctype html>
<html><head>
<title>Lemon Pasta &amp; Peas | Example</title>
<meta property="og:site_name" content="Example &amp; Co">
<meta property='og:image' content='https://cdn.test/og.jpg' />
<meta name="author" content="Sam Baker">
<link rel="stylesheet" href="/a.css">
<link href="https://example.test/lemon-pasta" rel="canonical">
<script type="application/ld+json">{"@type":"WebSite"}</script>
<script async src="/app.js"></script>
</head><body>
<script TYPE='application/ld+json' class="yoast-schema-graph">
  {"@graph":[{"@type":"Recipe"}]}
</script>
<script type="application/ld+json"></script>
</body></html>`;

describe("extractPage", () => {
  const page = extractPage(html);

  it("finds every non-empty JSON-LD block, in head and body, any attribute order/case", () => {
    expect(page.jsonLd.map((s) => s.trim())).toEqual([
      '{"@type":"WebSite"}',
      '{"@graph":[{"@type":"Recipe"}]}',
    ]);
  });

  it("reads og:site_name, og:image and author with entities decoded", () => {
    expect(page.siteName).toBe("Example & Co");
    expect(page.image).toBe("https://cdn.test/og.jpg");
    expect(page.author).toBe("Sam Baker");
  });

  it("finds the canonical link regardless of attribute order", () => {
    expect(page.canonicalUrl).toBe("https://example.test/lemon-pasta");
  });

  it("reads the title", () => {
    expect(page.title).toBe("Lemon Pasta & Peas | Example");
  });

  it("falls back to og:url when there's no canonical link", () => {
    expect(
      extractPage('<meta property="og:url" content="https://x.test/r">')
        .canonicalUrl,
    ).toBe("https://x.test/r");
  });

  it("returns empty data for a page without any of it", () => {
    expect(extractPage("<html><body>Hello</body></html>")).toEqual({
      jsonLd: [],
      siteName: null,
      canonicalUrl: null,
      image: null,
      author: null,
      title: null,
    });
  });
});

describe("looksLikeBotWall", () => {
  it("detects common challenge pages", () => {
    expect(
      looksLikeBotWall("<html><head><title>Just a moment...</title>"),
    ).toBe(true);
    expect(
      looksLikeBotWall(
        '<script src="/cdn-cgi/challenge-platform/h/b/orchestrate"></script>',
      ),
    ).toBe(true);
  });

  it("ignores normal pages", () => {
    expect(looksLikeBotWall(html)).toBe(false);
  });
});
