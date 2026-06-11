import { memo } from 'react';
import type { Capture } from '../types/viewer';

interface LatestImagePanelProps {
  capture: Capture | null;
  captureIndex: number;
  captureCount: number;
  onOlder: () => void;
  onNewer: () => void;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const LatestImagePanel = memo(function LatestImagePanel({
  capture,
  captureIndex,
  captureCount,
  onOlder,
  onNewer,
}: LatestImagePanelProps) {
  if (!capture) {
    return (
      <div className="panel">
        <div className="panel__header">
          <span className="panel__title">Capture Viewer</span>
        </div>
        <div className="panel__body">
          <div className="latest-image">
            <div className="latest-image__viewer">
              <div className="state-message">No captures available</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <span className="panel__title">Capture Viewer</span>
        {captureCount > 1 && (
          <div className="capture-nav">
            <button
              className="capture-nav__btn"
              disabled={captureIndex >= captureCount - 1}
              onClick={onOlder}
              title="Older capture (←)"
            >
              &#x2039;
            </button>
            <span className="capture-nav__pos">
              {captureIndex + 1} / {captureCount}
            </span>
            <button
              className="capture-nav__btn"
              disabled={captureIndex <= 0}
              onClick={onNewer}
              title="Newer capture (→)"
            >
              &#x203A;
            </button>
          </div>
        )}
      </div>
      <div className="panel__body">
        <div className="latest-image">
          <div className="latest-image__viewer">
            <img src={capture.imageUrl} alt={`Capture ${capture.captureId}`} />
          </div>
          <div className="latest-image__meta">
            <span className="latest-image__tag">
              {formatTimestamp(capture.timestamp)}
            </span>
            {capture.mode && (
              <span className="latest-image__tag latest-image__tag--mode">
                {capture.mode}
              </span>
            )}
            {captureIndex === 0 && (
              <span className="latest-image__tag latest-image__tag--uploaded">
                latest
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
