# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/allskylabs/asl-viewer-pwa/releases/tag/v0.1.0
