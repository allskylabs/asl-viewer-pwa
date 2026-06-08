# ASL Viewer PWA

Customer-facing AllSkyLabs viewer PWA — v0.1 with mock data.

## Features

- Device selector with online/offline status and last-seen time
- Latest capture viewer with mode, framing, and upload status
- Image history grid with selectable thumbnails
- Device metadata and telemetry panel
- Timelapse links with available/unavailable states
- Responsive layout (sidebar on desktop, stacked on mobile)
- Dark dashboard theme

## Setup

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (default: http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Stack

- Vite
- React 19
- TypeScript
- Plain CSS (no framework)
- Mock data only — no backend or AWS calls

## Project Structure

```
src/
  App.tsx              — Main app with state management
  main.tsx             — Entry point
  styles/
    global.css         — All styles (dark theme)
  data/
    mockDevices.ts     — Mock device/capture/telemetry data
  types/
    device.ts          — TypeScript interfaces
  components/
    AppHeader.tsx      — Top bar with AllSkyLabs branding
    DeviceSelector.tsx — Device list sidebar/strip
    LatestImagePanel.tsx — Main image viewer
    ImageHistoryGrid.tsx — Thumbnail grid of recent captures
    MetadataPanel.tsx  — Device status and telemetry
    TimelapsePanel.tsx — Timelapse link cards
    StatusBadge.tsx    — Online/offline indicator
```

This is separate from the ESP32 climate monitor PWA.
