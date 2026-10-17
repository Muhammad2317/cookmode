import type { Metadata } from "next";
import type { ReactNode } from "react";
import { contrastLevel, contrastRatio } from "../../../lib/contrast";
import {
  PALETTE,
  TEXT_PAIRS,
  TOKEN_ROLES,
  type ThemeName,
} from "../../../lib/designTokens";
import { Button, IconButton } from "@/components/Button";
import { ArrowRight, ExternalLink, List } from "@/components/icons";
import { TimerChip } from "@/components/TimerChip";
import {
  archivoHeading,
  interText,
  interTightHeading,
  publicSansText,
} from "./fonts";
import { MotionDemo, ServingsDemo, TimerChipDemo } from "./InteractiveDemos";
import { StepScreenPreview } from "./StepScreenPreview";

export const metadata: Metadata = {
  title: "Styleguide · Cook Mode",
  robots: { index: false, follow: false },
};

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex scroll-mt-8 flex-col gap-8 py-16 sm:py-24"
    >
      <div className="flex max-w-[60ch] flex-col gap-3">
        <h2 id={`${id}-title`} className="font-display text-display font-bold">
          {title}
        </h2>
        {intro && <p className="text-body text-muted">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Typography options

const PAIRINGS = [
  {
    id: "a",
    name: "Atkinson Hyperlegible Next",
    detail: "One family for everything",
    why: "Designed by the Braille Institute for low-vision readers: I, l and 1, and 0 and O, can't be confused, and the open shapes survive distance, steam and a smudged screen. Built for this exact job.",
    className: "",
    displayClass: "font-bold",
    recommended: true,
  },
  {
    id: "b",
    name: "Inter Tight + Inter",
    detail: "Tight display, neutral text",
    why: "The safe, Swiss choice. Excellent figures and very even colour, but its uniform shapes are less distinct at a distance, and it is everywhere, so Cook Mode would look like every other app.",
    className: `${interText.variable} ${interTightHeading.variable}`,
    displayClass: "font-bold tracking-[-0.03em]",
    recommended: false,
  },
  {
    id: "c",
    name: "Archivo Condensed + Public Sans",
    detail: "Kitchen-signage display, civic text",
    why: "Condensed bold headings feel like a market chalkboard and fit long titles at huge sizes; Public Sans (built for US government services) keeps body text plain. More character, but two voices.",
    className: `${publicSansText.variable} ${archivoHeading.variable}`,
    displayClass: "font-extrabold [font-stretch:68%]",
    recommended: false,
  },
];

function TypePairings() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PAIRINGS.map((p) => (
        <article
          key={p.id}
          className={`${p.className} rounded-surface flex flex-col gap-5 p-6 ${p.recommended ? "bg-ink text-ground" : "bg-surface"}`}
        >
          <div className="flex flex-col gap-1">
            <p className="text-small font-semibold">
              Option {p.id.toUpperCase()}
              {p.recommended && " · Recommended"}
            </p>
            <h3 className="text-title font-bold">{p.name}</h3>
            <p className="text-small">{p.detail}</p>
          </div>
          <p className={`font-display text-display ${p.displayClass}`}>
            Lemon pasta
          </p>
          <p className="text-step font-medium">
            Simmer for 10–12 minutes until glossy.
          </p>
          <p className="text-body">
            1½ cups flour · 400g spaghetti · 2 tbsp oil
          </p>
          <p
            className="text-title font-bold tabular-nums"
            aria-label="Timer digits sample"
          >
            12:05 → 11:59
          </p>
          <p className="text-title" aria-label="Legibility test characters">
            Il1 O0 rn m 6b 9g
          </p>
          <p className="text-small mt-auto">{p.why}</p>
        </article>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Colour

function Palette({ theme }: { theme: ThemeName }) {
  const tokens = PALETTE[theme];
  return (
    <div
      className={`theme-${theme} rounded-surface bg-ground text-ink flex flex-col gap-6 p-6`}
    >
      <h3 className="text-title font-bold">
        {theme === "light" ? "Light" : "Dark"}
      </h3>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Object.entries(tokens).map(([name, hex]) => (
          <li key={name} className="flex flex-col gap-2">
            <span
              aria-hidden="true"
              className="block aspect-[4/3] rounded-[0.75rem]"
              style={{
                background: hex,
                boxShadow:
                  hex === tokens.ground
                    ? `inset 0 0 0 2px ${tokens.line}`
                    : undefined,
              }}
            />
            <span className="text-small font-semibold">{name}</span>
            <span className="text-small text-muted tabular-nums">{hex}</span>
            <span className="text-small text-muted">{TOKEN_ROLES[name]}</span>
          </li>
        ))}
      </ul>
      <table className="text-small w-full text-left tabular-nums">
        <caption className="mb-2 text-left font-semibold">
          Text contrast (WCAG 2.2)
        </caption>
        <thead>
          <tr className="text-muted">
            <th scope="col" className="py-1 font-normal">
              Text on background
            </th>
            <th scope="col" className="py-1 font-normal">
              Ratio
            </th>
            <th scope="col" className="py-1 font-normal">
              Level
            </th>
          </tr>
        </thead>
        <tbody>
          {TEXT_PAIRS.map(([fg, bg]) => {
            const ratio = contrastRatio(tokens[fg], tokens[bg]);
            return (
              <tr key={`${fg}-${bg}`}>
                <th scope="row" className="py-1 font-normal">
                  <span
                    className="rounded-[0.375rem] px-2 py-0.5"
                    style={{ color: tokens[fg], background: tokens[bg] }}
                  >
                    {fg} on {bg}
                  </span>
                </th>
                <td className="py-1">{ratio.toFixed(2)}:1</td>
                <td className="py-1 font-semibold">{contrastLevel(ratio)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scale, space, motion data

const TYPE_SCALE = [
  {
    token: "display",
    sample: "Lemon pasta",
    phone: 40,
    desktop: 72,
    use: "Recipe titles, finish screen",
    cls: "text-display font-bold font-display",
  },
  {
    token: "step",
    sample: "Fry the onions until soft.",
    phone: 30,
    desktop: 44,
    use: "Cook-mode step text",
    cls: "text-step font-medium",
  },
  {
    token: "title",
    sample: "Ingredients",
    phone: 24,
    desktop: 32,
    use: "Section headings, timer digits",
    cls: "text-title font-bold",
  },
  {
    token: "body",
    sample: "Recipe by Sam Baker · Example Recipes",
    phone: 18,
    desktop: 20,
    use: "Ingredients, descriptions, buttons",
    cls: "text-body",
  },
  {
    token: "small",
    sample: "Step 4 of 9 · Screen on",
    phone: 16,
    desktop: 16,
    use: "Metadata only. Never smaller",
    cls: "text-small",
  },
];

const SPACING = [4, 8, 12, 16, 24, 32, 48, 64, 96];

const MOTION = [
  {
    token: "press",
    ms: "100ms",
    easing: "ease-out",
    use: "Button press: scale to 0.97",
  },
  {
    token: "quick",
    ms: "180ms",
    easing: "ease-out",
    use: "Chips changing state, small fades",
  },
  {
    token: "step",
    ms: "280ms",
    easing: "ease-out",
    use: "Step change: 24px slide + fade",
  },
  {
    token: "sheet",
    ms: "320ms",
    easing: "ease-out in / ease-in out",
    use: "Ingredients sheet",
  },
];

// ---------------------------------------------------------------------------

export default function StyleguidePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8">
      <header className="flex flex-col gap-6 pt-12 pb-8 sm:pt-20">
        <p className="text-body font-semibold">
          Cook Mode · Design system proposal
        </p>
        <h1 className="font-display text-display max-w-[16ch] font-bold">
          Kitchen minimal, readable from across the room.
        </h1>
        <p className="text-body text-muted max-w-[60ch]">
          Stark, high-contrast and almost without decoration, so a phone propped
          against a jar can be read from one to two metres away. Every choice
          here is checked against{" "}
          <span className="text-ink font-semibold">docs/UI-STANDARDS.md</span>.
          Nothing is locked until approved.
        </p>
        <nav
          aria-label="Styleguide sections"
          className="text-body flex flex-wrap gap-x-6 gap-y-3"
        >
          {[
            ["type", "Typefaces"],
            ["colour", "Colour"],
            ["scale", "Type scale"],
            ["space", "Space & shape"],
            ["components", "Components"],
            ["screen", "Step screen"],
            ["motion", "Motion"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="tap-min inline-flex items-center underline decoration-2 underline-offset-4"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <Section
        id="type"
        title="Typefaces"
        intro="Three free, self-hosted options (next/font downloads them at build time, so no request reaches a font CDN). Each card renders in its own fonts."
      >
        <TypePairings />
      </Section>

      <Section
        id="colour"
        title="Colour"
        intro="One ground, one ink, one accent. The accent is a deep paprika, reserved for running timers and selection. Every text pair is AAA (7:1 or more), computed below rather than eyeballed, and a unit test fails the build if a token drifts."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Palette theme="light" />
          <Palette theme="dark" />
        </div>
      </Section>

      <Section
        id="scale"
        title="Type scale"
        intro="Five sizes, fluid between a 375px phone and a 1280px desktop. Weight and size do the work; there are no tiny uppercase labels."
      >
        <ul className="flex flex-col gap-8">
          {TYPE_SCALE.map((t) => (
            <li
              key={t.token}
              className="grid gap-2 sm:grid-cols-[12rem_1fr] sm:gap-8"
            >
              <div className="text-small">
                <p className="font-semibold">{t.token}</p>
                <p className="text-muted tabular-nums">
                  {t.phone}px → {t.desktop}px
                </p>
                <p className="text-muted">{t.use}</p>
              </div>
              <p className={t.cls}>{t.sample}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="space"
        title="Space & shape"
        intro="A 4px base. Controls are fully round, surfaces have a 20px radius, decided once. No lines and no shadows: surfaces are separated by a step in tone."
      >
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <h3 className="text-title font-bold">Spacing</h3>
            <ul className="flex flex-col gap-2">
              {SPACING.map((px) => (
                <li
                  key={px}
                  className="text-small flex items-center gap-4 tabular-nums"
                >
                  <span className="text-muted w-12">{px}px</span>
                  <span
                    className="rounded-control bg-ink h-4"
                    style={{ width: px * 2 }}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-title font-bold">Radius</h3>
            <div className="flex items-end gap-4">
              <div className="flex flex-col items-center gap-2">
                <span className="rounded-control bg-surface block h-14 w-28" />
                <span className="text-small text-muted">control · full</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="rounded-surface bg-surface block size-28" />
                <span className="text-small text-muted">surface · 20px</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-title font-bold">Tap targets</h3>
            <div className="flex items-end gap-4">
              {[
                [44, "minimum"],
                [56, "cook mode"],
                [64, "main action"],
              ].map(([px, label]) => (
                <div key={px} className="flex flex-col items-center gap-2">
                  <span
                    className="rounded-control bg-ink block"
                    style={{ width: px as number, height: px as number }}
                  />
                  <span className="text-small text-muted text-center tabular-nums">
                    {px}px
                    <br />
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="components"
        title="Components"
        intro="Built on native elements. Pressing scales slightly (transform only); focus shows a 3px ink ring. Try the keyboard: Tab to a control, arrows on the servings value."
      >
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h3 className="text-title font-bold">Buttons</h3>
            <Button size="cta" className="w-full sm:w-auto">
              Start cooking
              <ArrowRight />
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary">
                <List />
                Ingredients
              </Button>
              <Button variant="quiet">
                View original recipe
                <ExternalLink size={20} />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <IconButton label="Next step" variant="primary">
                <ArrowRight />
              </IconButton>
              <IconButton label="Ingredients">
                <List />
              </IconButton>
              <Button disabled>Disabled</Button>
              <Button variant="secondary" className="focus-ring">
                Focus ring
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-title font-bold">Servings, scaling live</h3>
            <ServingsDemo />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <h3 className="text-title font-bold">Timer chip</h3>
            <p className="text-body text-muted">
              Detected durations become chips inside the step text. State is
              carried by the words and icon, not colour alone. The live chip
              below is a real 10-second timer: tap to start, tap to pause.
            </p>
            <div className="text-step flex flex-wrap items-center gap-4">
              <TimerChip label="10–12 minutes" />
              <TimerChip
                label="10–12 minutes"
                state="running"
                remaining={583}
              />
              <TimerChip label="10–12 minutes" state="paused" remaining={583} />
              <TimerChip label="10–12 minutes" state="done" />
            </div>
            <TimerChipDemo />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <h3 className="text-title font-bold">Attribution block</h3>
            <p className="text-body text-muted">
              Always above the fold on the overview, never smaller than body
              text, always linked.
            </p>
            <div className="rounded-surface bg-surface flex max-w-xl flex-col gap-1 p-5">
              <p className="text-body">
                Recipe by <span className="font-bold">Sam Baker</span> · Example
                Recipes
              </p>
              <a
                href="#components"
                className="text-body inline-flex items-center gap-2 font-semibold underline decoration-2 underline-offset-4"
              >
                View the original recipe
                <ExternalLink size={20} />
              </a>
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="screen"
        title="Step screen"
        intro="One step per screen. Section name, giant step text with an inline timer chip, a timer started on an earlier step still visible, and every control 56px or larger within thumb reach."
      >
        <div className="rounded-surface bg-surface grid grid-cols-1 gap-10 p-2 sm:p-10 md:grid-cols-2">
          <StepScreenPreview theme="light" />
          <StepScreenPreview theme="dark" />
        </div>
      </Section>

      <Section
        id="motion"
        title="Motion"
        intro="Motion explains where things went; it never decorates. Only transform and opacity animate, so it stays at 60fps. With reduced motion, everything still fades, but nothing travels."
      >
        <div className="grid gap-10 lg:grid-cols-2">
          <table className="text-body w-full self-start text-left tabular-nums">
            <thead>
              <tr className="text-small text-muted">
                <th scope="col" className="pb-2 font-normal">
                  Token
                </th>
                <th scope="col" className="pb-2 font-normal">
                  Duration
                </th>
                <th scope="col" className="pb-2 font-normal">
                  Used for
                </th>
              </tr>
            </thead>
            <tbody>
              {MOTION.map((m) => (
                <tr key={m.token}>
                  <th scope="row" className="py-2 pr-4 font-semibold">
                    {m.token}
                  </th>
                  <td className="py-2 pr-4">{m.ms}</td>
                  <td className="py-2">{m.use}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-small text-muted pt-4">
                  Easing: enter cubic-bezier(0.2, 0, 0, 1) · exit
                  cubic-bezier(0.4, 0, 1, 1). One family throughout.
                </td>
              </tr>
            </tfoot>
          </table>
          <MotionDemo />
        </div>
      </Section>
    </main>
  );
}
