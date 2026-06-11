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

// Sidecar JSON is immutable per capture — safe to cache for the session.
// The inflight map deduplicates concurrent requests for the same key.
// clearSidecarCache() is exposed for explicit refresh actions.
const sidecarCache = new Map<string, Record<string, unknown> | null>();
const sidecarInflight = new Map<string, Promise<Record<string, unknown> | null>>();

export function clearSidecarCache(): void {
  sidecarCache.clear();
  sidecarInflight.clear();
}

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
  const key = `${deviceId}/${captureId}`;
  const cached = sidecarCache.get(key);
  if (cached !== undefined) return cached;
  const inflight = sidecarInflight.get(key);
  if (inflight) return inflight;
  const promise = adapter.getCaptureSidecar(deviceId, captureId).then(
    (result) => {
      sidecarCache.set(key, result);
      sidecarInflight.delete(key);
      return result;
    },
    (err) => {
      sidecarInflight.delete(key);
      throw err;
    },
  );
  sidecarInflight.set(key, promise);
  return promise;
}
