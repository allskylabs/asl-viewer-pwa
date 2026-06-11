export type CaptureMode = 'day' | 'twilight' | 'night';
export type TimelapseDuration = '1h' | '12h' | '24h';

export type DeviceStatus = 'online' | 'stale' | 'offline';

export interface Device {
  deviceId: string;
  siteId: string;
  label: string;
  lastSeenUtc: string;
  latestCaptureUtc: string | null;
  status: DeviceStatus;
  statusAgeSeconds: number | null;
  lastMode: CaptureMode | null;
}

export interface CaptureSensor {
  tempF: number | null;
  humidity: number | null;
  dewpointF: number | null;
}

export interface CaptureFlags {
  isDark: boolean;
  isValid: boolean;
  possibleIssue: boolean;
}

export interface Capture {
  deviceId: string;
  siteId: string;
  captureId: string;
  timestamp: string;
  mode: CaptureMode | null;
  imageUrl: string;
  previewUrl: string;
  sidecarUrl: string;
  sensor: CaptureSensor | null;
  flags: CaptureFlags | null;
}

export interface Timelapse {
  deviceId: string;
  duration: TimelapseDuration;
  windowStartUtc: string;
  windowEndUtc: string;
  videoUrl: string;
  sourceCount: number | null;
  expectedSourceCount: number | null;
  missingCount: number | null;
  generatedAtUtc: string | null;
}

export interface TimelapseListItem {
  deviceId: string;
  duration: TimelapseDuration;
  windowStartUtc: string;
  windowEndUtc: string;
  videoUrl: string;
  sourceCount: number | null;
  expectedSourceCount: number | null;
  missingCount: number | null;
  generatedAtUtc: string | null;
  key: string;
}

export interface TimelapseListResult {
  deviceId: string;
  timelapses: TimelapseListItem[];
}

export interface CaptureListResult {
  captures: Capture[];
  hasMore: boolean;
  nextBefore: string | null;
}
