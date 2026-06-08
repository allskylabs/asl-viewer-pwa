import type { Capture } from '../types/api';

interface LatestImagePanelProps {
  capture: Capture;
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

export function LatestImagePanel({ capture }: LatestImagePanelProps) {
  return (
    <div className="panel dashboard-grid__viewer">
      <div className="panel__header">
        <span className="panel__title">Latest Capture</span>
      </div>
      <div className="panel__body">
        <div className="latest-image">
          <div className="latest-image__viewer">
            <img src={capture.imageUrl} alt={`Capture ${capture.captureId}`} />
          </div>
          <div className="latest-image__meta">
            <span className="latest-image__tag">
              {formatTimestamp(capture.capturedAt)}
            </span>
            <span className="latest-image__tag latest-image__tag--mode">
              {capture.mode}
            </span>
            <span className="latest-image__tag">
              {capture.framing}
            </span>
            <span className={`latest-image__tag latest-image__tag--${capture.uploadStatus}`}>
              {capture.uploadStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
