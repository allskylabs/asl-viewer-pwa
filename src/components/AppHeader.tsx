export function AppHeader() {
  return (
    <header className="app-header">
      <img src="/logo-horizontal.png" alt="AllskyLabs" className="app-header__logo" />
      <span className="app-header__subtitle">Viewer v{__APP_VERSION__}</span>
    </header>
  );
}
