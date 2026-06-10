/**
 * Viewer service layer — UI components call these functions.
 *
 * Currently delegates to the S3 dev adapter for local development.
 * When the production API is ready, swap the import to apiAdapter.ts
 * with no changes needed in UI components.
 */
import type {
  Device,
  Capture,
  Timelapse,
  TimelapseDuration,
  CaptureListResult,
} from '../types/viewer';

import * as adapter from './adapters/s3DevAdapter';

export async function listDevices(): Promise<Device[]> {
  return adapter.listDevices();
}

export async function getLatestCapture(deviceId: string): Promise<Capture | null> {
  return adapter.getLatestCapture(deviceId);
}

export async function listCaptures(
  deviceId: string,
  opts: { limit?: number; before?: string } = {},
): Promise<CaptureListResult> {
  return adapter.listCaptures(deviceId, opts);
}

export async function getLatestTimelapse(
  deviceId: string,
  duration: TimelapseDuration,
): Promise<Timelapse | null> {
  return adapter.getLatestTimelapse(deviceId, duration);
}

export async function getCaptureSidecar(
  deviceId: string,
  captureId: string,
): Promise<Record<string, unknown> | null> {
  return adapter.getCaptureSidecar(deviceId, captureId);
}
