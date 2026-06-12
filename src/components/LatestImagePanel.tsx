import { memo, useEffect, useState } from 'react';
import type { Capture } from '../types/viewer';

/* Age beyond which the capture-age tag turns amber (minutes) */
const STALE_AGE_MIN = 15;

interface LatestImagePanelProps {
  capture: Capture | null;
  captureIndex: number;
  captureCount: number;
  onOlder: () => void;
  onNewer: () => void;
  onJumpToLatest: () => void;
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

function formatAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ${min % 60}m ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export const LatestImagePanel = memo(function LatestImagePanel({
  capture,
  captureIndex,
  captureCount,
  onOlder,
  onNewer,
  onJumpToLatest,
}: LatestImagePanelProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const captureId = capture?.captureId;

  useEffect(() => {
    setImgLoaded(false);
  }, [captureId]);

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
            {captureIndex > 0 && (
              <button
                className="capture-nav__latest"
                onClick={onJumpToLatest}
                title="Jump to latest capture"
              >
                Latest
              </button>
            )}
            <button
              className="capture-nav__btn"
              disabled={captureIndex >= captureCount - 1}
              onClick={onOlder}
              title="Older capture (←)"
              aria-label="Older capture"
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
              aria-label="Newer capture"
            >
              &#x203A;
            </button>
          </div>
        )}
      </div>
      <div className="panel__body">
        <div className="latest-image">
          <div className="latest-image__viewer">
            {!imgLoaded && <div className="latest-image__skeleton skeleton-shimmer" aria-hidden="true" />}
            <img
              key={capture.captureId}
              src={capture.imageUrl}
              alt={`Capture ${capture.captureId}`}
              onLoad={() => setImgLoaded(true)}
              ref={(el) => {
                if (el?.complete && el.naturalWidth > 0) setImgLoaded(true);
              }}
            />
          </div>
          <div className="latest-image__meta">
            <span className="latest-image__tag">
              {formatTimestamp(capture.timestamp)}
            </span>
            <span
              className={`latest-image__tag latest-image__tag--age${
                Date.now() - new Date(capture.timestamp).getTime() > STALE_AGE_MIN * 60_000
                  ? ' latest-image__tag--stale'
                  : ''
              }`}
            >
              {formatAge(capture.timestamp)}
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
