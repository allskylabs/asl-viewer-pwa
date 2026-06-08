import type { DeviceSummary, Capture, Timelapse, TimelapseDuration } from '../types/api';
import { mockDevices, mockCaptures, mockTimelapses } from '../data/mockManifest';

// GET /devices
export async function listDevices(): Promise<DeviceSummary[]> {
  return mockDevices;
}

// GET /devices/{deviceId}/captures/latest
export async function getLatestCapture(deviceId: string): Promise<Capture | null> {
  return mockCaptures[deviceId]?.[0] ?? null;
}

// GET /devices/{deviceId}/captures?limit=N
export async function getRecentCaptures(
  deviceId: string,
  limit = 20,
): Promise<Capture[]> {
  return (mockCaptures[deviceId] ?? []).slice(0, limit);
}

// GET /devices/{deviceId}/timelapses/latest?duration=1h|12h
export async function getLatestTimelapse(
  deviceId: string,
  duration: TimelapseDuration,
): Promise<Timelapse | null> {
  return (mockTimelapses[deviceId] ?? []).find((t) => t.duration === duration) ?? null;
}

// GET /devices/{deviceId}/timelapses
export async function getTimelapses(deviceId: string): Promise<Timelapse[]> {
  return mockTimelapses[deviceId] ?? [];
}
