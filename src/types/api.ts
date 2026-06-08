export type CaptureMode = 'day' | 'twilight' | 'night';
export type Framing = 'full' | 'square';
export type UploadStatus = 'uploaded' | 'pending' | 'failed';
export type TimelapseDuration = '1h' | '12h';
export type TimelapseStatus = 'ready' | 'generating' | 'unavailable';

export interface CaptureMetadata {
  exposureMs: number;
  gain: number;
  sunAltitude: number;
  sunAzimuth: number;
  queueDepth: number;
  diskFreeGb: number;
  cpuTempC: number;
  caseTempC: number | null;
}

export interface Capture {
  captureId: string;
  deviceId: string;
  capturedAt: string;
  uploadedAt: string | null;
  mode: CaptureMode;
  framing: Framing;
  imageUrl: string;
  thumbnailUrl: string;
  s3Key: string;
  sidecarKey: string;
  uploadStatus: UploadStatus;
  metadata: CaptureMetadata;
}

export interface DeviceSummary {
  deviceId: string;
  siteId: string;
  siteName: string;
  online: boolean;
  lastSeen: string;
}

export interface Timelapse {
  deviceId: string;
  duration: TimelapseDuration;
  generatedAt: string | null;
  videoUrl: string | null;
  s3Key: string | null;
  status: TimelapseStatus;
}
