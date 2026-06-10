/**
 * DEV-ONLY: S3 development adapter.
 * Fetches from the Vite dev server's /dev-api/* middleware, which proxies
 * to S3 server-side. This is for local viewer development only — production
 * will use a real API adapter (apiAdapter.ts) hitting API Gateway.
 */
import type {
  Device,
  Capture,
  Timelapse,
  TimelapseDuration,
  CaptureListResult,
} from '../../types/viewer';

const BASE = '/dev-api';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`dev-api ${res.status}: ${body}`);
  }
  return res.json();
}

export async function listDevices(): Promise<Device[]> {
  const data = await fetchJson<{ devices: Device[] }>('/devices');
  return data.devices;
}

export async function getLatestCapture(deviceId: string): Promise<Capture | null> {
  const data = await fetchJson<{ capture: Capture | null }>(
    `/devices/${encodeURIComponent(deviceId)}/captures/latest`,
  );
  return data.capture;
}

export async function listCaptures(
  deviceId: string,
  opts: { limit?: number; before?: string } = {},
): Promise<CaptureListResult> {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.before) params.set('before', opts.before);
  const qs = params.toString();
  const path = `/devices/${encodeURIComponent(deviceId)}/captures${qs ? `?${qs}` : ''}`;
  return fetchJson<CaptureListResult>(path);
}

export async function getLatestTimelapse(
  deviceId: string,
  duration: TimelapseDuration,
): Promise<Timelapse | null> {
  const data = await fetchJson<{ timelapse: Timelapse | null }>(
    `/devices/${encodeURIComponent(deviceId)}/timelapses/latest?duration=${duration}`,
  );
  return data.timelapse;
}

export async function getCaptureSidecar(
  deviceId: string,
  captureId: string,
): Promise<Record<string, unknown> | null> {
  return fetchJson<Record<string, unknown> | null>(
    `/devices/${encodeURIComponent(deviceId)}/captures/${encodeURIComponent(captureId)}/sidecar`,
  );
}
