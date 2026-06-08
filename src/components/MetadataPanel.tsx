import type { DeviceSummary, Capture } from '../types/api';

interface MetadataPanelProps {
  device: DeviceSummary;
  capture: Capture;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function MetadataPanel({ device, capture }: MetadataPanelProps) {
  const m = capture.metadata;
  const items: { label: string; value: string }[] = [
    { label: 'Device ID', value: device.deviceId },
    { label: 'Site', value: device.siteName },
    { label: 'Captured', value: formatTime(capture.capturedAt) },
    { label: 'Uploaded', value: capture.uploadedAt ? formatTime(capture.uploadedAt) : '—' },
    { label: 'Queue Depth', value: String(m.queueDepth) },
    { label: 'Disk Free', value: `${m.diskFreeGb.toFixed(1)} GB` },
    { label: 'CPU Temp', value: `${m.cpuTempC.toFixed(1)} °C` },
    { label: 'Case Temp', value: m.caseTempC !== null ? `${m.caseTempC.toFixed(1)} °C` : '—' },
    { label: 'Mode', value: capture.mode },
    { label: 'Exposure', value: `${m.exposureMs} ms` },
    { label: 'Gain', value: String(m.gain) },
    { label: 'Sun Altitude', value: `${m.sunAltitude.toFixed(1)}°` },
    { label: 'Sun Azimuth', value: `${m.sunAzimuth.toFixed(1)}°` },
  ];

  return (
    <div className="panel">
      <div className="panel__header">
        <span className="panel__title">Device Status</span>
      </div>
      <div className="panel__body">
        <div className="metadata-grid">
          {items.map((item) => (
            <div key={item.label} className="metadata-item">
              <span className="metadata-item__label">{item.label}</span>
              <span className="metadata-item__value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
