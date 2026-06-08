import type { Capture } from '../types/api';

interface ImageHistoryGridProps {
  captures: Capture[];
  selectedId: string;
  onSelect: (capture: Capture) => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ImageHistoryGrid({ captures, selectedId, onSelect }: ImageHistoryGridProps) {
  if (captures.length === 0) {
    return (
      <div className="panel dashboard-grid__history">
        <div className="panel__header">
          <span className="panel__title">Recent Captures</span>
        </div>
        <div className="panel__body">
          <span style={{ color: 'var(--text-muted)' }}>No captures available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel dashboard-grid__history">
      <div className="panel__header">
        <span className="panel__title">Recent Captures</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {captures.length} images
        </span>
      </div>
      <div className="panel__body">
        <div className="image-grid">
          {captures.map((cap) => (
            <div
              key={cap.captureId}
              className={`image-grid__item${cap.captureId === selectedId ? ' image-grid__item--selected' : ''}`}
              onClick={() => onSelect(cap)}
            >
              <img
                className="image-grid__thumb"
                src={cap.thumbnailUrl}
                alt={`Capture at ${cap.capturedAt}`}
              />
              <div className="image-grid__time">{formatTime(cap.capturedAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
