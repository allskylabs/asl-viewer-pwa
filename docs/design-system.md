# AllSkyLabs Viewer — Design System

Single source of truth for the visual system introduced in v0.4.0 on branch
`ui/allskylabs-theme-polish`. All values live as CSS custom properties in
`src/styles/global.css` (`:root`). New UI must use tokens, not literal colors.

## Principles

- **Premium observatory console**: dark, calm, technically credible. Not a
  generic admin dashboard, not a toy space theme.
- **Night-sky surfaces**: deep desaturated navy, never pure flat black for
  panels. Pure `#000` is reserved for the image/video viewports, where the sky
  imagery itself should be the darkest thing on screen.
- **Critical status first**: device state and capture freshness are always
  visible at a glance; dense telemetry is collapsible and secondary.
- **Color is never the only signal**: every status color is paired with a text
  label, dot shape/ring, or both.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `--bg-primary` | `#060b16` | Page background (under a subtle sky gradient) |
| `--bg-secondary` | `#0c1322` | Panels, header, left rail |
| `--bg-tertiary` | `#121b30` | Raised cards, panel headers, chips, inputs |
| `--bg-hover` | `#18233e` | Hover state for interactive surfaces |
| `--border` | `#1e2c49` | Default hairline borders |
| `--border-light` | `#2c3e63` | Hover borders, scrollbar thumbs |
| `--text-primary` | `#e9eff9` | Headings, values |
| `--text-secondary` | `#9fb0ca` | Body, secondary labels |
| `--text-muted` | `#66758f` | Captions, fine print (smallest readable tier) |
| `--accent` | `#5aa7ff` | AllSkyLabs blue: links, active states, focus |
| `--accent-bright` | `#8cc5ff` | Hover text on accent elements |
| `--accent-dim` | `#2e6fd8` | Accent borders, active pill fills |
| `--accent-soft` / `--accent-soft-strong` | 8% / 14% accent | Tinted fills (rest / hover) |
| `--green` | `#3ecf8e` | Online / healthy / success — calm, not neon |
| `--yellow` | `#e3b341` | Stale / warning — visible, not panic |
| `--red` | `#ff6b66` | Offline / error — unmistakable |
| `--purple` | `#c297ff` | Capture mode tags |
| `--orange` | `#f0883e` | Reserved (secondary warnings) |

Page background adds a faint radial glow at the top horizon plus a vertical
gradient — sky-inspired depth without texture or noise.

## Typography

- Base `14px`, system sans stack (`--font-sans`); no webfont dependency.
- Monospace (`--font-mono`) + `font-variant-numeric: tabular-nums` for all
  timestamps, counters, and telemetry values — no layout jitter on refresh.
- Hierarchy: panel titles are small uppercase with `0.08em` tracking; section
  titles inside panels use the accent color; labels are muted; values are
  primary. Smallest text tier is ~`0.6rem` (8.4px) — do not go below.

## Spacing & shape

- Spacing scale: `--space-1` (4px) … `--space-5` (21px). Use the scale; avoid
  arbitrary values.
- Radii: `--radius-sm` 5px (buttons, inputs), `--radius-md` 8px (cards),
  `--radius-lg` 12px (panels), `--radius-full` (pills, chips, badges).
- Elevation: panels = `--shadow-md` + `--panel-edge` (1px top highlight);
  cards inside panels = border + `--panel-edge` only. No heavy glows.

## Status treatment

- **Online**: mint dot with soft ring + glow, green pill badge. Calm.
- **Stale**: amber dot with ring, amber pill badge. Noticeable, not alarming.
- **Offline**: coral dot with wider flat ring (no glow — it should look
  "dead"), red pill badge.
- Badges always carry the status word (`online` / `stale` / `offline`).

## Interaction

- Ghost-accent buttons: transparent fill, `--accent-dim` border, accent text;
  hover fills with `--accent-soft-strong`. Primary/filled buttons (future) use
  `--accent-dim` fill with white text (see active time-range pill).
- Global `:focus-visible` 2px accent ring; `prefers-reduced-motion` collapses
  all transitions/animations.
- Touch targets ≥44px at the ≤900px breakpoint.

## Layout

- Desktop: header / left rail (devices + status cards, 232px) / main column
  (viewer, timelapses, time nav, filmstrip) / right sidebar (metadata, 320px).
- ≤900px: single column — devices, viewer, time nav, filmstrip, timelapses,
  metadata. The rail's status cards hide (the viewer tags carry that info).
- Breakpoints: 1100 / 900 / 700 / 480.

## Placement guidance for planned features (not yet built)

- **Timelapse browser (exists) / richer media browsing**: stays in the main
  column as a toggleable panel; if it grows, promote to a full-width view
  behind a header-level view switch.
- **Time scroller / jump-to-time**: extend the existing `time-nav` row beneath
  the capture viewer; a scrubber should sit directly under the viewer image,
  full width, using `--bg-tertiary` track + accent thumb.
- **Weather view vs Astro view**: header-level segmented control (pill pair,
  same style as time-range pills) to the left of the clock. Views re-skin
  emphasis (which metadata sections are expanded, overlay defaults) — they do
  not change layout.
- **Device comparison**: a second device selection in the left rail spawning a
  split main column; defer until requested.
- **Image quality indicators**: small pills in the `latest-image__meta` tag
  row (already pill-styled); reuse status colors.
- **Cloud processing outputs (denoise/SCNR/sharpened)**: variant switcher as
  pills in the capture viewer panel header, next to capture-nav.
- **Detection overlays (meteor/satellite/aircraft)**: toggle chips overlaid
  bottom-left of the viewer viewport; canvas/SVG layer above the `<img>`.
- **Advanced settings**: gear icon at the far right of the header opening a
  settings panel/sheet. Per-device admin detail belongs on a future device
  detail page, not in the main viewer.
