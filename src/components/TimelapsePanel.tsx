import type { Timelapse } from '../types/viewer';

interface TimelapsePanelProps {
  timelapses: Timelapse[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const durationLabels: Record<string, string> = {
  '1h': '1-Hour Timelapse',
  '12h': '12-Hour Timelapse',
  '24h': '24-Hour Timelapse',
};

export function TimelapsePanel({ timelapses }: TimelapsePanelProps) {
  if (timelapses.length === 0) {
    return (
      <div className="panel">
        <div className="panel__header">
          <span className="panel__title">Timelapses</span>
        </div>
        <div className="panel__body">
          <span className="meta-muted">No timelapses available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <span className="panel__title">Timelapses</span>
      </div>
      <div className="panel__body">
        <div className="timelapse-list">
          {timelapses.map((tl) => {
            const window = `${formatTime(tl.windowStartUtc)} – ${formatTime(tl.windowEndUtc)}`;
            const stats = tl.sourceCount != null
              ? `${tl.sourceCount} frames${tl.missingCount ? `, ${tl.missingCount} missing` : ''}`
              : '';

            return (
              <div key={`${tl.deviceId}-${tl.duration}`} className="timelapse-card">
                <div className="timelapse-card__label">
                  {durationLabels[tl.duration] ?? tl.duration}
                </div>
                <video
                  src={tl.videoUrl}
                  controls
                  preload="metadata"
                  className="timelapse-card__video"
                />
                <div className="timelapse-card__meta">
                  <span className="timelapse-card__sub">{window}</span>
                  {stats && <span className="timelapse-card__sub">{stats}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
