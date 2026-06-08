interface StatusBadgeProps {
  online: boolean;
}

export function StatusBadge({ online }: StatusBadgeProps) {
  const cls = online ? 'online' : 'offline';
  return (
    <span className={`status-badge status-badge--${cls}`}>
      <span className="status-badge__dot" />
      <span className="status-badge__label">{cls}</span>
    </span>
  );
}
