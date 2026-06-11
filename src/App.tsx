import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  listDevices,
  listCaptures,
  getLatestTimelapse,
  getCaptureSidecar,
  clearSidecarCache,
} from './services/viewerService';
import { AppHeader } from './components/AppHeader';
import { DeviceSelector } from './components/DeviceSelector';
import { LatestImagePanel } from './components/LatestImagePanel';
import { ImageHistoryGrid } from './components/ImageHistoryGrid';
import { MetadataPanel } from './components/MetadataPanel';
import { TimelapsePanel } from './components/TimelapsePanel';
import { TimeNavigation } from './components/TimeNavigation';
import type { TimeRange } from './components/TimeNavigation';
import type { Device, Capture, Timelapse } from './types/viewer';

function formatAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

const RANGE_HOURS: Record<string, number> = { '1h': 1, '6h': 6, '12h': 12, '24h': 24 };

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [allCaptures, setAllCaptures] = useState<Capture[]>([]);
  const [timelapse1h, setTimelapse1h] = useState<Timelapse | null>(null);
  const [timelapse12h, setTimelapse12h] = useState<Timelapse | null>(null);
  const [timelapse24h, setTimelapse24h] = useState<Timelapse | null>(null);
  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('latest');
  const [jumpMessage, setJumpMessage] = useState<string | null>(null);

  const captures = useMemo(() => {
    if (timeRange === 'latest') return allCaptures.slice(0, 30);
    const cutoff = new Date(Date.now() - RANGE_HOURS[timeRange] * 3600_000).toISOString();
    return allCaptures.filter(c => c.timestamp >= cutoff);
  }, [allCaptures, timeRange]);

  const selectedCaptureRef = useRef(selectedCapture);
  selectedCaptureRef.current = selectedCapture;

  const followLatestRef = useRef(true);

  useEffect(() => {
    if (captures.length === 0) {
      setSelectedCapture(null);
      return;
    }
    if (followLatestRef.current) {
      setSelectedCapture(captures[0]);
      return;
    }
    const sel = selectedCaptureRef.current;
    if (sel) {
      const match = captures.find(c => c.captureId === sel.captureId);
      if (match) {
        if (match !== sel) setSelectedCapture(match);
        return;
      }
    }
    setSelectedCapture(captures[0]);
  }, [captures]);

  useEffect(() => {
    if (!jumpMessage) return;
    const t = setTimeout(() => setJumpMessage(null), 6000);
    return () => clearTimeout(t);
  }, [jumpMessage]);

  useEffect(() => {
    listDevices()
      .then((list) => {
        setDevices(list);
        const saved = localStorage.getItem('asl-viewer:selectedDeviceId');
        const match = saved ? list.find(d => d.deviceId === saved) : null;
        setSelectedDeviceId(match ? match.deviceId : list[0]?.deviceId ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDeviceId) return;
    let cancelled = false;

    Promise.all([
      listCaptures(selectedDeviceId, { limit: 100 }),
      getLatestTimelapse(selectedDeviceId, '1h'),
      getLatestTimelapse(selectedDeviceId, '12h'),
      getLatestTimelapse(selectedDeviceId, '24h'),
    ]).then(([captureResult, tl1h, tl12h, tl24h]) => {
      if (cancelled) return;
      setAllCaptures(captureResult.captures);
      setTimelapse1h(tl1h);
      setTimelapse12h(tl12h);
      setTimelapse24h(tl24h);
      setLastRefreshedAt(new Date());
    }).catch((err) => {
      if (!cancelled) setError(err.message);
    });

    return () => { cancelled = true; };
  }, [selectedDeviceId]);

  useEffect(() => {
    if (selectedDeviceId) {
      localStorage.setItem('asl-viewer:selectedDeviceId', selectedDeviceId);
    }
  }, [selectedDeviceId]);

  const selectedDevice = devices.find((d) => d.deviceId === selectedDeviceId);

  const captureIndex = selectedCapture
    ? captures.findIndex(c => c.captureId === selectedCapture.captureId)
    : -1;

  const timelapses = useMemo(
    () => [timelapse1h, timelapse12h, timelapse24h].filter((t): t is Timelapse => t !== null),
    [timelapse1h, timelapse12h, timelapse24h],
  );

  const onOlder = useCallback(() => {
    if (captureIndex >= 0 && captureIndex < captures.length - 1) {
      followLatestRef.current = false;
      setSelectedCapture(captures[captureIndex + 1]);
    }
  }, [captureIndex, captures]);

  const onNewer = useCallback(() => {
    if (captureIndex > 0) {
      followLatestRef.current = captureIndex - 1 === 0;
      setSelectedCapture(captures[captureIndex - 1]);
    }
  }, [captureIndex, captures]);

  const onJumpToLatest = useCallback(() => {
    if (captures.length > 0) {
      followLatestRef.current = true;
      setSelectedCapture(captures[0]);
    }
  }, [captures]);

  const refreshDeviceData = useCallback(async () => {
    if (!selectedDeviceId || refreshing) return;
    setRefreshing(true);
    setRefreshError(null);
    clearSidecarCache();
    followLatestRef.current = true;

    try {
      const [deviceList, captureResult, tl1h, tl12h, tl24h] = await Promise.all([
        listDevices(),
        listCaptures(selectedDeviceId, { limit: 100 }),
        getLatestTimelapse(selectedDeviceId, '1h'),
        getLatestTimelapse(selectedDeviceId, '12h'),
        getLatestTimelapse(selectedDeviceId, '24h'),
      ]);
      setDevices(deviceList);
      if (!deviceList.some(d => d.deviceId === selectedDeviceId)) {
        setSelectedDeviceId(deviceList[0]?.deviceId ?? null);
      }
      setAllCaptures(captureResult.captures);
      setTimelapse1h(tl1h);
      setTimelapse12h(tl12h);
      setTimelapse24h(tl24h);
      setLastRefreshedAt(new Date());
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }, [selectedDeviceId, refreshing]);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    setJumpMessage(null);
  }, []);

  const handleJumpToTime = useCallback((targetTime: Date) => {
    if (captures.length === 0) {
      setJumpMessage('No captures available');
      return;
    }
    const targetMs = targetTime.getTime();
    if (targetMs > Date.now()) {
      setJumpMessage('Time is in the future — showing latest capture');
      followLatestRef.current = true;
      setSelectedCapture(captures[0]);
      return;
    }

    let nearest = captures[0];
    let nearestDiff = Math.abs(new Date(captures[0].timestamp).getTime() - targetMs);
    for (const cap of captures) {
      const diff = Math.abs(new Date(cap.timestamp).getTime() - targetMs);
      if (diff < nearestDiff) {
        nearest = cap;
        nearestDiff = diff;
      }
    }

    followLatestRef.current = nearest === captures[0];
    setSelectedCapture(nearest);

    const fmt = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const nearestTime = new Date(nearest.timestamp);
    const diffMin = Math.round(nearestDiff / 60_000);

    if (diffMin > 30) {
      setJumpMessage(`No captures near ${fmt(targetTime)}. Nearest: ${fmt(nearestTime)} (${diffMin}m away)`);
    } else if (diffMin > 0) {
      setJumpMessage(`Jumped to ${fmt(nearestTime)} (nearest to ${fmt(targetTime)})`);
    } else {
      setJumpMessage(`Jumped to ${fmt(nearestTime)}`);
    }
  }, [captures]);

  const filmstripTitle = timeRange === 'latest'
    ? 'Recent Captures'
    : `Captures — Last ${timeRange}`;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (captures.length === 0 || captureIndex === -1) return;

      if (e.key === 'ArrowLeft' && captureIndex < captures.length - 1) {
        followLatestRef.current = false;
        setSelectedCapture(captures[captureIndex + 1]);
        e.preventDefault();
      } else if (e.key === 'ArrowRight' && captureIndex > 0) {
        followLatestRef.current = captureIndex - 1 === 0;
        setSelectedCapture(captures[captureIndex - 1]);
        e.preventDefault();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [captures, captureIndex]);

  useEffect(() => {
    if (!selectedDeviceId || captureIndex < 0 || captures.length === 0) return;
    const toPreload: string[] = [];
    if (captureIndex > 0) {
      toPreload.push(captures[captureIndex - 1].imageUrl);
      getCaptureSidecar(selectedDeviceId, captures[captureIndex - 1].captureId);
    }
    if (captureIndex < captures.length - 1) {
      toPreload.push(captures[captureIndex + 1].imageUrl);
      getCaptureSidecar(selectedDeviceId, captures[captureIndex + 1].captureId);
    }
    toPreload.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [selectedDeviceId, captureIndex, captures]);

  useEffect(() => {
    if (!selectedDeviceId) return;
    const INTERVAL = 30_000;
    let id: ReturnType<typeof setInterval> | null = null;
    let inflight = false;

    async function tick() {
      if (inflight) return;
      inflight = true;
      try {
        const result = await listCaptures(selectedDeviceId!, { limit: 100 });
        setAllCaptures(result.captures);
        followLatestRef.current = true;
        setSelectedCapture(result.captures[0] ?? null);
        setLastRefreshedAt(new Date());
      } catch {
        // silent — manual refresh surfaces errors
      } finally {
        inflight = false;
      }
    }

    function start() {
      if (!id) id = setInterval(tick, INTERVAL);
    }
    function stop() {
      if (id) { clearInterval(id); id = null; }
    }
    function onVisibility() {
      if (document.hidden) stop(); else start();
    }

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [selectedDeviceId]);

  useEffect(() => {
    const INTERVAL = 60_000;
    let id: ReturnType<typeof setInterval> | null = null;
    let inflight = false;

    async function tick() {
      if (inflight) return;
      inflight = true;
      try {
        const fresh = await listDevices();
        setDevices(fresh);
      } catch {
        // silent — manual refresh surfaces errors
      } finally {
        inflight = false;
      }
    }

    function start() {
      if (!id) id = setInterval(tick, INTERVAL);
    }
    function stop() {
      if (id) { clearInterval(id); id = null; }
    }
    function onVisibility() {
      if (document.hidden) stop(); else start();
    }

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (loading) {
    return (
      <div className="app-layout">
        <AppHeader />
        <div className="app-body">
          <div className="main-content">
            <div className="state-message state-message--loading">Loading devices…</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-layout">
        <AppHeader />
        <div className="app-body">
          <div className="main-content">
            <div className="state-message state-message--error">
              <span className="state-message__title">Connection Error</span>
              <span className="state-message__detail">{error}</span>
              <span className="state-message__hint">
                Check .env.local and AWS credentials. See .env.example for setup.
              </span>
              <button
                className="state-message__retry"
                onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedDevice) {
    return (
      <div className="app-layout">
        <AppHeader />
        <div className="app-body">
          <div className="main-content">
            <div className="state-message">No devices available</div>
          </div>
        </div>
      </div>
    );
  }

  const latestCaptureTimestamp = captures.length > 0
    ? captures[0].timestamp
    : (selectedDevice.latestCaptureUtc ?? selectedDevice.lastSeenUtc);

  return (
    <div className="app-layout">
      <AppHeader
        onRefresh={refreshDeviceData}
        refreshing={refreshing}
        lastRefreshedAt={lastRefreshedAt}
      />
      <div className="app-body">
        <aside className="left-rail">
          <div className="left-rail__section">
            <div className="left-rail__heading">Devices</div>
            <div className="left-rail__devices">
              <DeviceSelector
                devices={devices}
                selectedId={selectedDevice.deviceId}
                onSelect={setSelectedDeviceId}
              />
            </div>
          </div>
          <div className="left-rail__section left-rail__section--fill">
            <div className="rail-info">
              <div className="rail-card">
                <div className="rail-card__title">Device Status</div>
                <div className="rail-kv">
                  <span className="rail-kv__label">Status</span>
                  <span className="rail-kv__value">
                    <span className={`status-badge status-badge--${selectedDevice.status}`}>
                      <span className="status-badge__dot" />
                      <span className="status-badge__label">{selectedDevice.status}</span>
                    </span>
                  </span>
                </div>
                <div className="rail-kv">
                  <span className="rail-kv__label">Latest image</span>
                  <span className="rail-kv__value">{formatAge(latestCaptureTimestamp)}</span>
                </div>
                {lastRefreshedAt && (
                  <div className="rail-kv">
                    <span className="rail-kv__label">Data refreshed</span>
                    <span className="rail-kv__value">{formatAge(lastRefreshedAt.toISOString())}</span>
                  </div>
                )}
              </div>
              {selectedCapture && (
                <div className="rail-card">
                  <div className="rail-card__title">Selected Capture</div>
                  <div className="rail-kv">
                    <span className="rail-kv__label">Viewing</span>
                    <span className="rail-kv__value">{formatAge(selectedCapture.timestamp)}</span>
                  </div>
                  {selectedCapture.mode && (
                    <div className="rail-kv">
                      <span className="rail-kv__label">Mode</span>
                      <span className="rail-kv__value">{selectedCapture.mode}</span>
                    </div>
                  )}
                  {selectedCapture.sensor?.tempF != null && (
                    <div className="rail-kv">
                      <span className="rail-kv__label">Temp</span>
                      <span className="rail-kv__value">{selectedCapture.sensor.tempF}°F</span>
                    </div>
                  )}
                  {selectedCapture.sensor?.humidity != null && (
                    <div className="rail-kv">
                      <span className="rail-kv__label">Humidity</span>
                      <span className="rail-kv__value">{selectedCapture.sensor.humidity}%</span>
                    </div>
                  )}
                  <div className="rail-kv">
                    <span className="rail-kv__label">Position</span>
                    <span className="rail-kv__value">{captureIndex + 1} / {captures.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="main-content">
          {refreshError && (
            <div className="refresh-error">
              <div className="refresh-error__text">
                <span className="refresh-error__title">Refresh failed</span>
                <span className="refresh-error__detail">{refreshError}</span>
              </div>
              <div className="refresh-error__actions">
                <button className="refresh-error__btn" onClick={refreshDeviceData}>Retry</button>
                <button
                  className="refresh-error__btn refresh-error__btn--dismiss"
                  onClick={() => setRefreshError(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <LatestImagePanel
            capture={selectedCapture}
            captureIndex={captureIndex}
            captureCount={captures.length}
            onOlder={onOlder}
            onNewer={onNewer}
            onJumpToLatest={onJumpToLatest}
          />
          <TimelapsePanel timelapses={timelapses} />
          <TimeNavigation
            activeRange={timeRange}
            onRangeChange={handleTimeRangeChange}
            onJumpToTime={handleJumpToTime}
            jumpMessage={jumpMessage}
            disabled={captures.length === 0}
          />
          <ImageHistoryGrid
            captures={captures}
            selectedId={selectedCapture?.captureId ?? ''}
            onSelect={(cap) => {
              followLatestRef.current = captures.length > 0 && cap.captureId === captures[0].captureId;
              setSelectedCapture(cap);
            }}
            title={filmstripTitle}
          />
        </main>

        <aside className="right-sidebar">
          <MetadataPanel
            device={selectedDevice}
            capture={selectedCapture}
          />
        </aside>
      </div>
    </div>
  );
}
