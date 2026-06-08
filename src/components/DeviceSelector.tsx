import type { DeviceSummary } from '../types/api';
import { StatusBadge } from './StatusBadge';

interface DeviceSelectorProps {
  devices: DeviceSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function formatLastSeen(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function DeviceSelector({ devices, selectedId, onSelect }: DeviceSelectorProps) {
  return (
    <nav className="device-selector">
      <div className="device-selector__heading">Devices</div>
      {devices.map((d) => (
        <button
          key={d.deviceId}
          className={`device-card${d.deviceId === selectedId ? ' device-card--selected' : ''}`}
          onClick={() => onSelect(d.deviceId)}
        >
          <div className="device-card__info">
            <div className="device-card__name">{d.deviceId}</div>
            <div className="device-card__site">{d.siteName}</div>
            <div className="device-card__last-seen">{formatLastSeen(d.lastSeen)}</div>
          </div>
          <StatusBadge online={d.online} />
        </button>
      ))}
    </nav>
  );
}
