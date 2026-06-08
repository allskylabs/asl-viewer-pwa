import type { Timelapse } from '../types/api';

interface TimelapsePanelProps {
  timelapses: Timelapse[];
}

function formatGenerated(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const durationLabels: Record<string, string> = {
  '1h': 'Last 1-Hour Timelapse',
  '12h': 'Last 12-Hour Timelapse',
};

export function TimelapsePanel({ timelapses }: TimelapsePanelProps) {
  if (timelapses.length === 0) {
    return (
      <div className="panel">
        <div className="panel__header">
          <span className="panel__title">Timelapses</span>
        </div>
        <div className="panel__body">
          <span style={{ color: 'var(--text-muted)' }}>No timelapses available</span>
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
            const playable = tl.status === 'ready' && tl.videoUrl;
            const ready = tl.status === 'ready' && !tl.videoUrl;
            const generating = tl.status === 'generating';

            let sub: string;
            if (playable) sub = `Generated ${formatGenerated(tl.generatedAt)}`;
            else if (ready) sub = `Generated ${formatGenerated(tl.generatedAt)} — no URL yet`;
            else if (generating) sub = 'Generating…';
            else sub = 'Unavailable';

            let icon: string;
            if (playable) icon = '▶';
            else if (ready) icon = '◉';
            else if (generating) icon = '⟳';
            else icon = '■';

            return (
              <a
                key={`${tl.deviceId}-${tl.duration}`}
                href={tl.videoUrl ?? undefined}
                className={`timelapse-link ${playable ? 'timelapse-link--available' : 'timelapse-link--unavailable'}`}
                onClick={(e) => { if (!playable) e.preventDefault(); }}
              >
                <div className="timelapse-link__icon">{icon}</div>
                <div className="timelapse-link__info">
                  <div className="timelapse-link__title">
                    {durationLabels[tl.duration] ?? tl.duration}
                  </div>
                  <div className="timelapse-link__sub">{sub}</div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
