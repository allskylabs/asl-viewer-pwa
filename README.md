# ASL Viewer PWA

Customer-facing AllSkyLabs viewer — live S3-backed capture browsing and timelapse playback.

## Features

- Device selector with online/offline status and last-seen time
- Capture viewer with previous/next navigation and keyboard shortcuts (Arrow Left/Right)
- Thumbnail filmstrip with selected-capture highlighting and auto-scroll
- Inline timelapse video playback (1h, 12h, 24h)
- Metadata panel with collapsible v2 sidecar sections (camera, image, sky, environment, system)
- Responsive layout: three-column desktop, single-column phone
- Dark dashboard theme
- Sidecar JSON caching with in-flight deduplication
- Adjacent capture image and sidecar preloading

## Setup

```bash
npm install
cp .env.example .env.local   # configure S3 bucket and AWS credentials
npm run dev
```

Open the URL shown in the terminal (default: http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Stack

- Vite 6
- React 19
- TypeScript 5
- Plain CSS (no framework)
- AWS S3 via dev adapter (presigned URLs generated server-side by Vite plugin)

## Project structure

```
src/
  App.tsx                          Main app with state management
  main.tsx                         Entry point
  vite-env.d.ts                    Vite/global type declarations
  styles/
    global.css                     All styles (dark theme, responsive breakpoints)
  types/
    viewer.ts                      TypeScript interfaces (Device, Capture, Timelapse, etc.)
  services/
    viewerService.ts               Service layer (caching, adapter delegation)
    adapters/
      s3DevAdapter.ts              S3 dev adapter (fetches via Vite dev-api proxy)
  components/
    AppHeader.tsx                  Top bar with logo and version
    DeviceSelector.tsx             Device list with status indicators
    LatestImagePanel.tsx           Main capture viewer with nav controls
    ImageHistoryGrid.tsx           Thumbnail filmstrip of recent captures
    MetadataPanel.tsx              Capture detail with collapsible sidecar sections
    TimelapsePanel.tsx             Timelapse video cards
vite.config.ts                     Vite config with S3 dev plugin and version injection
vite-plugin-s3-dev.ts              Vite plugin: S3 proxy middleware for local development
```

## Architecture

The viewer uses an adapter pattern for data access. UI components call functions in `viewerService.ts`, which delegates to whichever adapter is active. During development, the S3 dev adapter fetches data through a Vite middleware that proxies to S3 with presigned URLs. When the production API is ready, swapping to an API adapter requires no component changes.

## Versioning

This project uses [Semantic Versioning](https://semver.org/). The version in `package.json` is injected at build time into the app header via Vite's `define`. See [CHANGELOG.md](CHANGELOG.md) for release history.
