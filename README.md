# Cook Mode

Paste a recipe URL, get a clean, full-screen, step-by-step cooking view — timers, serving scaling, a screen that stays awake, and a prominent credit back to the original creator.

See `CLAUDE.md` for the full project brief and `DECISIONS.md` for a running log of why things are built the way they are.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript, built fully static (`output: 'export'`). No server rendering, no Next.js API routes.
- **Backend**: exactly one Cloudflare Pages Function, `functions/api/recipe.ts`, which fetches a recipe URL and returns normalised JSON.
- **Styling**: Tailwind CSS.
- **Hosting**: Cloudflare Pages (free tier).
- **Tests**: Vitest, for the framework-free logic in `/lib`.

Zero running cost: no accounts, databases, trackers, or paid services anywhere in the stack.

## Running locally

Requires Node.js 22+ and npm (already satisfied if you can run `node -v`).

```bash
npm install
```

There are two dev workflows, depending on what you're working on:

**1. Frontend only** — fast hot-reload, but `/api/recipe` is not available:

```bash
npm run dev
# open http://localhost:3000
```

**2. Full stack (frontend + the Pages Function)** — this is the one that matches production, since it's the only way to exercise `/api/recipe` locally:

```bash
npm run preview
# open http://localhost:8788
```

`preview` runs `next build` (static export to `/out`) and then serves it through `wrangler pages dev`, which is Cloudflare's local emulator for both static assets and Pages Functions. There's no hot-reload here — re-run `npm run preview` after changes to see them.

If you've already got a build in `/out` and just want to restart the function/server without rebuilding:

```bash
npm run pages:dev
```

### Other commands

```bash
npm run lint          # ESLint
npm run format        # Prettier, writes changes
npm run format:check  # Prettier, check only
npm run test          # Vitest, runs /lib unit tests once
npm run test:watch    # Vitest, watch mode
```

## Project structure

```
src/app/        Next.js App Router pages
lib/            Framework-free logic (recipe parsing, duration/timer/scaling
                 utilities) — fully unit-tested, used by both the frontend
                 and the Pages Function
functions/      Cloudflare Pages Functions (api/recipe.ts is the only one)
```

## Architecture overview

A request flow, end to end:

1. User pastes a recipe URL on the home screen.
2. The frontend calls `GET /api/recipe?url=...` — the one Cloudflare Pages Function in this project.
3. The function fetches the target page, scans it for `<script type="application/ld+json">` blocks (no DOM parser — `HTMLRewriter`/string scanning only, to stay inside Cloudflare's free-tier CPU budget), and runs `parseRecipe` (in `/lib`) to normalise whatever Recipe schema shape it finds into one clean type.
4. The frontend renders the overview and cook-mode screens from that normalised JSON. Serving scaling (`scaleIngredient`) and timer detection (`detectTimers`) run client-side, in the browser, on the already-normalised data.
5. Nothing is stored server-side — no database, no cache beyond a short `Cache-Control` header on the function response.

## Live extraction test results

Tested 2026-10-17 against the real function running locally under `wrangler pages dev`, using Cook Mode's honest User-Agent. "Notes" covers quirks in each site's own data that Cook Mode passes through as-is.

| Site                     | Country | Works? | Notes                                                                                                                                         |
| ------------------------ | ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| BBC Good Food            | UK      | ✅     | Clean data. Yield "Makes 12".                                                                                                                 |
| olive                    | UK      | ✅     | Clean data.                                                                                                                                   |
| delicious. magazine      | UK      | ✅     | Yield "Serves 6-8" → base count 6.                                                                                                            |
| The Guardian             | UK      | ✅     | Emits floats ("Serves 2.0", "5.0tbsp"); tidied to "2" / "5tbsp". Some articles hold several recipes; only the first is returned for now.      |
| RecipeTin Eats           | AU      | ✅     | WP Recipe Maker `@graph`; sections come through ("Chicken", "Chasseur Sauce"), including the site's own "Abbreviated Recipe" summary section. |
| Allrecipes               | US      | ✅     | Yield `["8", "1 (9x5-inch) meatloaf"]`; label kept consistent with the count ("8 servings").                                                  |
| Serious Eats             | US      | ✅     | Clean data.                                                                                                                                   |
| Bon Appétit              | US      | ✅     | No prep/cook times published.                                                                                                                 |
| Budget Bytes             | US      | ✅     | Ingredient lines include the site's cost notes, e.g. "($6.25)".                                                                               |
| Sally's Baking Addiction | US      | ✅     | Yield "2 dozen" (scales in dozens).                                                                                                           |

**Result: 10 / 10.** Error paths were checked live too: a page with no recipe (`NO_RECIPE_FOUND`), an HTML page over 3 MB (`TOO_LARGE`), a 12s response (`TIMEOUT` at 8s), 403/429 (`BLOCKED`), a 500 (`FETCH_FAILED`), and a redirect to `127.0.0.1` (refused, `FETCH_FAILED`).

## Why attribution is a design decision

_To be filled in during Phase 5._
