import { useState, useEffect } from 'react';
import {
  listDevices,
  getRecentCaptures,
  getTimelapses,
} from './services/captureService';
import { AppHeader } from './components/AppHeader';
import { DeviceSelector } from './components/DeviceSelector';
import { LatestImagePanel } from './components/LatestImagePanel';
import { ImageHistoryGrid } from './components/ImageHistoryGrid';
import { MetadataPanel } from './components/MetadataPanel';
import { TimelapsePanel } from './components/TimelapsePanel';
import type { DeviceSummary, Capture, Timelapse } from './types/api';

export default function App() {
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [timelapses, setTimelapses] = useState<Timelapse[]>([]);
  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDevices().then((list) => {
      setDevices(list);
      if (list.length > 0) {
        setSelectedDeviceId(list[0].deviceId);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedDeviceId) return;
    Promise.all([
      getRecentCaptures(selectedDeviceId),
      getTimelapses(selectedDeviceId),
    ]).then(([caps, tls]) => {
      setCaptures(caps);
      setTimelapses(tls);
      setSelectedCapture(caps[0] ?? null);
    });
  }, [selectedDeviceId]);

  const selectedDevice = devices.find((d) => d.deviceId === selectedDeviceId);

  if (loading) {
    return (
      <div className="app-layout">
        <AppHeader />
        <div className="app-body">
          <div className="main-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Loading devices…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedDevice || !selectedCapture) {
    return (
      <div className="app-layout">
        <AppHeader />
        <div className="app-body">
          <DeviceSelector
            devices={devices}
            selectedId={selectedDeviceId ?? ''}
            onSelect={setSelectedDeviceId}
          />
          <div className="main-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {devices.length === 0 ? 'No devices available' : 'No captures for this device'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <AppHeader />
      <div className="app-body">
        <DeviceSelector
          devices={devices}
          selectedId={selectedDevice.deviceId}
          onSelect={setSelectedDeviceId}
        />
        <main className="main-content">
          <div className="dashboard-grid">
            <LatestImagePanel capture={selectedCapture} />
            <div className="dashboard-grid__sidebar">
              <MetadataPanel
                device={selectedDevice}
                capture={selectedCapture}
              />
              <TimelapsePanel timelapses={timelapses} />
            </div>
            <ImageHistoryGrid
              captures={captures}
              selectedId={selectedCapture.captureId}
              onSelect={setSelectedCapture}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
