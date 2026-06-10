import type { Device } from '../types/viewer';

interface DeviceSelectorProps {
  devices: Device[];
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

function isOnline(lastSeenUtc: string): boolean {
  return Date.now() - new Date(lastSeenUtc).getTime() < 5 * 60_000;
}

export function DeviceSelector({ devices, selectedId, onSelect }: DeviceSelectorProps) {
  return (
    <div className="device-list">
      {devices.map((d) => {
        const online = isOnline(d.lastSeenUtc);
        return (
          <button
            key={d.deviceId}
            className={`device-card${d.deviceId === selectedId ? ' device-card--selected' : ''}`}
            onClick={() => onSelect(d.deviceId)}
          >
            <div className="device-card__info">
              <div className="device-card__name">{d.label}</div>
              <div className="device-card__meta">
                {d.siteId} &middot; {formatLastSeen(d.lastSeenUtc)}
              </div>
            </div>
            <span className={`status-dot status-dot--${online ? 'online' : 'offline'}`} />
          </button>
        );
      })}
    </div>
  );
}
