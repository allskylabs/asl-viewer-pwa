# UI Polish Pass — Progress

Branch: `ui/allskylabs-theme-polish` (branched from `master` @ 97890c5)
Status: **Checkpoints 1–2 complete and committed. Build green.**

## Goal

Elevate the viewer from "engineering dashboard" to a polished AllSkyLabs
product: night-sky navy theme, design tokens, consistent panels/buttons/
status treatment, better header, accessibility fixes. No functional changes
to data fetching, refresh, or navigation logic.

## Completed

### Checkpoint 1 — theme overhaul (commit a1311d9)

- `src/styles/global.css`: full token + theme rewrite. **All class names and
  CSS variable names kept identical** — components untouched except the small
  accessibility edits below. Night-sky navy palette, sky-gradient body
  background, spacing scale, `--radius-full`, `--accent-soft(-strong)`,
  `--panel-edge`, refined shadows, global `:focus-visible`, `::selection`,
  `prefers-reduced-motion`.
- Header: logo 88px → 52px (44/38/30 at breakpoints), clock chip, gradient
  accent hairline (replaces inset 2px stripe).
- Status: mint/amber/coral; dots get rings+glow; badges became bordered pills.
- Tags/pills: capture meta tags and filter pills use `--radius-full`;
  tabular-nums everywhere numbers update in place.
- `src/components/ImageHistoryGrid.tsx`: thumbnail div → `<button>` with
  `aria-pressed` (keyboard access). CSS updated for button reset.
- `src/components/TimelapseBrowser.tsx` + `LatestImagePanel.tsx`: aria-labels
  on icon-only buttons.
- `index.html` + `public/manifest.json`: theme colors → `#060b16`.
- `.gitignore`: `Thumbs.db`.

### Checkpoint 2 — docs + versioning (this commit)

- `docs/design-system.md`: token reference + placement guidance for future
  features (Weather/Astro switch, time scroller, overlays, settings).
- Version 0.3.1 → **0.4.0**, CHANGELOG entry added.
- This progress file.

## Build/test commands run

- `npm run build` (tsc -b && vite build) — **passing** after checkpoint 1.
  Run again before any further commit.

## Not done / remaining ideas (next iteration)

- Mobile device list could become horizontal scroll chips instead of stacked
  cards (currently fine, just stacked).
- Skeleton loaders for viewer image + filmstrip instead of text-only loading.
- Stale-capture visual cue on the viewer itself (e.g., amber tint on the age
  tag when age > capture interval).
- Header Weather/Astro segmented control (placeholder-level, per design doc).
- Consider extracting a `.btn` utility class family; current per-component
  button classes are consistent but duplicated.

## Known issues

- None known from this pass. Visual QA on a real device list with offline/
  stale devices still needed (dev data had limited states).
- `public/logo-horizontal.png` was already modified by the user before this
  pass — intentionally left uncommitted; do not revert or commit it as part
  of UI work without asking.

## Manual test checklist

Desktop wide (>1100px), tablet (~1000px), phone (~390px):
header/logo/clock/refresh, device list selection + status dots, rail status
cards, capture viewer + prev/next/Latest, filmstrip select + keyboard (tab +
enter, arrow keys for prev/next), time range pills + jump-to-time, timelapse
panel + browser (filters, player, close), metadata sections expand/collapse,
copy buttons, loading state (reload), error state (break .env.local), empty
states, auto-refresh still updates clock + captures.

## If interrupted — suggested next prompt

> Continue the UI polish pass on branch `ui/allskylabs-theme-polish`. Read
> docs/ui-polish-progress.md and docs/design-system.md first. Implement the
> "remaining ideas" list incrementally (skeleton loaders first), keep class
> names stable, run `npm run build` and commit after each coherent change,
> bump version + changelog per repo convention.
