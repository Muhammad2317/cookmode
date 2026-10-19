# Cook Mode

Paste a recipe link and cook from a clean, full-screen, step-by-step view: giant text you can read from across the kitchen, tappable timers, serving scaling, and a screen that stays awake. Every recipe credits and links back to the person who wrote it.

**Live:** https://cookmode.pages.dev

<!-- Screenshots: add PNGs to docs/screenshots/ and uncomment the table.
     Recipe photos belong to their creators, not to this repo: use a recipe
     you have permission to show, or blur the photo. -->
<!--
| Home | Overview | Cook mode | Finish |
| ---- | -------- | --------- | ------ |
| ![Home](docs/screenshots/home.png) | ![Overview](docs/screenshots/overview.png) | ![Cook mode](docs/screenshots/cook.png) | ![Finish](docs/screenshots/finish.png) |
-->

_Screenshots: to be added._

## What it does

- **Paste a link, get the recipe.** Cook Mode reads the structured recipe data (schema.org JSON-LD) that most recipe sites publish for search engines. It doesn't scrape page layouts, use AI or need an account.
- **Overview**: photo, title, a prominent "Recipe by [Author] · [Site]" credit that's visible without scrolling, times, and a servings stepper that rescales ingredients live ("1 x 400g tin" scales the 1, not the 400g).
- **Cook mode**: one step per screen in very large type, with the section name and progress. Swipe, tap the 56px buttons, or use the arrow keys. The ingredients are one tap away in a bottom sheet.
- **Timers**: durations in the step text ("10–12 minutes", "1½ hours") become tappable chips. A timer stores its end time, so it stays accurate when the phone locks or the tab is in the background, and it stays visible across steps. When it finishes, the phone vibrates, a beep generated in the browser (Web Audio) sounds, and the bar switches to a high-contrast "Time's up".
- **Screen stays on** in cook mode (Screen Wake Lock), with a small indicator.
- **Finish screen** that sends people back to the creator: "Enjoyed it? Thank [Author] by visiting the original recipe."
- **Shareable**: the URL is the state (`/?url=…&view=cook&step=4`), so any view can be linked. Recipe views are `noindex`.
- **Installable** as a PWA. The service worker caches the app shell only, never recipe content.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript, built fully static (`output: 'export'`). No server rendering, no Next.js API routes.
- **Backend**: exactly one Cloudflare Pages Function, `functions/api/recipe.ts`, which fetches a recipe page and returns normalised JSON.
- **Styling**: Tailwind CSS. Self-hosted Atkinson Hyperlegible Next (OFL).
- **Hosting**: Cloudflare Pages (free tier).
- **Tests**: Vitest, 349 unit tests for the framework-free logic in `/lib`.

Zero running cost: no accounts, databases, cookies, analytics, trackers, API keys or paid services anywhere in the stack. The only runtime dependencies are `next`, `react` and `react-dom`.

## Running locally

Requires Node.js 22+ and npm.

```bash
npm install
```

There are two dev workflows, depending on what you're working on:

**1. Frontend only**: fast hot-reload, but `/api/recipe` isn't available, so recipe links show the "Can't reach Cook Mode" error.

```bash
npm run dev
# open http://localhost:3000
```

**2. Full stack (frontend + the Pages Function)**: the one that matches production, and the only way to exercise `/api/recipe` locally.

```bash
npm run preview
# open http://localhost:8788
```

`preview` runs `next build` (static export to `/out`, plus the generated service worker) and then serves it through `wrangler pages dev`, Cloudflare's local emulator for static assets and Pages Functions. There's no hot-reload: re-run `npm run preview` after changes. Stop it with Ctrl+C when you're done. A forgotten server keeps the port and keeps serving an old build.

If you've already got a build in `/out` and just want to restart the server without rebuilding:

```bash
npm run pages:dev
```

Known local difference: `wrangler pages dev` doesn't apply `public/_headers` (security and cache headers) to static files when a `functions/` directory exists. Cloudflare Pages does, so check them on the deployed site with `curl -I`.

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
src/app/          The single route (/), /styleguide, manifest and icons
src/components/   Screens (home, overview, picker, cook mode, finish, errors)
                  and the components they share
src/hooks/        Timers, wake lock, screen-reader announcer, clock
src/lib/          Browser-only helpers: recipe client, alarm, icon drawing
lib/              Framework-free logic, unit-tested and shared by the frontend
                  and the Pages Function: HTML/JSON-LD extraction, parseRecipe,
                  parseDuration, detectTimers, scaleIngredient, URL
                  validation, timer engine, design tokens
functions/        The Cloudflare Pages Function (api/recipe.ts)
public/_headers   Security headers (CSP etc.) and cache rules for Cloudflare
scripts/          Post-build service worker generator
docs/             UI standards the screens are checked against
```

## Architecture overview

```
 Browser (static Next.js export)              Cloudflare Pages Function
 -------------------------------              -------------------------
 /?url=https://site/recipe
   | inline script, before the app's JS --->  GET /api/recipe?url=...
   |                                            1. validate the URL: http(s)
   |                                               only, no localhost or
   |                                               private IPs, every
   |                                               redirect re-checked
   |                                            2. fetch the page: honest
   |                                               User-Agent, 8s timeout,
   |                                               3 MB cap while streaming
   |                                            3. scan for JSON-LD blocks
   |                                               (string scanning, no DOM)
   |                                            4. parseRecipe -> Recipe[]
   | <------------- recipe JSON only -------
   |
   +- overview: scaleIngredient runs live in the browser
   +- cook mode: detectTimers -> timer chips; timers stored as
                 end timestamps; Screen Wake Lock
```

1. A recipe link is the app's state: `/?url=…`. A small inline script starts the `/api/recipe` request and shows the loading skeleton before the app's JavaScript has downloaded. When the JSON arrives, it also preloads the recipe photo.
2. The function validates the URL, fetches the page, and pulls out every `<script type="application/ld+json">` block with targeted string scanning. That keeps it well inside the free tier's CPU budget (no jsdom, no cheerio). It tolerates messy JSON (HTML entities, trailing commas, stray control characters) and finds the Recipe node wherever it lives: at the top level, in `@graph`, in arrays, under `@type` arrays, or behind `@id` references.
3. `parseRecipe` normalises every variant into one `Recipe` type: authors, image, yield, ISO 8601 durations, ingredients, and steps (plain text, `HowToStep` or `HowToSection`).
4. Failures come back as typed errors (`INVALID_URL`, `FETCH_FAILED`, `BLOCKED`, `TIMEOUT`, `NO_RECIPE_FOUND`, `TOO_LARGE`). Each has its own friendly screen with a link to the original page.
5. Nothing is stored server-side. Successful responses get `Cache-Control: public, max-age=600`, errors get `no-store`, and every response sends `X-Robots-Tag: noindex`.

The reasoning behind each choice, with the alternatives considered, is in [`DECISIONS.md`](DECISIONS.md). The original brief is in [`CLAUDE.md`](CLAUDE.md).

## Live extraction test results

Tested 2026-10-17 against the real function running locally under `wrangler pages dev`, using Cook Mode's honest User-Agent. "Notes" covers quirks in each site's own data and how Cook Mode handles them.

| Site                     | Country | Works? | Notes                                                                                                                                                                                            |
| ------------------------ | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BBC Good Food            | UK      | ✅     | Clean data. Yield "Makes 12".                                                                                                                                                                    |
| olive                    | UK      | ✅     | Clean data.                                                                                                                                                                                      |
| delicious. magazine      | UK      | ✅     | Yield "Serves 6-8" → base count 6.                                                                                                                                                               |
| The Guardian             | UK      | ✅     | Emits floats ("Serves 2.0", "5.0tbsp"); tidied to "2" / "5tbsp". Multi-recipe articles return every recipe (the UI will offer a picker).                                                         |
| RecipeTin Eats           | AU      | ✅     | WP Recipe Maker `@graph`; sections come through ("Chicken", "Chasseur Sauce"), its condensed "Abbreviated Recipe" duplicate is dropped, and "((Note 1))" / "(, sliced)" plugin markup is tidied. |
| Allrecipes               | US      | ✅     | Yield `["8", "1 (9x5-inch) meatloaf"]`; label kept consistent with the count ("8 servings").                                                                                                     |
| Serious Eats             | US      | ✅     | Clean data.                                                                                                                                                                                      |
| Bon Appétit              | US      | ✅     | No prep/cook times published.                                                                                                                                                                    |
| Budget Bytes             | US      | ✅     | Per-ingredient prices ("($6.25)") are stripped for cook-time readability.                                                                                                                        |
| Sally's Baking Addiction | US      | ✅     | Yield "2 dozen" (scales in dozens).                                                                                                                                                              |

**Result: 10 / 10.** Error paths were checked live too: a page with no recipe (`NO_RECIPE_FOUND`), an HTML page over 3 MB (`TOO_LARGE`), a 12s response (`TIMEOUT` at 8s), 403/429 (`BLOCKED`), a 500 (`FETCH_FAILED`), and a redirect to `127.0.0.1` (refused, `FETCH_FAILED`).

## Performance and accessibility

PageSpeed Insights (Lighthouse 13.5, mobile: emulated Moto G Power on slow 4G), run against the live site on 2026-10-19. The overview and cook rows load a real recipe (BBC Good Food's easy pancakes) through the live API.

| Screen    | Performance | Accessibility | Best practices | FCP   | LCP   | TBT   | CLS |
| --------- | ----------- | ------------- | -------------- | ----- | ----- | ----- | --- |
| Home      | 99          | 100           | 100            | 0.8 s | 1.8 s | 10 ms | 0   |
| Overview  | 97          | 100           | 100            | 0.8 s | 2.6 s | 60 ms | 0   |
| Cook mode | 99          | 100           | 100            | 0.8 s | 2.0 s | 30 ms | 0   |

SEO is 100 on home. Recipe views score lower on purpose: they're `noindex`, so Cook Mode never competes with the creator in search. On the overview, the largest element is the creator's photo, loaded from their own image server.

**JavaScript (gzipped):** 145 KB loads on first visit, mostly React and the Next.js router; the app's own home-screen code is about 12 KB. The cook-mode screen adds about 10 KB on demand (5.4 KB screen + 4.5 KB bottom sheet). The overview adds 9 KB. Old browsers without module support also get a 39 KB polyfill bundle that modern browsers never download.

**Checked by hand:** screens at 360×640, 430×932, 820×1180 and 1440×900 in light and dark mode, with no horizontal overflow and no console errors. Plus a skip link, keyboard navigation, and reduced motion (step and sheet transitions become fades).

## Why attribution is a design decision

Recipe sites are free to read because the people who write them earn from visits: ads, newsletters, books, trust. A tool that lifts a recipe off its page takes that visit away. Most "clean recipe" tools treat credit as a footnote. Cook Mode treats it as part of the product:

- **The credit comes right after the title.** "Recipe by [Author] · [Site]", linked to the original, is placed so it's on screen without scrolling. That was measured at 360×640, 390×844, 1280×800 and 1440×900, not assumed.
- **The ending sends people back.** The finish screen's main action is a big button to the original recipe: "Enjoyed it? Thank [Author] by visiting the original recipe."
- **So do the errors.** If a site blocks Cook Mode or has no structured data, the error screen links to the original page instead of leaving a dead end.
- **The creator can see the visit.** The "View the original recipe" link keeps the browser's default referrer policy, so the traffic shows up in the creator's analytics. (Photos load with `no-referrer`, for the reader's privacy.)
- **Cook Mode never competes in search.** Recipe views carry a `noindex` robots meta tag, and the API sends `X-Robots-Tag: noindex`, so a Cook Mode link can't outrank the original.
- **It only takes what's offered.** Cook Mode reads the structured data sites publish for search engines and recipe cards. It doesn't scrape layouts, get around bot walls or pretend to be a browser: its User-Agent says what it is. When a site says no, Cook Mode accepts that.
- **It keeps nothing.** Recipe text isn't stored anywhere beyond a 10-minute HTTP cache header, and the service worker never caches recipe content. The creator's page stays the source of truth.

The goal is to be a better way to cook a creator's recipe, not a replacement for their site.

## Deploying to Cloudflare Pages

Cloudflare Pages builds from GitHub: every push to `main` deploys to production, and every other branch or pull request gets its own preview URL. No `wrangler.toml` is needed.

| Setting                | Value                                                                      |
| ---------------------- | -------------------------------------------------------------------------- |
| Framework preset       | None                                                                       |
| Build command          | `npm run build` (also generates the service worker)                        |
| Build output directory | `out`                                                                      |
| Root directory         | _(leave empty)_                                                            |
| Functions directory    | `functions` at the repo root; detected automatically, nothing to configure |
| Node version           | 22, from `.node-version` (or set the `NODE_VERSION` environment variable)  |
| Environment variables  | None. There are no API keys or secrets.                                    |

If the project name `cookmode` is taken and Cloudflare assigns a different `*.pages.dev` address, update the `+https://cookmode.pages.dev` link in the User-Agent in `functions/api/recipe.ts`, so sites can see who is fetching their pages.
