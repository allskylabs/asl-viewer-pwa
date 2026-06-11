/**
 * DEV-ONLY: Vite plugin that serves /dev-api/* routes backed by direct S3 access.
 * This is for local viewer development against live S3 data.
 * NOT the production security model — production will use API Gateway + Lambda.
 */
import type { Plugin } from 'vite';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { IncomingMessage, ServerResponse } from 'http';

interface S3DevConfig {
  bucket: string;
  region: string;
  siteId: string;
  devices: string[];
}

function parseConfig(env: Record<string, string>): S3DevConfig {
  return {
    bucket: env.S3_DEV_BUCKET || 'allskylabs-edge-media-dev-use1',
    region: env.S3_DEV_REGION || 'us-east-1',
    siteId: env.S3_DEV_SITE_ID || 'home-lab',
    devices: (env.S3_DEV_DEVICES || 'ASLEdge-001').split(',').map(d => d.trim()).filter(Boolean),
  };
}

type DeviceStatus = 'online' | 'stale' | 'offline';

function computeDeviceStatus(latestCaptureUtc: string | null): { status: DeviceStatus; statusAgeSeconds: number | null } {
  if (!latestCaptureUtc) return { status: 'offline', statusAgeSeconds: null };
  const ageSeconds = Math.round((Date.now() - new Date(latestCaptureUtc).getTime()) / 1000);
  if (ageSeconds <= 120) return { status: 'online', statusAgeSeconds: ageSeconds };
  if (ageSeconds <= 600) return { status: 'stale', statusAgeSeconds: ageSeconds };
  return { status: 'offline', statusAgeSeconds: ageSeconds };
}

function parseTimestampFromCaptureId(captureId: string): string | null {
  const m = captureId.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

function utcDateParts(date: Date): { year: string; month: string; day: string } {
  return {
    year: String(date.getUTCFullYear()).padStart(4, '0'),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
    day: String(date.getUTCDate()).padStart(2, '0'),
  };
}

function rawPrefix(siteId: string, deviceId: string, date: Date): string {
  const { year, month, day } = utcDateParts(date);
  return `raw/site=${siteId}/device=${deviceId}/year=${year}/month=${month}/day=${day}/`;
}

function timelapsePrefix(siteId: string, deviceId: string, date: Date, variant: '1h' | '12h' | '24h'): string {
  const { year, month, day } = utcDateParts(date);
  const folders: Record<string, string> = { '1h': 'timelapse', '12h': 'timelapse-12h', '24h': 'timelapse-24h' };
  return `processed/site=${siteId}/device=${deviceId}/year=${year}/month=${month}/day=${day}/${folders[variant]}/`;
}

async function listS3Keys(
  s3: S3Client,
  bucket: string,
  prefix: string,
  startAfter?: string,
  maxKeys = 1000,
): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const cmd = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
      StartAfter: startAfter,
      ContinuationToken: continuationToken,
    });
    const res = await s3.send(cmd);
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

function extractCaptureEntries(keys: string[], deviceId: string) {
  const entries: { captureId: string; timestamp: string; imageKey: string; previewKey: string; sidecarKey: string }[] = [];
  const seen = new Set<string>();

  for (const key of keys) {
    const basename = key.split('/').pop()!;
    if (!basename.endsWith('.jpg') || basename.includes('_preview')) continue;

    const captureId = basename.replace('.jpg', '');
    if (!captureId.startsWith(deviceId)) continue;
    if (seen.has(captureId)) continue;
    seen.add(captureId);

    const ts = parseTimestampFromCaptureId(captureId);
    if (!ts) continue;

    const dir = key.substring(0, key.lastIndexOf('/') + 1);
    entries.push({
      captureId,
      timestamp: ts,
      imageKey: key,
      previewKey: `${dir}${captureId}_preview.jpg`,
      sidecarKey: `${dir}${captureId}.json`,
    });
  }

  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return entries;
}

async function presign(s3: S3Client, bucket: string, key: string, expiresIn = 3600): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
}

async function handleDevices(
  s3: S3Client,
  cfg: S3DevConfig,
  _url: URL,
): Promise<unknown> {
  const devices = [];
  const now = new Date();

  for (const deviceId of cfg.devices) {
    let lastSeenUtc: string | null = null;
    let lastMode: string | null = null;

    for (let daysBack = 0; daysBack < 3; daysBack++) {
      const date = new Date(now.getTime() - daysBack * 86400_000);
      const prefix = rawPrefix(cfg.siteId, deviceId, date);
      const keys = await listS3Keys(s3, cfg.bucket, prefix);
      const entries = extractCaptureEntries(keys, deviceId);
      if (entries.length > 0) {
        lastSeenUtc = entries[0].timestamp;
        break;
      }
    }

    const { status, statusAgeSeconds } = computeDeviceStatus(lastSeenUtc);

    devices.push({
      deviceId,
      siteId: cfg.siteId,
      label: deviceId,
      lastSeenUtc: lastSeenUtc ?? new Date(0).toISOString(),
      latestCaptureUtc: lastSeenUtc ?? null,
      status,
      statusAgeSeconds,
      lastMode,
    });
  }

  return { devices };
}

async function handleCaptures(
  s3: S3Client,
  cfg: S3DevConfig,
  deviceId: string,
  url: URL,
): Promise<unknown> {
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100);
  const before = url.searchParams.get('before') ?? undefined;
  const now = new Date();
  const allEntries: ReturnType<typeof extractCaptureEntries> = [];

  for (let daysBack = 0; daysBack < 7 && allEntries.length < limit + 1; daysBack++) {
    const date = new Date(now.getTime() - daysBack * 86400_000);
    const prefix = rawPrefix(cfg.siteId, deviceId, date);
    const keys = await listS3Keys(s3, cfg.bucket, prefix);
    const entries = extractCaptureEntries(keys, deviceId);
    allEntries.push(...entries);
  }

  allEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  let filtered = before
    ? allEntries.filter(e => e.timestamp < before)
    : allEntries;

  const hasMore = filtered.length > limit;
  filtered = filtered.slice(0, limit);

  const captures = await Promise.all(
    filtered.map(async (e) => ({
      deviceId,
      siteId: cfg.siteId,
      captureId: e.captureId,
      timestamp: e.timestamp,
      mode: null as string | null,
      imageUrl: await presign(s3, cfg.bucket, e.imageKey),
      previewUrl: await presign(s3, cfg.bucket, e.previewKey),
      sidecarUrl: await presign(s3, cfg.bucket, e.sidecarKey),
      sensor: null,
      flags: null,
    })),
  );

  const nextBefore = hasMore && filtered.length > 0
    ? filtered[filtered.length - 1].timestamp
    : null;

  return { deviceId, captures, hasMore, nextBefore };
}

async function handleLatestCapture(
  s3: S3Client,
  cfg: S3DevConfig,
  deviceId: string,
): Promise<unknown> {
  const now = new Date();

  for (let daysBack = 0; daysBack < 3; daysBack++) {
    const date = new Date(now.getTime() - daysBack * 86400_000);
    const prefix = rawPrefix(cfg.siteId, deviceId, date);
    const keys = await listS3Keys(s3, cfg.bucket, prefix);
    const entries = extractCaptureEntries(keys, deviceId);

    if (entries.length > 0) {
      const e = entries[0];
      return {
        deviceId,
        capture: {
          deviceId,
          siteId: cfg.siteId,
          captureId: e.captureId,
          timestamp: e.timestamp,
          mode: null,
          imageUrl: await presign(s3, cfg.bucket, e.imageKey),
          previewUrl: await presign(s3, cfg.bucket, e.previewKey),
          sidecarUrl: await presign(s3, cfg.bucket, e.sidecarKey),
          sensor: null,
          flags: null,
        },
      };
    }
  }

  return { deviceId, capture: null };
}

function parse1hTimelapseName(key: string): { start: string; end: string } | null {
  const basename = key.split('/').pop()!;
  const m = basename.match(
    /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z_(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z_\d+fps\.mp4$/,
  );
  if (!m) return null;
  return {
    start: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`,
    end: `${m[7]}-${m[8]}-${m[9]}T${m[10]}:${m[11]}:${m[12]}Z`,
  };
}

function parseLongTimelapseName(key: string): { start: string; end: string } | null {
  const basename = key.split('/').pop()!;
  const m = basename.match(/_(\d{8})_(\d{4})-(\d{8})_(\d{4})_\d+h\.mp4$/);
  if (!m) return null;
  const startLocal = `${m[1].slice(0,4)}-${m[1].slice(4,6)}-${m[1].slice(6,8)}T${m[2].slice(0,2)}:${m[2].slice(2,4)}:00Z`;
  const endLocal = `${m[3].slice(0,4)}-${m[3].slice(4,6)}-${m[3].slice(6,8)}T${m[4].slice(0,2)}:${m[4].slice(2,4)}:00Z`;
  return { start: startLocal, end: endLocal };
}

async function handleLatestTimelapse(
  s3: S3Client,
  cfg: S3DevConfig,
  deviceId: string,
  url: URL,
): Promise<unknown> {
  const duration = (url.searchParams.get('duration') ?? '1h') as '1h' | '12h' | '24h';
  const now = new Date();

  for (let daysBack = 0; daysBack < 7; daysBack++) {
    const date = new Date(now.getTime() - daysBack * 86400_000);
    const prefix = timelapsePrefix(cfg.siteId, deviceId, date, duration);
    const keys = await listS3Keys(s3, cfg.bucket, prefix);

    const mp4Keys = keys.filter(k => k.endsWith('.mp4'));
    if (mp4Keys.length === 0) continue;

    mp4Keys.sort();
    const latestKey = mp4Keys[mp4Keys.length - 1];

    const parsed = duration === '1h'
      ? parse1hTimelapseName(latestKey)
      : parseLongTimelapseName(latestKey);

    if (!parsed) continue;

    let sidecar: Record<string, unknown> | null = null;
    const jsonKey = latestKey.replace('.mp4', '.json');
    try {
      const obj = await s3.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: jsonKey }));
      const body = await obj.Body?.transformToString();
      if (body) sidecar = JSON.parse(body);
    } catch {
      // sidecar may not exist for 1h timelapses
    }

    return {
      deviceId,
      timelapse: {
        deviceId,
        duration,
        windowStartUtc: (sidecar?.['window_start_utc'] as string) ?? parsed.start,
        windowEndUtc: (sidecar?.['window_end_utc'] as string) ?? parsed.end,
        videoUrl: await presign(s3, cfg.bucket, latestKey),
        sourceCount: (sidecar?.['source_count'] as number) ?? null,
        expectedSourceCount: (sidecar?.['expected_source_count'] as number) ?? null,
        missingCount: (sidecar?.['missing_hours_utc'] as unknown[])?.length ?? null,
        generatedAtUtc: (sidecar?.['generated_at_utc'] as string) ?? null,
      },
    };
  }

  return { deviceId, timelapse: null };
}

async function handleListTimelapses(
  s3: S3Client,
  cfg: S3DevConfig,
  deviceId: string,
  url: URL,
): Promise<unknown> {
  const durationParam = url.searchParams.get('duration') ?? 'all';
  const days = Math.min(parseInt(url.searchParams.get('days') ?? '7', 10), 30);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100);

  const durations: ('1h' | '12h' | '24h')[] =
    durationParam === 'all' ? ['1h', '12h', '24h'] : [durationParam as '1h' | '12h' | '24h'];

  const POSTER_EXTS = ['.jpg', '.webp', '.png'];

  const now = new Date();
  const allEntries: {
    duration: string;
    windowStartUtc: string;
    windowEndUtc: string;
    videoUrl: string;
    posterKey: string | null;
    sourceCount: number | null;
    expectedSourceCount: number | null;
    missingCount: number | null;
    generatedAtUtc: string | null;
    key: string;
  }[] = [];

  for (const duration of durations) {
    for (let daysBack = 0; daysBack < days; daysBack++) {
      const date = new Date(now.getTime() - daysBack * 86400_000);
      const prefix = timelapsePrefix(cfg.siteId, deviceId, date, duration);
      const keys = await listS3Keys(s3, cfg.bucket, prefix);
      const keySet = new Set(keys);
      const mp4Keys = keys.filter(k => k.endsWith('.mp4'));

      for (const mp4Key of mp4Keys) {
        const parsed = duration === '1h'
          ? parse1hTimelapseName(mp4Key)
          : parseLongTimelapseName(mp4Key);
        if (!parsed) continue;

        let sidecar: Record<string, unknown> | null = null;
        const jsonKey = mp4Key.replace('.mp4', '.json');
        try {
          const obj = await s3.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: jsonKey }));
          const body = await obj.Body?.transformToString();
          if (body) sidecar = JSON.parse(body);
        } catch {
          // sidecar may not exist
        }

        const baseName = mp4Key.replace(/\.mp4$/, '');
        const posterKey = POSTER_EXTS.map(ext => baseName + ext).find(k => keySet.has(k)) ?? null;

        allEntries.push({
          duration,
          windowStartUtc: (sidecar?.['window_start_utc'] as string) ?? parsed.start,
          windowEndUtc: (sidecar?.['window_end_utc'] as string) ?? parsed.end,
          videoUrl: await presign(s3, cfg.bucket, mp4Key),
          posterKey,
          sourceCount: (sidecar?.['source_count'] as number) ?? null,
          expectedSourceCount: (sidecar?.['expected_source_count'] as number) ?? null,
          missingCount: (sidecar?.['missing_hours_utc'] as unknown[])?.length ?? null,
          generatedAtUtc: (sidecar?.['generated_at_utc'] as string) ?? null,
          key: mp4Key,
        });
      }
    }
  }

  allEntries.sort((a, b) => b.windowEndUtc.localeCompare(a.windowEndUtc));
  const sliced = allEntries.slice(0, limit);

  const timelapses = await Promise.all(
    sliced.map(async (e) => ({
      deviceId,
      duration: e.duration,
      windowStartUtc: e.windowStartUtc,
      windowEndUtc: e.windowEndUtc,
      videoUrl: e.videoUrl,
      posterUrl: e.posterKey ? await presign(s3, cfg.bucket, e.posterKey) : null,
      sourceCount: e.sourceCount,
      expectedSourceCount: e.expectedSourceCount,
      missingCount: e.missingCount,
      generatedAtUtc: e.generatedAtUtc,
      key: e.key,
    })),
  );

  return { deviceId, timelapses };
}

async function handleSidecar(
  s3Client: S3Client,
  cfg: S3DevConfig,
  deviceId: string,
  captureId: string,
): Promise<unknown> {
  const ts = parseTimestampFromCaptureId(captureId);
  if (!ts) return { error: 'Invalid captureId' };

  const date = new Date(ts);
  const prefix = rawPrefix(cfg.siteId, deviceId, date);
  const key = `${prefix}${captureId}.json`;

  try {
    const obj = await s3Client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }));
    const body = await obj.Body?.transformToString();
    return body ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export default function s3DevPlugin(env: Record<string, string>): Plugin {
  const cfg = parseConfig(env);

  const s3 = new S3Client({ region: cfg.region });

  return {
    name: 'asl-s3-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const urlStr = req.url ?? '';
        if (!urlStr.startsWith('/dev-api/')) return next();

        const url = new URL(urlStr, 'http://localhost');
        const path = url.pathname;

        try {
          // GET /dev-api/devices
          if (path === '/dev-api/devices') {
            const data = await handleDevices(s3, cfg, url);
            return sendJson(res, 200, data);
          }

          // GET /dev-api/devices/:id/captures/latest
          const latestMatch = path.match(/^\/dev-api\/devices\/([^/]+)\/captures\/latest$/);
          if (latestMatch) {
            const data = await handleLatestCapture(s3, cfg, latestMatch[1]);
            return sendJson(res, 200, data);
          }

          // GET /dev-api/devices/:id/captures
          const capturesMatch = path.match(/^\/dev-api\/devices\/([^/]+)\/captures$/);
          if (capturesMatch) {
            const data = await handleCaptures(s3, cfg, capturesMatch[1], url);
            return sendJson(res, 200, data);
          }

          // GET /dev-api/devices/:id/timelapses/latest
          const tlMatch = path.match(/^\/dev-api\/devices\/([^/]+)\/timelapses\/latest$/);
          if (tlMatch) {
            const data = await handleLatestTimelapse(s3, cfg, tlMatch[1], url);
            return sendJson(res, 200, data);
          }

          // GET /dev-api/devices/:id/timelapses
          const tlListMatch = path.match(/^\/dev-api\/devices\/([^/]+)\/timelapses$/);
          if (tlListMatch) {
            const data = await handleListTimelapses(s3, cfg, tlListMatch[1], url);
            return sendJson(res, 200, data);
          }

          // GET /dev-api/devices/:id/captures/:captureId/sidecar
          const sidecarMatch = path.match(/^\/dev-api\/devices\/([^/]+)\/captures\/([^/]+)\/sidecar$/);
          if (sidecarMatch) {
            const data = await handleSidecar(s3, cfg, sidecarMatch[1], sidecarMatch[2]);
            return sendJson(res, 200, data);
          }

          sendJson(res, 404, { error: 'Not found' });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error('[s3-dev-api]', message);
          sendJson(res, 500, { error: message });
        }
      });
    },
  };
}
