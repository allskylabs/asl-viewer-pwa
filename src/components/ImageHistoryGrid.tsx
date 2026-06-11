import { useEffect, useRef, memo } from 'react';
import type { Capture } from '../types/viewer';

interface ImageHistoryGridProps {
  captures: Capture[];
  selectedId: string;
  onSelect: (capture: Capture) => void;
  title?: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ImageHistoryGrid = memo(function ImageHistoryGrid({ captures, selectedId, onSelect, title }: ImageHistoryGridProps) {
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  if (captures.length === 0) {
    return (
      <div className="panel">
        <div className="panel__header">
          <span className="panel__title">{title ?? 'Recent Captures'}</span>
        </div>
        <div className="panel__body">
          <span className="meta-muted">No captures available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <span className="panel__title">{title ?? 'Recent Captures'}</span>
        <span className="capture-nav__pos">{captures.length} images</span>
      </div>
      <div className="panel__body">
        <div className="image-grid-wrap">
          <div className="image-grid">
            {captures.map((cap) => {
              const isSelected = cap.captureId === selectedId;
              return (
                <div
                  key={cap.captureId}
                  ref={isSelected ? selectedRef : undefined}
                  className={`image-grid__item${isSelected ? ' image-grid__item--selected' : ''}`}
                  onClick={() => onSelect(cap)}
                >
                  <img
                    className="image-grid__thumb"
                    src={cap.previewUrl}
                    alt={`Capture at ${cap.timestamp}`}
                    loading="lazy"
                  />
                  <div className="image-grid__time">{formatTime(cap.timestamp)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
