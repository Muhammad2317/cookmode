# UI standards

The rules every Cook Mode screen is held to. They derive from the brief in `CLAUDE.md` (which wins
on any conflict) and the reality of the use case: a phone propped against a jar, read from 1–2 m,
touched with wet or floury hands. Phase 2's `/styleguide` turns these into concrete tokens.

## Standards

1. **Readable from 1–2 m.** Step text 28–36px on a phone, body ≥ 18px. Text contrast WCAG AAA
   (7:1) in light _and_ dark mode, with dark mode checked separately (see APCA below).
2. **Messy-thumb targets.** Cook-mode controls ≥ 56px; everything else ≥ 44px (WCAG 2.5.5 AAA).
   Primary actions sit in the bottom half of the screen, within thumb reach.
3. **One primary action per screen.**
4. **Flat, high contrast.** No gradients, glass/blur, glows, or shadows on things at rest. Surfaces
   are separated by a step in tone, not by lines.
5. **Type.** One family (two at most), 3–4 sizes, tabular figures for timers and quantities so
   digits don't shift as they change.
6. **Colour.** One ground, one ink, one accent. The accent is reserved for actions and timer states.
   Colour never carries meaning on its own (always paired with text, shape or position).
7. **Motion.** Transform and opacity only, 150–300ms, one easing family, and a
   `prefers-reduced-motion` fallback that keeps content and drops travel. No decorative motion.
   (So: a timer shows progress as a `scaleX` bar, not an SVG ring animated via `stroke-dashoffset`.)
8. **Nothing jumps.** Skeletons that match the real layout, no spinners, image space reserved with
   `aspect-ratio`. Target CLS ≈ 0.
9. **The platform first.** Native `<button>`, `<dialog>`, `<ol>`, `<input>`; visible focus rings;
   arrow keys between steps, space for the timer; live-region announcements for step changes and
   timer completion.
10. **Light.** Minimal dependencies, nothing third-party at runtime; prefer built-in APIs (native
    dialog, Screen Wake Lock, Web Audio, Vibration) over libraries.
11. **Attribution is always visible.** Author and site above the fold, never visually demoted.
12. **Plain words.** Sentence case, no tiny uppercase labels, errors say what happened and what to do.
13. **Phone first, intentional on desktop.** Constrained measure and deliberate layout on wide
    screens, never a stretched phone UI.

## Component patterns (decided)

| Need              | Approach                                                                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ingredients sheet | Native `<dialog>` + `showModal()`: bottom sheet on phones, centred dialog on wide screens. Gives focus containment, Escape, inert background and focus return for free. CSS transform for the slide. |
| Servings stepper  | APG spinbutton semantics with large +/− buttons (≥ 56px); arrow keys adjust; value announced.                                                                                                        |
| Step progress     | Segmented bar plus visible "Step 3 of 9" text (text carries the meaning; the bar is reinforcement).                                                                                                  |
| Timer             | End-timestamp model; `scaleX` progress bar; tabular figures; live-region announcement + Web Audio beep + vibration on finish.                                                                        |
| Errors            | GOV.UK-style: say what went wrong and how to fix it, never colour alone, page title reflects the error, always offer the link to the original recipe.                                                |
| Loading           | Skeleton matching the overview layout; opacity pulse only, disabled under reduced motion.                                                                                                            |

## Typeface candidate

**Atkinson Hyperlegible Next** (Braille Institute, OFL): designed specifically for low-vision legibility,
with clearly differentiated letterforms (I/l/1, 0/O), variable weight 200–800. It is in `next/font/google`'s
font list in our installed Next.js, so it self-hosts at build time with no extra dependency. One of the
pairings the Phase 2 styleguide will present.

## References

- [WAI-ARIA Authoring Practices Guide: patterns](https://www.w3.org/WAI/ARIA/apg/patterns/): spinbutton, dialog (modal) semantics and keyboard behaviour.
- [Native `<dialog>` for accessible modals](https://blog.openreplay.com/accessible-modals-dialog-vs-library/): why `showModal()` beats a library; Baseline since 2022.
- [WCAG 2.2 target size](https://smashingmagazine.com/2024/07/getting-bottom-minimum-wcag-conformant-interactive-element-size/): 24px AA minimum vs 44px AAA (2.5.8 / 2.5.5).
- [APCA introduction](https://github.com/myndex/apca-introduction) and [Bath University on contrast](https://blogs.bath.ac.uk/digital-content-and-development/2024/11/08/the-times-they-are-a-changin-for-how-we-measure-colour-contrast/): why dark-mode pairs need checking beyond WCAG 2 ratios. WCAG 2.2 remains the compliance bar; APCA is a legibility cross-check.
- [Contrast checker (WCAG + APCA, runs in-browser)](https://toools.cloud/design-tools/contrast-checker/).
- [GOV.UK Design System: error message](https://design-system.service.gov.uk/components/error-message): plain-language error pattern.
- [Inclusive Components](https://smashingmagazine.com/2019/12/inclusive-components-release) and [Building inclusive toggle buttons](https://www.smashingmagazine.com/2017/09/building-inclusive-toggle-buttons/) (Heydon Pickering): live-region notifications, toggles.
- [Screen Wake Lock API (Chrome for Developers)](https://developer.chrome.com/docs/capabilities/web-apis/wake-lock): re-acquire on `visibilitychange`. Safari caveat: see [WebKit bug 255363](https://bugs.webkit.org/show_bug.cgi?id=255363) (re-request may need a user gesture), so test on iOS.
- [Atkinson Hyperlegible Next on Fontsource](https://fontsource.org/fonts/atkinson-hyperlegible-next/about): specimen and weights.
