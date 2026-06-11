# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.8] - 2026-06-11

### Added

- Live browser clock in the header displaying local time (HH:MM:SS AM/PM), updated every second via a self-contained `LiveClock` component.
- Clock uses tabular-nums to prevent layout jitter; "Updated" timestamp also uses tabular-nums now.
- Clock hidden on small phones (≤480px); compacted at ≤700px. "Updated" timestamp remains hidden at ≤700px as before.

## [0.2.7] - 2026-06-11

### Changed

- Device status (online/stale/offline) is now computed server-side in the `/dev-api/devices` response, with `latestCaptureUtc`, `status`, and `statusAgeSeconds` fields per device.
- All device list dots use the backend-provided status — non-selected devices stay current without requiring selection.
- Device list polls every 60 seconds (with visibility pause/resume) so all device statuses refresh automatically.
- DeviceSelector simplified: removed `statusOverrides` prop and client-side status calculation in favor of `device.status` from the API.
- Selected Device Status panel uses backend `status` for the badge and the freshest available timestamp for age display.
- Capture auto-refresh remains at 30 seconds; timelapse refresh remains manual only.

## [0.2.6] - 2026-06-11

### Fixed

- Device list status dots now use the same capture-derived status as the Device Status panel. Previously, dots used the device list `lastSeenUtc` while the panel used the latest capture timestamp, causing them to disagree.

## [0.2.5] - 2026-06-11

### Changed

- Device status now uses three states: online (<2m), stale (2–10m), offline (>10m), derived from the latest capture timestamp instead of the device list `lastSeenUtc`.
- Status dot colors: green (online), yellow (stale), red (offline) — in both the left rail badge and the device list dot.
- Renamed "Last seen" to "Latest image" to reflect the capture-based freshness source.
- Renamed "Current Capture / Age" to "Selected Capture / Viewing" to distinguish the displayed image from the latest available.
- Added "Data refreshed" row showing when the UI last checked for updates.

## [0.2.4] - 2026-06-11

### Changed

- Auto-refresh interval slowed from 10 seconds to 30 seconds for a calmer live view.
- Timelapses refresh only on manual Refresh, not on the auto-refresh interval.

## [0.2.3] - 2026-06-11

### Fixed

- Removed automatic scrollIntoView on filmstrip selection change. Auto-refresh no longer scrolls the page down to the filmstrip every 10 seconds.

## [0.2.2] - 2026-06-11

### Fixed

- Auto-refresh now forces the main image to the newest capture every 10 seconds instead of only updating the filmstrip/capture list.
- Main image `<img>` keyed by captureId so React/browser treats each new capture as a distinct element.

## [0.2.1] - 2026-06-11

### Fixed

- Manual Refresh now always jumps to the newest capture instead of preserving a previously browsed older capture. Pressing Refresh means "show me the latest."

## [0.2.0] - 2026-06-10

### Added

- Time range selector: filter captures by Latest, 1h, 6h, 12h, or 24h using pill-style toggle buttons above the filmstrip.
- Jump-to-time control: pick a local date/time and jump to the nearest available capture. Shows inline feedback with the matched capture's time and distance from the target.
- Keyboard shortcut `T` to focus the jump-to-time input.
- Filmstrip title updates to reflect the active time range (e.g., "Captures — Last 6h").
- Capture data now loads up to 100 recent captures (up from 30) to support wider time ranges.
- Time range, jump-to-time, and filmstrip are responsive across all breakpoints with 44px touch targets on mobile.

### Changed

- Filmstrip panel (`ImageHistoryGrid`) accepts an optional `title` prop for dynamic headings.
- Selected capture is automatically adjusted when a range change excludes the current selection.
- Refresh and device-switch now preserve the active time range.

### Limitations (Phase 1)

- Time range filtering operates on the currently loaded capture set (up to 100 most recent captures). Ranges exceeding the loaded data may not show all historical captures. This will improve when the production API adapter is available.
- Jump-to-time searches only within loaded captures. If the target time is outside the loaded window, it selects the nearest loaded capture and shows a distance message.

## [0.1.2] - 2026-06-10

### Added

- "Jump to latest" button in capture nav when not viewing the newest capture.
- Capture age display ("3m ago") in the capture viewer metadata tags.
- Copy buttons for device ID, capture ID, image URL, and sidecar URL in the metadata panel.
- Selected device persisted to localStorage; restored on page load if device still exists.

### Changed

- Refresh now preserves the selected device (if still present) and selected capture (if still in list) instead of jumping to the first device/capture.
- "Open full image" and "Open sidecar JSON" links restyled as prominent button-links with adjacent copy-URL buttons.
- Mobile header (≤700px): flex-wrap enabled, logo reduced to 40px (32px at ≤480px) for cleaner phone presentation.
- Small-phone header (≤480px): tighter spacing on refresh button and version label.
- Touch-friendly "Latest" button (44px min-height) on mobile breakpoints.

### Fixed

- Refresh no longer loses selected device — previously always reset to first device in list.

## [0.1.1] - 2025-06-10

### Added

- Refresh button in header to reload live S3 data for the current device.
- Last-refreshed timestamp displayed in header (hidden on phone widths).
- Refresh error banner with retry and dismiss actions; previous data stays visible on failure.
- Retry button on the initial connection error screen.
- `clearSidecarCache()` in viewerService, called on explicit refresh to ensure fresh sidecar data.

### Changed

- Sidecar cache is cleared when user explicitly refreshes, but preserved during normal navigation.
- Refresh also reloads the device list for fresh online/last-seen status.

## [0.1.0] - 2025-06-10

### Added

- Device selector with online/offline status and last-seen time.
- Capture viewer with previous/next navigation buttons.
- Keyboard navigation (ArrowLeft / ArrowRight) for capture browsing.
- Thumbnail filmstrip with selected-capture highlighting and auto-scroll.
- Inline timelapse video playback for 1h, 12h, and 24h windows.
- Metadata panel rendering v2 sidecar JSON with collapsible sections (capture, camera, image, sky, environment, system).
- Direct links to full image and sidecar JSON in metadata panel.
- S3 development adapter with Vite proxy middleware for local development.
- Service layer with adapter pattern (viewerService delegates to s3DevAdapter).
- Sidecar JSON caching with in-flight request deduplication.
- Adjacent capture image and sidecar preloading for faster navigation.
- React.memo on TimelapsePanel, ImageHistoryGrid, LatestImagePanel, and MetadataPanel.
- Responsive layout: three-column desktop, single-column phone (breakpoints at 1100px, 900px, 700px, 480px).
- Touch-friendly capture navigation buttons (44px targets on mobile).
- Dark dashboard theme with CSS custom properties.
- Build-time version injection via Vite define.
- Lazy loading on thumbnail images.

[0.2.8]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.2.7...v0.2.8
[0.2.7]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/allskylabs/asl-viewer-pwa/releases/tag/v0.1.0
