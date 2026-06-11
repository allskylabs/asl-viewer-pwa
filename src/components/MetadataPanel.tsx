import { useState, useEffect, memo } from 'react';
import type { Device, Capture } from '../types/viewer';
import { getCaptureSidecar } from '../services/viewerService';

interface MetadataPanelProps {
  device: Device;
  capture: Capture | null;
}

type Obj = Record<string, unknown>;

interface MetaItem {
  label: string;
  value: string;
  full?: boolean;
  copyValue?: string;
}

interface MetaSection {
  title: string;
  items: MetaItem[];
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={`copy-btn${copied ? ' copy-btn--copied' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      title={`Copy ${label}`}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function fmtExposure(us: number): string {
  if (us >= 1_000_000) return `${(us / 1_000_000).toFixed(1)}s`;
  if (us >= 1_000) return `${(us / 1_000).toFixed(1)}ms`;
  return `${us}µs`;
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

function buildSections(capture: Capture, sidecar: Obj | null): MetaSection[] {
  const sections: MetaSection[] = [];

  const items: MetaItem[] = [
    { label: 'Device', value: capture.deviceId, copyValue: capture.deviceId },
    { label: 'Site', value: capture.siteId },
    { label: 'Capture ID', value: capture.captureId, full: true, copyValue: capture.captureId },
    { label: 'Timestamp', value: fmtTime(capture.timestamp), full: true },
  ];

  const cap = sidecar?.capture as Obj | undefined;
  const mode = capture.mode ?? (cap?.mode as string | null);
  if (mode) items.push({ label: 'Mode', value: mode });
  if (cap?.profile != null && String(cap.profile) !== mode) {
    items.push({ label: 'Profile', value: String(cap.profile) });
  }
  if (cap?.capture_duration_ms != null) {
    items.push({ label: 'Duration', value: `${Number(cap.capture_duration_ms).toFixed(0)} ms` });
  }
  if (cap?.software_version != null) {
    items.push({ label: 'Software', value: String(cap.software_version) });
  }

  if (capture.sensor) {
    const s = capture.sensor;
    if (s.tempF != null) items.push({ label: 'Temp', value: `${s.tempF} °F` });
    if (s.humidity != null) items.push({ label: 'Humidity', value: `${s.humidity}%` });
    if (s.dewpointF != null) items.push({ label: 'Dewpoint', value: `${s.dewpointF} °F` });
  }

  if (capture.flags) {
    if (capture.flags.isDark) items.push({ label: 'Dark', value: 'Yes' });
    if (capture.flags.possibleIssue) items.push({ label: 'Issue', value: 'Flagged' });
  } else if (sidecar?.flags) {
    const fl = sidecar.flags as Obj;
    if (fl.is_dark === true) items.push({ label: 'Dark', value: 'Yes' });
    if (fl.possible_issue === true) items.push({ label: 'Issue', value: 'Flagged' });
    if (fl.is_valid === false) items.push({ label: 'Valid', value: 'No' });
  }

  sections.push({ title: 'Capture', items });

  if (!sidecar) return sections;

  const cam = sidecar.camera as Obj | undefined;
  if (cam) {
    const ci: MetaItem[] = [];
    if (cam.camera_model) ci.push({ label: 'Model', value: String(cam.camera_model) });
    if (cam.exposure_us != null) ci.push({ label: 'Exposure', value: fmtExposure(Number(cam.exposure_us)) });
    if (cam.gain != null) ci.push({ label: 'Gain', value: String(cam.gain) });
    if (cam.exposure_source) ci.push({ label: 'Exp Source', value: String(cam.exposure_source) });
    if (cam.awb_mode) ci.push({ label: 'AWB', value: String(cam.awb_mode) });
    if (cam.crop_mode) ci.push({ label: 'Crop', value: String(cam.crop_mode) });
    if (ci.length > 0) sections.push({ title: 'Camera', items: ci });
  }

  const img = sidecar.image as Obj | undefined;
  if (img) {
    const ii: MetaItem[] = [];
    if (img.image_width && img.image_height) {
      ii.push({ label: 'Resolution', value: `${img.image_width} × ${img.image_height}` });
    }
    if (img.image_format) ii.push({ label: 'Format', value: String(img.image_format).toUpperCase() });
    if (img.file_size_bytes != null) ii.push({ label: 'File Size', value: fmtBytes(Number(img.file_size_bytes)) });
    const stats = img.stats as Obj | undefined;
    if (stats) {
      if (stats.mean_brightness != null) {
        ii.push({ label: 'Brightness', value: `${Number(stats.mean_brightness).toFixed(1)} avg` });
      }
      if (stats.center_brightness != null && stats.edge_brightness != null) {
        ii.push({ label: 'Ctr / Edge', value: `${Number(stats.center_brightness).toFixed(0)} / ${Number(stats.edge_brightness).toFixed(0)}` });
      }
    }
    if (ii.length > 0) sections.push({ title: 'Image', items: ii });
  }

  const astro = sidecar.astronomy as Obj | undefined;
  if (astro) {
    const ai: MetaItem[] = [];
    if (astro.sun_altitude_deg != null) ai.push({ label: 'Sun Alt', value: `${Number(astro.sun_altitude_deg).toFixed(1)}°` });
    if (astro.sun_azimuth_deg != null) ai.push({ label: 'Sun Az', value: `${Number(astro.sun_azimuth_deg).toFixed(1)}°` });
    if (astro.moon_altitude_deg != null) ai.push({ label: 'Moon Alt', value: `${Number(astro.moon_altitude_deg).toFixed(1)}°` });
    if (astro.moon_azimuth_deg != null) ai.push({ label: 'Moon Az', value: `${Number(astro.moon_azimuth_deg).toFixed(1)}°` });
    if (astro.moon_phase_percent != null) ai.push({ label: 'Moon Phase', value: `${Number(astro.moon_phase_percent).toFixed(0)}%` });
    if (astro.solar_elevation_class) ai.push({ label: 'Sky Class', value: String(astro.solar_elevation_class) });
    if (ai.length > 0) sections.push({ title: 'Sky', items: ai });
  }

  const env = sidecar.environment as Obj | undefined;
  if (env) {
    const ei: MetaItem[] = [];
    if (env.ambient_temp_f != null) ei.push({ label: 'Ambient', value: `${Number(env.ambient_temp_f).toFixed(1)} °F` });
    if (env.case_temp_f != null) ei.push({ label: 'Case Temp', value: `${Number(env.case_temp_f).toFixed(1)} °F` });
    if (env.cpu_temp_f != null) ei.push({ label: 'CPU Temp', value: `${Number(env.cpu_temp_f).toFixed(1)} °F` });
    if (env.humidity_percent != null) ei.push({ label: 'Humidity', value: `${Number(env.humidity_percent).toFixed(0)}%` });
    if (env.dew_point_f != null) ei.push({ label: 'Dew Point', value: `${Number(env.dew_point_f).toFixed(1)} °F` });
    if (env.pressure_hpa != null) ei.push({ label: 'Pressure', value: `${Number(env.pressure_hpa).toFixed(0)} hPa` });
    if (env.fan_state) ei.push({ label: 'Fan', value: String(env.fan_state) });
    if (ei.length > 0) sections.push({ title: 'Environment', items: ei });
  }

  const health = sidecar.health as Obj | undefined;
  const net = sidecar.network as Obj | undefined;
  const si: MetaItem[] = [];
  if (health) {
    if (health.cpu_load_1m != null) si.push({ label: 'CPU Load', value: Number(health.cpu_load_1m).toFixed(2) });
    if (health.memory_available_mb != null) si.push({ label: 'Mem Avail', value: `${Number(health.memory_available_mb).toFixed(0)} MB` });
    if (health.disk_free_mb != null) si.push({ label: 'Disk Free', value: `${(Number(health.disk_free_mb) / 1000).toFixed(1)} GB` });
    if (health.queue_depth != null) si.push({ label: 'Queue', value: String(health.queue_depth) });
  }
  if (net) {
    if (net.wifi_signal_dbm != null) si.push({ label: 'WiFi', value: `${net.wifi_signal_dbm} dBm` });
  }
  if (si.length > 0) sections.push({ title: 'System', items: si });

  return sections;
}

function renderGrid(items: MetaItem[]) {
  return (
    <div className="metadata-grid">
      {items.map((item) => (
        <div
          key={item.label}
          className={`metadata-item${item.full ? ' metadata-item--full' : ''}`}
        >
          <span className="metadata-item__label">{item.label}</span>
          {item.copyValue ? (
            <span className="metadata-item__value metadata-item__value--copyable">
              <span className="metadata-item__text">{item.value}</span>
              <CopyButton text={item.copyValue} label={item.label.toLowerCase()} />
            </span>
          ) : (
            <span className="metadata-item__value">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export const MetadataPanel = memo(function MetadataPanel({ device, capture }: MetadataPanelProps) {
  const [sidecar, setSidecar] = useState<Obj | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!capture) {
      setSidecar(null);
      return;
    }
    setLoading(true);
    getCaptureSidecar(device.deviceId, capture.captureId)
      .then(setSidecar)
      .catch(() => setSidecar(null))
      .finally(() => setLoading(false));
  }, [device.deviceId, capture?.captureId]);

  if (!capture) {
    return (
      <div className="panel">
        <div className="panel__header">
          <span className="panel__title">Capture Detail</span>
        </div>
        <div className="panel__body">
          <span className="meta-muted">Select a capture</span>
        </div>
      </div>
    );
  }

  const sections = buildSections(capture, sidecar);

  return (
    <div className="panel">
      <div className="panel__header">
        <span className="panel__title">Capture Detail</span>
      </div>
      <div className="panel__body meta-detail">
        {sections.map((section, i) => {
          if (i === 0) {
            return (
              <div key={section.title} className="meta-section">
                <div className="meta-section__title">{section.title}</div>
                {renderGrid(section.items)}
              </div>
            );
          }
          return (
            <details key={section.title} className="meta-section">
              <summary>{section.title}</summary>
              {renderGrid(section.items)}
            </details>
          );
        })}

        {loading && <span className="meta-muted">Loading sidecar…</span>}
        {!sidecar && !loading && <span className="meta-muted">Sidecar metadata not available</span>}

        <div className="meta-links">
          {capture.imageUrl && (
            <div className="meta-link-row">
              <a href={capture.imageUrl} target="_blank" rel="noopener noreferrer" className="meta-link-btn">
                Open full image
              </a>
              <CopyButton text={capture.imageUrl} label="image URL" />
            </div>
          )}
          {capture.sidecarUrl && (
            <div className="meta-link-row">
              <a href={capture.sidecarUrl} target="_blank" rel="noopener noreferrer" className="meta-link-btn">
                Open sidecar JSON
              </a>
              <CopyButton text={capture.sidecarUrl} label="sidecar URL" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
