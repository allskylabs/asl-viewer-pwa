import { useState, useEffect, useMemo, useCallback } from 'react';
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

function isOnline(lastSeenUtc: string): boolean {
  return Date.now() - new Date(lastSeenUtc).getTime() < 5 * 60_000;
}

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [timelapse1h, setTimelapse1h] = useState<Timelapse | null>(null);
  const [timelapse12h, setTimelapse12h] = useState<Timelapse | null>(null);
  const [timelapse24h, setTimelapse24h] = useState<Timelapse | null>(null);
  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

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
      listCaptures(selectedDeviceId, { limit: 30 }),
      getLatestTimelapse(selectedDeviceId, '1h'),
      getLatestTimelapse(selectedDeviceId, '12h'),
      getLatestTimelapse(selectedDeviceId, '24h'),
    ]).then(([captureResult, tl1h, tl12h, tl24h]) => {
      if (cancelled) return;
      setCaptures(captureResult.captures);
      setTimelapse1h(tl1h);
      setTimelapse12h(tl12h);
      setTimelapse24h(tl24h);
      setSelectedCapture(captureResult.captures[0] ?? null);
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
    if (captureIndex >= 0 && captureIndex < captures.length - 1)
      setSelectedCapture(captures[captureIndex + 1]);
  }, [captureIndex, captures]);

  const onNewer = useCallback(() => {
    if (captureIndex > 0)
      setSelectedCapture(captures[captureIndex - 1]);
  }, [captureIndex, captures]);

  const onJumpToLatest = useCallback(() => {
    if (captures.length > 0) setSelectedCapture(captures[0]);
  }, [captures]);

  const refreshDeviceData = useCallback(async () => {
    if (!selectedDeviceId || refreshing) return;
    setRefreshing(true);
    setRefreshError(null);
    clearSidecarCache();

    try {
      const [deviceList, captureResult, tl1h, tl12h, tl24h] = await Promise.all([
        listDevices(),
        listCaptures(selectedDeviceId, { limit: 30 }),
        getLatestTimelapse(selectedDeviceId, '1h'),
        getLatestTimelapse(selectedDeviceId, '12h'),
        getLatestTimelapse(selectedDeviceId, '24h'),
      ]);
      setDevices(deviceList);
      if (!deviceList.some(d => d.deviceId === selectedDeviceId)) {
        setSelectedDeviceId(deviceList[0]?.deviceId ?? null);
      }
      setCaptures(captureResult.captures);
      setTimelapse1h(tl1h);
      setTimelapse12h(tl12h);
      setTimelapse24h(tl24h);
      const prevId = selectedCapture?.captureId;
      const kept = prevId ? captureResult.captures.find(c => c.captureId === prevId) : null;
      setSelectedCapture(kept ?? captureResult.captures[0] ?? null);
      setLastRefreshedAt(new Date());
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }, [selectedDeviceId, refreshing, selectedCapture?.captureId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (captures.length === 0 || captureIndex === -1) return;

      if (e.key === 'ArrowLeft' && captureIndex < captures.length - 1) {
        setSelectedCapture(captures[captureIndex + 1]);
        e.preventDefault();
      } else if (e.key === 'ArrowRight' && captureIndex > 0) {
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

  const online = isOnline(selectedDevice.lastSeenUtc);

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
                    <span className={`status-badge status-badge--${online ? 'online' : 'offline'}`}>
                      <span className="status-badge__dot" />
                      <span className="status-badge__label">{online ? 'online' : 'offline'}</span>
                    </span>
                  </span>
                </div>
                <div className="rail-kv">
                  <span className="rail-kv__label">Last seen</span>
                  <span className="rail-kv__value">{formatAge(selectedDevice.lastSeenUtc)}</span>
                </div>
                {selectedDevice.lastMode && (
                  <div className="rail-kv">
                    <span className="rail-kv__label">Mode</span>
                    <span className="rail-kv__value">{selectedDevice.lastMode}</span>
                  </div>
                )}
              </div>
              {selectedCapture && (
                <div className="rail-card">
                  <div className="rail-card__title">Current Capture</div>
                  <div className="rail-kv">
                    <span className="rail-kv__label">Age</span>
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
          <ImageHistoryGrid
            captures={captures}
            selectedId={selectedCapture?.captureId ?? ''}
            onSelect={setSelectedCapture}
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
