import { LiveClock } from './LiveClock';

interface AppHeaderProps {
  onRefresh?: () => void;
  refreshing?: boolean;
  lastRefreshedAt?: Date | null;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function AppHeader({ onRefresh, refreshing, lastRefreshedAt }: AppHeaderProps) {
  return (
    <header className="app-header">
      <img src="/logo-horizontal.png" alt="AllskyLabs" className="app-header__logo" />
      <div className="app-header__actions">
        <div
          className="view-switch"
          role="group"
          aria-label="View mode — coming soon"
          title="Weather and Astro views are coming soon"
        >
          <span className="view-switch__group">
            <button type="button" className="view-switch__btn" disabled>Weather</button>
            <button type="button" className="view-switch__btn" disabled>Astro</button>
          </span>
          <span className="view-switch__soon">Soon</span>
        </div>
        <LiveClock />
        {onRefresh && (
          <>
            {lastRefreshedAt && (
              <span className="app-header__updated">
                Updated {formatTime(lastRefreshedAt)}
              </span>
            )}
            <button
              className="app-header__refresh-btn"
              onClick={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </>
        )}
        <span className="app-header__subtitle">v{__APP_VERSION__}</span>
      </div>
    </header>
  );
}
