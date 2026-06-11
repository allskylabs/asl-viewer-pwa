import { useState, useEffect, useCallback } from 'react';
import { listTimelapses } from '../services/viewerService';
import type { TimelapseListItem, TimelapseDuration } from '../types/viewer';

interface TimelapseBrowserProps {
  deviceId: string;
  onClose: () => void;
}

type DurationFilter = TimelapseDuration | 'all';
type DateFilter = 'today' | 'yesterday' | '7days';

const DATE_FILTER_DAYS: Record<DateFilter, number> = {
  today: 1,
  yesterday: 2,
  '7days': 7,
};

const DURATION_LABELS: Record<string, string> = {
  '1h': '1h',
  '12h': '12h',
  '24h': '24h',
  all: 'All',
};

const DATE_LABELS: Record<DateFilter, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7days': 'Last 7 days',
};

function formatLocalTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatGeneratedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function TimelapseBrowser({ deviceId, onClose }: TimelapseBrowserProps) {
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('7days');
  const [items, setItems] = useState<TimelapseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<TimelapseListItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listTimelapses(deviceId, {
        duration: durationFilter === 'all' ? undefined : durationFilter,
        days: DATE_FILTER_DAYS[dateFilter],
        limit: 50,
      });
      setItems(result.timelapses);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [deviceId, durationFilter, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="panel tl-browser">
      <div className="panel__header">
        <span className="panel__title">Timelapse Browser</span>
        <button className="tl-browser__close" onClick={onClose}>&times;</button>
      </div>
      <div className="panel__body">
        <div className="tl-browser__filters">
          <div className="tl-browser__filter-group">
            <span className="tl-browser__filter-label">Duration</span>
            <div className="tl-browser__pills">
              {(['all', '1h', '12h', '24h'] as DurationFilter[]).map(d => (
                <button
                  key={d}
                  className={`tl-browser__pill${durationFilter === d ? ' tl-browser__pill--active' : ''}`}
                  onClick={() => setDurationFilter(d)}
                >
                  {DURATION_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
          <div className="tl-browser__filter-group">
            <span className="tl-browser__filter-label">Range</span>
            <div className="tl-browser__pills">
              {(['today', 'yesterday', '7days'] as DateFilter[]).map(d => (
                <button
                  key={d}
                  className={`tl-browser__pill${dateFilter === d ? ' tl-browser__pill--active' : ''}`}
                  onClick={() => setDateFilter(d)}
                >
                  {DATE_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeItem && (
          <div className="tl-browser__player">
            <div className="tl-browser__player-header">
              <span className="tl-browser__player-title">
                {activeItem.duration} &mdash; {formatLocalTime(activeItem.windowStartUtc)} – {formatLocalTime(activeItem.windowEndUtc)}
              </span>
              <button className="tl-browser__player-close" onClick={() => setActiveItem(null)}>&times;</button>
            </div>
            <video
              key={activeItem.key}
              src={activeItem.videoUrl}
              controls
              autoPlay
              className="tl-browser__video"
            />
          </div>
        )}

        {loading && <div className="tl-browser__status">Loading timelapses…</div>}
        {error && <div className="tl-browser__status tl-browser__status--error">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="tl-browser__status">No timelapses found for this filter.</div>
        )}

        {!loading && items.length > 0 && (
          <div className="tl-browser__list">
            {items.map(tl => {
              const isActive = activeItem?.key === tl.key;
              const stats: string[] = [];
              if (tl.sourceCount != null) stats.push(`${tl.sourceCount} frames`);
              if (tl.missingCount != null && tl.missingCount > 0) stats.push(`${tl.missingCount} missing`);

              return (
                <div
                  key={tl.key}
                  className={`tl-browser__row${isActive ? ' tl-browser__row--active' : ''}`}
                  onClick={() => setActiveItem(tl)}
                >
                  <div className="tl-browser__row-thumb">
                    {tl.posterUrl ? (
                      <img
                        src={tl.posterUrl}
                        alt=""
                        loading="lazy"
                        className="tl-browser__row-thumb-img"
                      />
                    ) : (
                      <div className="tl-browser__row-thumb-placeholder">
                        <span className="tl-browser__row-thumb-badge">{tl.duration}</span>
                        <span className="tl-browser__row-thumb-range">
                          {formatLocalTime(tl.windowStartUtc)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="tl-browser__row-info">
                    <span className="tl-browser__row-title">
                      {tl.duration} timelapse
                    </span>
                    <span className="tl-browser__row-window">
                      {formatLocalTime(tl.windowStartUtc)} – {formatLocalTime(tl.windowEndUtc)}
                    </span>
                    <span className="tl-browser__row-meta">
                      {stats.length > 0 && <>{stats.join(', ')}</>}
                      {tl.generatedAtUtc && (
                        <>{stats.length > 0 ? ' · ' : ''}Generated {formatGeneratedAt(tl.generatedAtUtc)}</>
                      )}
                    </span>
                  </div>
                  <button
                    className="tl-browser__row-play"
                    onClick={(e) => { e.stopPropagation(); setActiveItem(tl); }}
                  >
                    {isActive ? '▶' : '▷'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
