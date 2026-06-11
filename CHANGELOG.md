# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.2]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/allskylabs/asl-viewer-pwa/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/allskylabs/asl-viewer-pwa/releases/tag/v0.1.0
