// Cloudflare Pages Function: GET /api/recipe?url=...
//
// This is a Phase 0 stub so the local dev workflow (Next static export +
// `wrangler pages dev`) can be verified end-to-end. Phase 1 replaces the
// body with real fetch + JSON-LD extraction + normalisation, per CLAUDE.md.

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url).searchParams.get("url");

  return Response.json(
    {
      ok: true,
      stub: true,
      message: "Cook Mode recipe extraction endpoint — not yet implemented.",
      receivedUrl: url,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
};
