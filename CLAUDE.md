# Build "Cook Mode" — MVP

You are building the MVP of Cook Mode: a web app where a user pastes a recipe URL and gets a clean, full-screen, step-by-step cooking view with timers, serving scaling and a screen that stays awake. It must credit and link back to the original creator prominently. This is a portfolio piece, so craft matters: it must feel smooth, look stunning in a minimal way, and be technically clean.

First action: save this entire prompt as CLAUDE.md in the project root so it persists across sessions. Then create DECISIONS.md and log every non-trivial decision you make (one line: what, why, alternatives considered).

## About me and how to work with me

- I have some coding experience. Explain decisions and commands briefly as you go (one or two sentences), not tutorials.
- Work in the phases below. At the end of each phase, give me a short summary: what you built, how to see it, anything you're unsure about.
- HARD CHECKPOINTS — stop and wait for my explicit approval before:
  1. Any `git push`, adding a remote, or changing repository settings or visibility. Local commits are fine and encouraged (small, descriptive).
  2. Locking in the design system (fonts, colour palette, type scale, spacing, motion). See Phase 2.
- Beyond those, if you hit anything big or hard to undo (deleting files you didn't create, rewriting git history, changing the architecture below, anything that could cost money), stop and ask. Everything else: decide, log it in DECISIONS.md, keep moving.

## Locked decisions (do not change without asking)

- Framework: Next.js (App Router) + TypeScript, built with `output: 'export'` (fully static). No Next.js API routes, no server rendering, `images: { unoptimized: true }`.
- Backend: exactly one Cloudflare Pages Function at `/functions/api/recipe.ts`, which fetches a URL and returns normalised recipe JSON.
- Hosting: Cloudflare Pages free tier, served at cookmode.pages.dev (or the closest available variant).
- Styling: Tailwind CSS.
- Visual direction: "Kitchen minimal". Stark, high-contrast, huge type, almost no decoration. Readable from 1–2 metres away on a phone propped against a jar. Light and dark mode following system preference.
- Test sites: a UK + US mix (see Phase 1).

## Zero-cost rules (non-negotiable)

- No paid services, paid APIs, API keys, or paid fonts. No domain purchase.
- No analytics, trackers, cookies, accounts, or databases.
- No third-party scripts or CDNs at runtime. Fonts must be self-hosted (next/font is fine; it downloads at build time).
- Stay within the Cloudflare free tier. Note that free Workers/Functions have a tight CPU-time budget per request, so extraction must be lightweight: use the built-in HTMLRewriter or targeted string scanning to grab `<script type="application/ld+json">` blocks. Do NOT use jsdom, cheerio, or any full DOM parser.
- Keep dependencies minimal. Prefer writing small utilities over adding packages. Log every dependency added in DECISIONS.md with a reason.

## Phase 0 — Setup

- Check my environment (Node version, git, npm) and tell me if anything needs installing.
- Scaffold the project, set up Tailwind, Vitest, ESLint, Prettier and `git init`.
- Set up a local dev workflow where the Next.js frontend and the Pages Function run together (e.g. build + `wrangler pages dev`, or a dev proxy). Document the exact commands in README.md. Wrangler is a dev dependency and free.

## Phase 1 — Extraction engine (function + parser)

The function at `GET /api/recipe?url=...` must:

- Accept only http/https URLs, reject localhost and private/internal IP ranges, enforce a timeout (~8s) and a max response size (~3 MB), and send an honest User-Agent identifying Cook Mode.
- Find every JSON-LD block, tolerate messy JSON (HTML entities, stray whitespace, occasional trailing commas), and locate the Recipe node even when it's inside `@graph`, inside an array, or has `@type` as an array (e.g. `["Recipe", "NewsArticle"]`).
- Normalise into one clean TypeScript type:
  - title, description
  - author name(s): string | Person | Organization | array → string[]
  - site name (from og:site_name or hostname)
  - canonical source URL
  - image: string | ImageObject | array → one best URL
  - yield: "Serves 4", 4, ["4", "4 servings"] → { count: number | null, label: string }
  - prepTime / cookTime / totalTime (ISO 8601 durations like PT1H15M → minutes)
  - ingredients: string[]
  - steps: plain string with newlines | HowToStep[] | HowToSection[] (with itemListElement) → an ordered list of steps, each with optional section name, text stripped of HTML and decoded entities
- Return ONLY the normalised recipe fields, never raw HTML. Store and cache nothing beyond a short Cache-Control header.
- Return typed errors the UI can show nicely: INVALID_URL, FETCH_FAILED, BLOCKED (403/429/bot walls), TIMEOUT, NO_RECIPE_FOUND, TOO_LARGE.

Pure-logic modules (in `/lib`, framework-free, fully unit-tested with Vitest):

- `parseRecipe` (JSON-LD → normalised recipe). Test with small SYNTHETIC fixtures that mimic real-world structures. Do not commit copies of real web pages.
- `parseDuration` (ISO 8601 → minutes)
- `detectTimers` (step text → timer suggestions): handles "10 minutes", "1 hour 15 mins", "1½ hours", "45 secs", "10–12 minutes" (start at the lower bound and show the range), "an hour", "a few minutes" (ignore), "overnight" (ignore).
- `scaleIngredient`: scales only the leading quantity. Handles integers, decimals, unicode fractions (½ ⅓ ¼ ¾ ⅛), "1 1/2", ranges ("2-3"), "1 x 400g tin" (scale the 1, not the 400g). Render friendly fractions for cups/spoons/counts and sensibly rounded numbers for g/ml. Leave anything unparseable ("a pinch of salt", "salt to taste") untouched.

Manual live test list: verify extraction against roughly 10 real sites across the UK and US (for example BBC Good Food, Olive, Delicious, The Guardian, RecipeTin Eats, Allrecipes, Serious Eats, Bon Appétit, Budget Bytes, Sally's Baking Addiction). Swap any that block or lack structured data for others, and record results in a table in README.md (site / works? / notes).

## Phase 2 — Design system → HARD CHECKPOINT

Before building any real screens, create a `/styleguide` page showing:

- 2–3 font pairing options (free, self-hostable) with a recommendation
- the colour palette in light and dark mode (high contrast, WCAG AAA for body and step text where possible)
- the type scale (step text should be very large, roughly 28–36px on a phone)
- spacing and radius tokens, button styles, the timer chip, and a sample step screen
- motion principles (durations, easing)
  Then STOP and tell me how to view it. Do not continue until I approve or revise it.

## Phase 3 — Screens

1. **Home**: one big input ("Paste a recipe link"), a go button, and pasting from the clipboard should feel instant. A one-line explanation that Cook Mode credits creators and links back.
2. **Overview**: image, title, a prominent attribution block ("Recipe by [Author] · [Site]", linked to the original, visible without scrolling), times, a servings stepper that scales ingredients live, the ingredient list, and a large "Start cooking" button.
3. **Cook mode**: full-screen, one step per screen, giant readable text, section name if any, step X of Y progress. Advance by swipe or by huge tap targets (≥56px). Detected times render as tappable timer chips. Ingredients are reachable from a bottom sheet without leaving the step.
4. **Timer**: one active timer at a time (architect it so multiple timers are easy later). Store the END TIMESTAMP, not a ticking counter, so it stays accurate when the tab is backgrounded. Keep it visible across steps. On finish: vibration (where supported) plus a beep generated with Web Audio (no audio files), and a clear visual state.
5. **Screen Wake Lock**: request on entering cook mode, re-request on visibilitychange, release on exit, show a small "Screen stays on" indicator, and fail silently where unsupported.
6. **Finish screen**: "Enjoyed it? Thank [Author] by visiting the original recipe." with a big button to the source.
7. **Error states** for every error type from Phase 1, each with a friendly message and a link to open the original page.

The URL is the state: `/?url=...` should load the recipe directly so views are shareable (read search params client-side inside a Suspense boundary, as required for static export). Recipe views must set `<meta name="robots" content="noindex">` so Cook Mode never competes with creators in search.

## Phase 4 — Smoothness and polish

- Performance targets: Lighthouse mobile Performance ≥ 95, Accessibility = 100, CLS ≈ 0. Keep the cook-mode JS bundle small and report its gzipped size.
- Animate only transform and opacity, aim for 60fps step transitions, and respect prefers-reduced-motion.
- Show a skeleton loading state that matches the overview layout (no spinners, no layout jumps).
- Accessibility: full keyboard navigation (arrow keys between steps, space to start/pause a timer), visible focus states, proper labels, screen-reader announcement on step change and timer completion.
- PWA: a manifest and icons (simple, original, generated in code — no stock assets), plus a service worker that caches the app shell only, never recipe content.
- Test on a narrow phone viewport, a large phone, a tablet and desktop. Desktop should look intentional, not stretched.

## Phase 5 — Ship prep → HARD CHECKPOINT

- Final README: what it is, screenshots placeholders, how to run locally, architecture overview, the live test table, and a short "Why attribution is a design decision" section.
- Give me step-by-step instructions for creating a GitHub repo and connecting it to Cloudflare Pages (build command, output directory, functions directory).
- STOP and ask me before any push, remote setup, or repository visibility choice.

## Definition of done

- Works end-to-end on at least 8 of the 10 tested sites, with graceful errors on the rest.
- All `/lib` unit tests pass.
- Usable one-handed on a phone, the screen doesn't sleep in cook mode, and timers survive backgrounding.
- Performance and accessibility targets above are met, with numbers reported.
- Zero running costs, zero API keys, zero trackers.

Start with Phase 0.

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/` (gitignored, so they stay on this machine). See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root, created only when a term or decision is actually settled. See `docs/agents/domain.md`.
