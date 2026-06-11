# Time Scroller / Timeline Navigation — Design & Requirements

**Status:** Draft  
**Version:** 0.1 (planning only — no code changes)  
**Date:** 2026-06-10

---

## Problem Statement

The ASL Viewer currently shows the **latest 30 captures** in a flat thumbnail filmstrip with prev/next navigation. This is adequate for live monitoring, but breaks down when a user needs to investigate a specific time in the past — for example, diagnosing why captures became hazy at 3:30 AM during an overnight astrophotography sequence.

Today the only navigation options are:
- Arrow keys or buttons to step one capture at a time through 30 recent captures
- "Jump to latest" to return to the newest capture

There is no way to jump to a specific time, browse a wider time range, or understand the density and quality of captures across the night. Users who need to investigate must resort to browsing S3 directly.

## User Stories

### Core navigation
1. **Jump to time** — As a user reviewing overnight data, I want to type "3:30 AM" and immediately see the closest capture to that time, so I can investigate a specific event without manually stepping through hundreds of captures.
2. **Range selector** — As a user, I want to choose a time range (last 1h, 6h, 12h, 24h) to scope my browsing window, so I'm not overwhelmed by irrelevant captures.
3. **Custom date/time** — As a user investigating data from two nights ago, I want to pick a specific date and time to jump to.
4. **Visual scrubbing** — As a user, I want to drag a timeline scrubber to move through captures chronologically, so I can visually scan for changes over time.

### Situational awareness
5. **Capture density** — As a user, I want to see at a glance where captures are densely packed vs. where gaps exist, so I can spot outages or rate changes.
6. **Event markers** — As a user, I want to see markers for day/night transitions and timelapse windows on the timeline, so I can orient myself.
7. **Thumbnail preview** — As a user scrubbing the timeline, I want to see a preview thumbnail at the scrubber position before committing, so I can quickly find the right moment.

### Continuity
8. **Filmstrip coexistence** — As a user who likes the current filmstrip, I want it to remain available (at least in Phase 1) and have the scroller augment it rather than replace it.

---

## Proposed UI Behavior

### Range Selector

A horizontal bar above or replacing the current filmstrip area, offering preset time ranges:

| Label       | Behavior                                               |
|-------------|--------------------------------------------------------|
| **Latest**  | Default. Same as today: most recent ~30 captures.      |
| **1h**      | Captures from the last 1 hour.                         |
| **6h**      | Captures from the last 6 hours.                        |
| **12h**     | Captures from the last 12 hours.                       |
| **24h**     | Captures from the last 24 hours.                       |
| **Custom**  | Opens a date/time picker for arbitrary start time.     |

Selecting a range loads captures within that window. The filmstrip thumbnails update to show captures in the selected range (possibly at reduced density for large ranges — e.g., every 5th capture for 24h).

### Jump-to-Time

A time input (clock-style on mobile, text input on desktop) that accepts a time in the user's local timezone. On submit:
1. Find the capture with the closest `timestamp` to the requested time.
2. Select that capture in the main viewer.
3. Center the filmstrip/timeline on that capture.
4. If no capture exists within a reasonable tolerance (e.g., 5 minutes), show a "No captures near this time" message and snap to the closest available.

The jump-to-time input should be accessible from:
- The range selector bar (inline on desktop, dropdown on mobile)
- A keyboard shortcut (e.g., `T` to open, `Enter` to confirm, `Escape` to cancel)

### Timeline Scrubber (Phase 2+)

A horizontal bar representing the selected time range, with:
- **Playhead** — a draggable marker indicating the currently selected capture's time
- **Density track** — a thin visualization showing capture frequency (e.g., bar height = captures per interval)
- **Time labels** — tick marks with time labels at appropriate intervals (every 15m for 1h range, every 1h for 12h, etc.)

Scrubbing behavior:
- **Drag** the playhead to scrub through time. On release, select the nearest capture.
- **Click** anywhere on the timeline to jump to that time.
- **Hover** shows a tooltip with the time and (optionally in Phase 3) a thumbnail preview.
- **Scroll wheel** over the timeline zooms the time range in/out.

---

## Desktop Layout

The current layout is a three-column grid:
```
┌──────────────────────────────────────────────────┐
│  Header (logo, refresh, version)                 │
├────────┬───────────────────────────┬─────────────┤
│ Left   │  Main Content             │  Right      │
│ Rail   │                           │  Sidebar    │
│        │  ┌─────────────────────┐  │  (metadata) │
│ Device │  │  Capture Viewer     │  │             │
│ Select │  └─────────────────────┘  │             │
│        │                           │             │
│ Device │  ┌─────────────────────┐  │             │
│ Status │  │  Timelapse Cards    │  │             │
│        │  └─────────────────────┘  │             │
│        │                           │             │
│        │  ┌─────────────────────┐  │             │
│        │  │  Range Selector     │  │             │  ← NEW
│        │  │  [Latest|1h|6h|...]│  │             │
│        │  ├─────────────────────┤  │             │
│        │  │  Timeline Scrubber  │  │             │  ← Phase 2
│        │  │  ═══●═══════════════│  │             │
│        │  ├─────────────────────┤  │             │
│        │  │  Thumbnail Filmstrip│  │             │
│        │  └─────────────────────┘  │             │
└────────┴───────────────────────────┴─────────────┘
```

Key decisions:
- **Range selector** sits above the filmstrip, inside main content. It replaces the filmstrip's current "Recent Captures" header with interactive range buttons and an optional jump-to-time input.
- **Timeline scrubber** (Phase 2) lives between the range selector and the filmstrip. It is a thin, full-width track.
- The filmstrip continues to show thumbnails, but for the currently selected range rather than always "latest 30."
- Event markers overlay the timeline scrubber track, not the filmstrip.

### Width behavior
- The range selector and timeline scrubber span the full width of `.main-content`.
- At the `≤1100px` breakpoint (right sidebar collapses below main), they still span full width.
- At `≤900px` (left rail collapses), they remain at top of the stacked layout.

---

## Mobile Layout

At `≤700px` (single-column), the time navigation stacks vertically:

```
┌──────────────────────┐
│  Header              │
├──────────────────────┤
│  Device (collapsed)  │
├──────────────────────┤
│  Capture Viewer      │
├──────────────────────┤
│  Range Selector      │  ← pill-style buttons, scrollable row
│  [Latest|1h|6h|...]  │
├──────────────────────┤
│  Jump to Time        │  ← single row: clock input + Go button
├──────────────────────┤
│  Timeline (Phase 2)  │  ← touch-draggable scrubber
├──────────────────────┤
│  Filmstrip           │  ← horizontal scroll, existing behavior
├──────────────────────┤
│  Timelapse Cards     │
├──────────────────────┤
│  Metadata            │
└──────────────────────┘
```

Mobile-specific behavior:
- Range buttons render as a horizontally scrollable row of pill-shaped toggles (44px min touch targets).
- Jump-to-time uses the native `<input type="time">` and `<input type="date">` pickers.
- Timeline scrubber supports touch drag with momentum. A 48px drag handle ensures usability.
- At `≤480px`, the range selector may collapse to a `<select>` dropdown to save vertical space.

---

## Relationship to the Current Filmstrip

The `ImageHistoryGrid` component currently:
- Receives an array of `Capture[]` from `App.tsx`
- Shows thumbnails with time labels
- Supports click-to-select and auto-scroll-to-selected
- Is always scoped to "latest 30 captures"

With the time scroller:
- **Phase 1:** The filmstrip stays as-is. A new `TimeRangeSelector` component is added above it. Selecting a range changes the captures passed to `ImageHistoryGrid`.
- **Phase 2:** A `TimelineScrubber` component is added between the range selector and the filmstrip. The filmstrip now represents a "detail window" — a zoomed-in view of captures near the scrubber position.
- **Phase 3+:** The filmstrip may become optional or replaced by the timeline's thumbnail preview, but this is deferred.

The `listCaptures` service call already supports `{ limit, before }` pagination. Phase 1 will add an `after` parameter and time-range filtering to support range queries.

---

## Time Range Options

### Preset ranges

| Range   | Capture load strategy                                   | Estimated captures* |
|---------|---------------------------------------------------------|---------------------|
| Latest  | `listCaptures(deviceId, { limit: 30 })`                | 30                  |
| 1h      | All captures in `[now-1h, now]`                         | ~60                 |
| 6h      | All captures in `[now-6h, now]`                         | ~360                |
| 12h     | Sample every Nth capture to stay under ~120 thumbnails  | ~720 total, ~120 shown |
| 24h     | Sample every Nth to stay under ~120 thumbnails          | ~1440 total, ~120 shown |
| Custom  | Date/time picker → load captures around that time       | Varies              |

*Assumes ~1 capture/minute, typical AllSky cadence.

### Sampling strategy for large ranges

For ranges that would produce hundreds of captures, the UI should:
1. Fetch a full index of capture IDs + timestamps within the range (lightweight — no image URLs needed).
2. Display sampled thumbnails at even intervals.
3. When the user clicks/scrubs to a specific time, fetch the full capture detail for that point.

This requires a new service method — see [Data Requirements](#data-requirements).

### Custom date/time

- Opens a date picker (calendar) and time picker.
- Defaults to the current date with the time left empty.
- On confirm, behaves like jump-to-time: selects the closest capture and centers the range around it.
- The range selector switches to "Custom" state showing the selected date/time.

---

## Jump-to-Time Behavior

### Interaction flow
1. User activates jump-to-time (clicks input, presses `T`).
2. A focused time input appears. On mobile, native date/time picker opens.
3. User enters a time (and optionally a date, defaulting to today).
4. User confirms (Enter key, "Go" button, or picker confirm).
5. System finds the capture with `timestamp` closest to the target time.
6. That capture is selected in the viewer; filmstrip scrolls to it.
7. If the target time is outside the current range, the range expands or shifts to include it.

### Edge cases
- **No captures near target time:** Show a toast/inline message: "No captures near 3:30 AM. Closest capture is at 2:47 AM." Offer to jump to the closest.
- **Target time is in the future:** Snap to the latest capture with a message.
- **Target time is before any data exists:** Show "No data available before [earliest capture time]."
- **Device has no captures at all:** Jump-to-time is disabled.

### Timezone handling
- All internal timestamps are UTC (`capture_started_utc` / `Capture.timestamp`).
- Jump-to-time input displays in the user's local timezone (via `Intl.DateTimeFormat`).
- The conversion happens in the UI layer, not the service layer.

---

## Scrubber / Timeline Behavior (Phase 2)

### Visual design
```
  12:00 AM    3:00 AM    6:00 AM    9:00 AM
  │           │          │          │
  ┃▓▓▓▓▓▓▓▓▓▓┃▓▓░░░░▓▓▓▓┃▓▓▓▓▓▓▓▓▓┃──────
              ▲                ●
              gap         playhead
```

- **Track:** Full width of main content. Height: 24px desktop, 36px mobile.
- **Density bars:** Thin vertical bars whose opacity/height indicates capture frequency in that time slot. Gaps are visually obvious.
- **Playhead (●):** Draggable circle/line indicating the selected capture's time position.
- **Time ticks:** Labels at regular intervals. Adaptive: every 15m for 1h range, every 1h for 12h, every 3h for 24h.
- **Active region:** The track portion with data has a colored fill; empty regions are dimmed.

### Interaction
- **Click** on track → jump to that time
- **Drag** playhead → live scrub (debounced capture loading at ~200ms)
- **Hover** on track → tooltip with time (Phase 3: + thumbnail)
- **Mouse wheel / pinch** on track → zoom in/out on the time range
- **Keyboard:** Left/Right arrows move one capture; Shift+Left/Right moves 10 captures; Home/End go to range start/end

### Performance
- The scrubber UI itself renders from a lightweight "capture index" (timestamps + IDs only, no image data).
- Thumbnail images load lazily and only for the visible filmstrip window.
- Scrubbing debounces actual capture selection to avoid overloading image loads.

---

## Capture Density Visualization

The density track shows capture frequency across the selected time range. This helps users:
- Spot gaps (device offline, restarting, or clouded out)
- See rate changes (some AllSky configs capture faster in night mode)
- Identify periods worth investigating

### Rendering approach
- Divide the time range into N buckets (e.g., 100 buckets for the track width).
- Count captures per bucket.
- Render as a bar chart: height = count, with a subtle gradient. Maximum height = tallest bucket.
- Zero-count buckets show a dotted baseline (distinguishing "no data" from "low data").
- Color coding (optional, Phase 3):
  - Normal density: accent blue
  - Low density (below expected cadence): amber
  - Zero (gap): red hash marks

### Data source
- Phase 1-2: Computed client-side from the capture list already fetched.
- Phase 3+: Could use a dedicated "histogram" endpoint from the API for efficiency.

---

## Thumbnail Preview While Scrubbing (Phase 3)

When the user hovers over or drags along the timeline scrubber:
- A small thumbnail (120×80px) appears above the scrubber position, showing the capture at that time.
- The thumbnail follows the cursor/finger horizontally.
- On desktop: appears on hover, persists during drag.
- On mobile: appears during touch drag, disappears on release.

### Implementation notes
- Uses `previewUrl` (the existing preview/thumbnail URL from the `Capture` type).
- Prefetches thumbnails for positions near the cursor during drag to reduce pop-in.
- If no capture exists at the exact hover position, shows the nearest capture's thumbnail with a "(nearest)" label.
- Thumbnail popup should not extend beyond the viewport — clamp to screen edges.

---

## Event Markers

Event markers are visual indicators overlaid on the timeline scrubber track, helping users orient in time and spot noteworthy conditions.

### Phase 3: Core markers

| Marker                  | Visual                        | Data source                     |
|-------------------------|-------------------------------|---------------------------------|
| **Missing captures**    | Red hash region on track      | Gaps in capture index           |
| **Timelapse windows**   | Blue bracket below track      | Existing `Timelapse` type       |
| **Day/night transition**| Sun icon at transition time   | Sidecar `sky.sun_altitude` or dedicated API |
| **Twilight periods**    | Gradient overlay on track     | Civil/nautical/astro twilight from sun calc |

### Phase 4: Advanced markers

| Marker                  | Visual                        | Data source                     |
|-------------------------|-------------------------------|---------------------------------|
| **Sun/moon rise/set**   | Icons at event times          | Ephemeris API or sidecar data   |
| **Moon phase/illumination** | Moon icon with phase      | Ephemeris calculation           |
| **Weather/sky quality** | Color-coded region overlay    | Future weather integration      |
| **User bookmarks**      | Flag icon, click to jump      | Local storage or future API     |

### Marker rendering
- Markers render as absolutely positioned elements over the timeline track.
- On hover, markers show a tooltip with details (e.g., "Sunset at 8:47 PM").
- On click, markers jump to that time.
- Markers should not obscure the density visualization — use a separate lane or transparent overlays.

### Marker data notes
- **Missing captures:** Derived from gaps in the timestamp sequence that exceed the expected capture interval (e.g., >2 minutes with no capture when cadence is 1/min).
- **Timelapse windows:** Already available from the `Timelapse` type (`windowStartUtc`, `windowEndUtc`). Existing service methods fetch latest per duration; a new method would list historical timelapses in a range.
- **Day/night/twilight:** Can be computed client-side using the device's latitude/longitude (from sidecar or device config) and a sun position library (e.g., `suncalc`). Alternatively, the sidecar's `sky.sun_altitude` field can provide the actual measured value per capture.
- **Sun/moon events:** Requires either a client-side ephemeris library or a backend endpoint. Deferred to Phase 4 as it has more dependencies.

---

## Data Requirements

### New service methods needed

```typescript
// Phase 1: Range-based capture listing
listCapturesInRange(
  deviceId: string,
  opts: { after: string; before: string; limit?: number }
): Promise<CaptureListResult>

// Phase 1: Lightweight capture index for density/scrubber
listCaptureIndex(
  deviceId: string,
  opts: { after: string; before: string }
): Promise<{ timestamps: string[]; captureIds: string[] }>

// Phase 3: Historical timelapse listing for event markers
listTimelapsesInRange(
  deviceId: string,
  opts: { after: string; before: string; duration?: TimelapseDuration }
): Promise<Timelapse[]>
```

### What works with the current S3 dev adapter

The S3 dev adapter lists objects by prefix within the Hive-partitioned key structure:
```
raw/site={siteId}/device={deviceId}/year={YYYY}/month={MM}/day={DD}/
```

**Can do now:**
- List all captures for a specific day (one S3 `ListObjectsV2` call per day).
- Filter/sort client-side by timestamp parsed from the capture filename.
- Implement `listCapturesInRange` by listing the relevant day prefixes and filtering.
- Implement `listCaptureIndex` the same way (just return timestamps and IDs, skip presigned URL generation).
- List timelapses for a specific day from `processed/` prefixes.

**Limitations:**
- Multi-day ranges require one S3 list call per day — 24h range crossing midnight = 2 calls, "last week" = 7 calls. Acceptable for dev but not production.
- No server-side filtering or aggregation — all filtering is client-side.
- S3 `ListObjectsV2` returns max 1000 keys per page; a very active device could exceed this in one day. Pagination would be needed.
- No capture-count histogram endpoint — density must be computed from the full key list.

### What will be easier with the future API / ASLMediaIndex adapter

The production API backed by DynamoDB (`ASLMediaIndex` table) with fields `capture_started_utc`, `image_s3_key`, `preview_s3_key`, `sidecar_s3_key` will enable:

- **Efficient range queries:** DynamoDB query on `(deviceId, capture_started_utc)` with `BETWEEN` condition. Single call for any range.
- **Pagination:** DynamoDB handles pagination natively with `ExclusiveStartKey`.
- **Lightweight index:** A projection query returning only `capture_started_utc` and `captureId` (no image URLs) for the scrubber — very fast and cheap.
- **Count/histogram:** DynamoDB `Select: COUNT` or a precomputed summary table for capture density per hour/day.
- **Server-side sampling:** API can accept a `sample` parameter to return every Nth capture for large ranges.
- **Timelapse index:** A separate query or GSI on timelapse records.

**Recommendation:** Build the service interface (types, method signatures) now against what the API will support. Implement with S3 adapter for dev. When the API adapter lands, swap in with no UI changes.

---

## Performance Considerations

### Capture loading
- **Latest / 1h:** Load all captures eagerly. Thumbnail images lazy-load in the filmstrip.
- **6h+:** Load the lightweight index eagerly; load full capture details on demand (when scrolled into filmstrip view or clicked in timeline).
- **24h:** Consider a two-tier approach: coarse index for the scrubber, detail fetch for the visible filmstrip window.

### Image loading
- Continue using `loading="lazy"` on filmstrip thumbnails.
- For the timeline thumbnail preview (Phase 3), prefetch 5-10 previews in each direction from the cursor.
- Use `previewUrl` (small resolution) for all timeline/filmstrip thumbnails; `imageUrl` (full res) only for the main viewer.

### Debouncing
- Scrubber drag: debounce capture selection to 200ms (show time in tooltip immediately, load capture on settle).
- Range switch: debounce or cancel in-flight requests when range changes rapidly (user clicking through options).

### Memory
- For 24h at 1 capture/minute = ~1440 captures. The lightweight index (timestamps + IDs) is ~50KB. Full capture objects with URLs would be ~500KB. Both are fine for client memory.
- Thumbnail images: ~10KB each × 120 visible = ~1.2MB. Within browser cache budget.
- Historical ranges (multi-day): may need to evict older data from client state. Use a sliding window or LRU approach in the service cache.

### S3 adapter-specific
- Multi-day ranges: parallelize per-day S3 list calls.
- Cache S3 list results per day (immutable past data — safe to cache for the session).

---

## Accessibility & Touch Considerations

### Keyboard navigation
- Range selector: focusable button group, navigable with arrow keys.
- Jump-to-time: focusable input, standard form semantics.
- Timeline scrubber: `role="slider"`, `aria-valuemin/max/now` as ISO timestamps, arrow keys for fine movement, Page Up/Down for coarse jumps.
- All interactive elements must have visible focus indicators (existing dark theme already has `:focus-visible` styles).

### Screen readers
- Range selector buttons: `aria-pressed` for the active range.
- Timeline scrubber: `aria-label="Timeline scrubber"`, `aria-valuenow` as human-readable time string.
- Density visualization: `aria-hidden="true"` (decorative; the important info is available via the scrubber value and capture metadata).
- Event markers: `aria-label` describing the event (e.g., "Sunset at 8:47 PM").

### Touch
- All touch targets minimum 44×44px (following existing app convention).
- Timeline scrubber drag handle: 48px tall on mobile for thumb reach.
- Scrubber supports touch drag with inertia/momentum scrolling.
- No hover-dependent interactions without a touch fallback (thumbnail preview appears during drag on touch).
- Range selector buttons: pill-style with adequate spacing to prevent mis-taps.

### Reduced motion
- Respect `prefers-reduced-motion`: skip filmstrip scroll animations, scrubber transitions.
- Jump-to-time should still work (it's a discrete action, not an animation).

---

## Suggested Phased Implementation

### Phase 1: Jump-to-Time and Range Selector
**Scope:** Minimal viable time navigation. No scrubber, no markers.

Deliverables:
- `TimeRangeSelector` component: preset range buttons (Latest, 1h, 6h, 12h, 24h, Custom)
- `JumpToTime` component: time input with Go button
- New service method: `listCapturesInRange(deviceId, { after, before, limit })`
- S3 adapter implementation: list objects in date prefix(es), filter by time range
- `App.tsx` state management: track active range, pass range-filtered captures to filmstrip
- Filmstrip (`ImageHistoryGrid`) receives range-scoped captures instead of always "latest 30"
- Keyboard shortcut `T` to open jump-to-time
- Mobile layout: pill buttons + native date/time inputs

**Estimated complexity:** Medium. Mostly new components + a new service method. No changes to existing components beyond props.

**What this enables:** Users can immediately jump to a specific time and scope their browsing window. Solves the primary use case (investigating 3:30 AM haze).

### Phase 2: Timeline Scrubber
**Scope:** Visual timeline with drag interaction.

Deliverables:
- `TimelineScrubber` component: horizontal track with playhead
- Capture density visualization (bar chart on track)
- New service method: `listCaptureIndex(deviceId, { after, before })`
- S3 adapter implementation for lightweight index
- Drag-to-scrub with debounced capture loading
- Click-to-jump on timeline
- Time tick labels with adaptive intervals
- Scroll-wheel zoom on timeline
- Touch drag support with momentum

**Estimated complexity:** High. The scrubber is a custom interactive visualization. Needs careful touch handling and performance tuning.

### Phase 3: Event Markers and Thumbnails
**Scope:** Contextual overlays on the timeline.

Deliverables:
- Missing capture gap markers
- Timelapse window markers (using existing `Timelapse` data)
- Day/night/twilight transition markers (client-side sun calc)
- Thumbnail preview popup on hover/drag
- Historical timelapse listing service method
- Tooltip system for marker details

**Estimated complexity:** Medium. Most complexity is in data gathering and visual design, not interaction.

### Phase 4: Advanced Investigation Overlays
**Scope:** Power-user features for deep investigation.

Deliverables:
- Sun/moon rise/set event markers
- Moon phase/illumination display
- Weather/sky quality markers (requires external data source integration)
- User bookmarks (pin a time, add a note)
- Compare mode: side-by-side captures at two different times
- Multi-device timeline (same time across devices)

**Estimated complexity:** High. External data dependencies, significant UI additions.

---

## Non-Goals for Initial Implementation

These are explicitly out of scope for Phase 1 (and possibly Phase 2):

- **Replacing the filmstrip.** The filmstrip stays. The scroller augments it.
- **Server-side aggregation or histogram endpoints.** Phase 1-2 compute density client-side.
- **Real-time streaming updates while viewing historical data.** The existing refresh button handles live updates.
- **Multi-device timeline view.** Investigate one device at a time.
- **Calendar/date-range browser UI.** The custom date/time picker is sufficient; a full calendar view is Phase 4+.
- **Offline/PWA caching of historical captures.** Service worker scope stays as-is.
- **Playback/animation mode** (auto-advancing through captures like a timelapse). Separate feature.
- **Annotation or note-taking on captures.** Separate feature.
- **Backend API infrastructure.** All Phase 1-2 work uses the existing S3 dev adapter. The API adapter swap is independent work.
- **Changing `package.json` version.** This is a planning document only.

---

## Open Questions

1. **Capture cadence variance:** What is the actual capture interval across different AllSky devices? The plan assumes ~1/minute but this may vary. Affects density visualization scaling and gap detection thresholds.
2. **Device location data:** Where will latitude/longitude come from for sun/moon calculations? Sidecar data, device config, or a separate device metadata endpoint?
3. **Custom range UX:** Should "Custom" allow a date range (start + end) or just a point-in-time jump (one datetime, auto-window around it)? Point-in-time is simpler; range is more powerful.
4. **Filmstrip thumbnail limit:** For large ranges (12h, 24h), what's the right max number of thumbnails to show? 120 is a guess — needs testing for scroll performance and visual density.
5. **S3 adapter performance ceiling:** At what range size does the multi-day S3 listing approach become too slow for acceptable UX? Needs profiling to set an upper bound before the API is available.
6. **Timelapse relationship:** Should selecting a time range also update which timelapses are shown in the timelapse cards, or should they remain "latest"?
