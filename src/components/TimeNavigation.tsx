import { useState, useRef, useEffect, memo } from 'react';

export type TimeRange = 'latest' | '1h' | '6h' | '12h' | '24h';

const RANGES: { value: TimeRange; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '12h', label: '12h' },
  { value: '24h', label: '24h' },
];

interface TimeNavigationProps {
  activeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  onJumpToTime: (time: Date) => void;
  jumpMessage: string | null;
  disabled: boolean;
}

export const TimeNavigation = memo(function TimeNavigation({
  activeRange,
  onRangeChange,
  onJumpToTime,
  jumpMessage,
  disabled,
}: TimeNavigationProps) {
  const [jumpValue, setJumpValue] = useState('');
  const jumpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        jumpRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jumpValue) return;
    const date = new Date(jumpValue);
    if (isNaN(date.getTime())) return;
    onJumpToTime(date);
  }

  return (
    <div className="time-nav">
      <div className="time-nav__row">
        <div className="time-nav__ranges" role="group" aria-label="Time range">
          {RANGES.map(({ value, label }) => (
            <button
              key={value}
              className={`time-nav__pill${activeRange === value ? ' time-nav__pill--active' : ''}`}
              onClick={() => onRangeChange(value)}
              aria-pressed={activeRange === value}
              disabled={disabled}
            >
              {label}
            </button>
          ))}
        </div>
        <form className="time-nav__jump" onSubmit={handleSubmit}>
          <input
            ref={jumpRef}
            type="datetime-local"
            className="time-nav__input"
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            disabled={disabled}
            title="Jump to time (T)"
            aria-label="Jump to date and time"
          />
          <button type="submit" className="time-nav__go" disabled={disabled || !jumpValue}>
            Go
          </button>
        </form>
      </div>
      {jumpMessage && <div className="time-nav__message">{jumpMessage}</div>}
    </div>
  );
});
