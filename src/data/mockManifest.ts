import type { DeviceSummary, Capture, Timelapse, CaptureMetadata } from '../types/api';

function placeholderImage(label: string, hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
    <rect width="640" height="480" fill="hsl(${hue}, 30%, 12%)"/>
    <circle cx="320" cy="200" r="160" fill="hsl(${hue}, 40%, 20%)" stroke="hsl(${hue}, 50%, 35%)" stroke-width="2"/>
    <text x="320" y="210" text-anchor="middle" fill="hsl(${hue}, 60%, 65%)" font-family="monospace" font-size="18">${label}</text>
    <text x="320" y="400" text-anchor="middle" fill="hsl(${hue}, 30%, 45%)" font-family="monospace" font-size="12">AllSkyLabs — placeholder until S3 URLs resolve</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function placeholderThumb(label: string, hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120">
    <rect width="160" height="120" fill="hsl(${hue}, 30%, 12%)"/>
    <circle cx="80" cy="50" r="35" fill="hsl(${hue}, 40%, 20%)" stroke="hsl(${hue}, 50%, 35%)" stroke-width="1"/>
    <text x="80" y="55" text-anchor="middle" fill="hsl(${hue}, 60%, 65%)" font-family="monospace" font-size="9">${label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

interface CaptureRow {
  capturedAt: string;
  uploadedAt: string | null;
  mode: 'day' | 'twilight' | 'night';
  framing: 'full' | 'square';
  uploadStatus: 'uploaded' | 'pending' | 'failed';
  metadata: CaptureMetadata;
}

function buildCapture(deviceId: string, row: CaptureRow, hue: number): Capture {
  const dt = row.capturedAt.slice(0, 10);
  const hhmm = row.capturedAt.slice(11, 16);
  const fileBase = `img_${dt.replace(/-/g, '')}_${hhmm.replace(':', '')}`;
  const prefix = `captures/device_id=${deviceId}/dt=${dt}`;
  return {
    captureId: `${deviceId}-${fileBase}`,
    deviceId,
    capturedAt: row.capturedAt,
    uploadedAt: row.uploadedAt,
    mode: row.mode,
    framing: row.framing,
    imageUrl: placeholderImage(`${row.mode} — ${hhmm} UTC`, hue),
    thumbnailUrl: placeholderThumb(hhmm, hue),
    s3Key: `${prefix}/${fileBase}.jpg`,
    sidecarKey: `${prefix}/${fileBase}.json`,
    uploadStatus: row.uploadStatus,
    metadata: row.metadata,
  };
}

// ── ASLEdge-001: Hilltop Observatory, online, night ──

const rows001: CaptureRow[] = [
  { capturedAt: '2026-06-08T03:42:00Z', uploadedAt: '2026-06-08T03:42:05Z', mode: 'night', framing: 'full', uploadStatus: 'uploaded', metadata: { exposureMs: 15000, gain: 300, sunAltitude: -34.2, sunAzimuth: 15.8, queueDepth: 1, diskFreeGb: 12.2, cpuTempC: 52.3, caseTempC: 28.1 } },
  { capturedAt: '2026-06-08T03:40:00Z', uploadedAt: '2026-06-08T03:40:04Z', mode: 'night', framing: 'full', uploadStatus: 'uploaded', metadata: { exposureMs: 15000, gain: 300, sunAltitude: -34.1, sunAzimuth: 15.5, queueDepth: 0, diskFreeGb: 12.2, cpuTempC: 52.1, caseTempC: 28.0 } },
  { capturedAt: '2026-06-08T03:38:00Z', uploadedAt: '2026-06-08T03:38:06Z', mode: 'night', framing: 'full', uploadStatus: 'uploaded', metadata: { exposureMs: 15000, gain: 300, sunAltitude: -34.0, sunAzimuth: 15.2, queueDepth: 0, diskFreeGb: 12.2, cpuTempC: 51.9, caseTempC: 27.9 } },
  { capturedAt: '2026-06-08T03:36:00Z', uploadedAt: '2026-06-08T03:36:05Z', mode: 'night', framing: 'full', uploadStatus: 'uploaded', metadata: { exposureMs: 15000, gain: 300, sunAltitude: -33.9, sunAzimuth: 14.9, queueDepth: 0, diskFreeGb: 12.2, cpuTempC: 52.0, caseTempC: 28.0 } },
  { capturedAt: '2026-06-08T03:34:00Z', uploadedAt: null, mode: 'night', framing: 'full', uploadStatus: 'pending', metadata: { exposureMs: 15000, gain: 300, sunAltitude: -33.8, sunAzimuth: 14.6, queueDepth: 2, diskFreeGb: 12.2, cpuTempC: 52.2, caseTempC: 28.1 } },
  { capturedAt: '2026-06-08T03:32:00Z', uploadedAt: '2026-06-08T03:32:04Z', mode: 'night', framing: 'full', uploadStatus: 'uploaded', metadata: { exposureMs: 15000, gain: 300, sunAltitude: -33.7, sunAzimuth: 14.3, queueDepth: 0, diskFreeGb: 12.2, cpuTempC: 52.4, caseTempC: 28.2 } },
];

// ── ASLEdge-002: Desert Flat Array, online, twilight ──

const rows002: CaptureRow[] = [
  { capturedAt: '2026-06-08T03:41:00Z', uploadedAt: '2026-06-08T03:41:06Z', mode: 'twilight', framing: 'square', uploadStatus: 'uploaded', metadata: { exposureMs: 5000, gain: 150, sunAltitude: -8.5, sunAzimuth: 72.3, queueDepth: 3, diskFreeGb: 8.1, cpuTempC: 61.7, caseTempC: null } },
  { capturedAt: '2026-06-08T03:39:00Z', uploadedAt: '2026-06-08T03:39:05Z', mode: 'twilight', framing: 'square', uploadStatus: 'uploaded', metadata: { exposureMs: 5000, gain: 150, sunAltitude: -8.3, sunAzimuth: 72.0, queueDepth: 2, diskFreeGb: 8.1, cpuTempC: 61.5, caseTempC: null } },
  { capturedAt: '2026-06-08T03:37:00Z', uploadedAt: null, mode: 'twilight', framing: 'square', uploadStatus: 'failed', metadata: { exposureMs: 5000, gain: 150, sunAltitude: -8.1, sunAzimuth: 71.7, queueDepth: 4, diskFreeGb: 8.1, cpuTempC: 61.9, caseTempC: null } },
  { capturedAt: '2026-06-08T03:35:00Z', uploadedAt: '2026-06-08T03:35:04Z', mode: 'twilight', framing: 'square', uploadStatus: 'uploaded', metadata: { exposureMs: 5000, gain: 150, sunAltitude: -7.9, sunAzimuth: 71.4, queueDepth: 1, diskFreeGb: 8.1, cpuTempC: 61.3, caseTempC: null } },
];

// ── ASLEdge-003: Coastal Weather Station, offline, day ──

const rows003: CaptureRow[] = [
  { capturedAt: '2026-06-07T22:15:00Z', uploadedAt: '2026-06-07T22:15:08Z', mode: 'day', framing: 'full', uploadStatus: 'uploaded', metadata: { exposureMs: 500, gain: 50, sunAltitude: 42.1, sunAzimuth: 245.6, queueDepth: 0, diskFreeGb: 23.5, cpuTempC: 44.8, caseTempC: 21.3 } },
  { capturedAt: '2026-06-07T22:13:00Z', uploadedAt: '2026-06-07T22:13:06Z', mode: 'day', framing: 'full', uploadStatus: 'uploaded', metadata: { exposureMs: 500, gain: 50, sunAltitude: 42.0, sunAzimuth: 245.3, queueDepth: 0, diskFreeGb: 23.5, cpuTempC: 44.6, caseTempC: 21.2 } },
  { capturedAt: '2026-06-07T22:11:00Z', uploadedAt: '2026-06-07T22:11:05Z', mode: 'day', framing: 'full', uploadStatus: 'uploaded', metadata: { exposureMs: 500, gain: 50, sunAltitude: 41.9, sunAzimuth: 245.0, queueDepth: 0, diskFreeGb: 23.5, cpuTempC: 44.9, caseTempC: 21.4 } },
];

// ── Devices ──

export const mockDevices: DeviceSummary[] = [
  { deviceId: 'ASLEdge-001', siteId: 'site-hilltop', siteName: 'Hilltop Observatory', online: true, lastSeen: '2026-06-08T03:42:00Z' },
  { deviceId: 'ASLEdge-002', siteId: 'site-desert', siteName: 'Desert Flat Array', online: true, lastSeen: '2026-06-08T03:41:00Z' },
  { deviceId: 'ASLEdge-003', siteId: 'site-coastal', siteName: 'Coastal Weather Station', online: false, lastSeen: '2026-06-07T22:15:00Z' },
];

// ── Captures by device ──

export const mockCaptures: Record<string, Capture[]> = {
  'ASLEdge-001': rows001.map((r, i) => buildCapture('ASLEdge-001', r, 220 + i * 3)),
  'ASLEdge-002': rows002.map((r, i) => buildCapture('ASLEdge-002', r, 30 + i * 5)),
  'ASLEdge-003': rows003.map((r, i) => buildCapture('ASLEdge-003', r, 175 + i * 5)),
};

// ── Timelapses by device ──

export const mockTimelapses: Record<string, Timelapse[]> = {
  'ASLEdge-001': [
    { deviceId: 'ASLEdge-001', duration: '1h', generatedAt: '2026-06-08T03:00:00Z', videoUrl: null, s3Key: 'timelapses/device_id=ASLEdge-001/timelapse_1h_20260608_0300.mp4', status: 'ready' },
    { deviceId: 'ASLEdge-001', duration: '12h', generatedAt: '2026-06-08T00:00:00Z', videoUrl: null, s3Key: 'timelapses/device_id=ASLEdge-001/timelapse_12h_20260608_0000.mp4', status: 'ready' },
  ],
  'ASLEdge-002': [
    { deviceId: 'ASLEdge-002', duration: '1h', generatedAt: '2026-06-08T03:00:00Z', videoUrl: null, s3Key: 'timelapses/device_id=ASLEdge-002/timelapse_1h_20260608_0300.mp4', status: 'ready' },
    { deviceId: 'ASLEdge-002', duration: '12h', generatedAt: null, videoUrl: null, s3Key: null, status: 'unavailable' },
  ],
  'ASLEdge-003': [
    { deviceId: 'ASLEdge-003', duration: '1h', generatedAt: null, videoUrl: null, s3Key: null, status: 'unavailable' },
    { deviceId: 'ASLEdge-003', duration: '12h', generatedAt: null, videoUrl: null, s3Key: null, status: 'unavailable' },
  ],
};
