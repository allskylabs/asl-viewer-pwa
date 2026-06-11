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
