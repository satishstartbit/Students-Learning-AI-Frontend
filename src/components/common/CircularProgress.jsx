/**
 * A progress ring with arbitrary centred content - the Focus Timer's clock
 * face, distinct from Magic UI's AnimatedCircularProgressBar (components/ui)
 * which only ever displays its own percentage number in the middle.
 */
export function CircularProgress({
  value = 0,
  max = 100,
  size = 200,
  strokeWidth = 12,
  label,
  className = '',
  children,
}) {
  const clamped = Math.min(Math.max(Number(value) || 0, 0), max);
  const percent = max > 0 ? clamped / max : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent);

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-sm)' }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent-base, var(--color-primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      </div>
      {label && <span className="ui-hint">{label}</span>}
    </div>
  );
}

export default CircularProgress;
