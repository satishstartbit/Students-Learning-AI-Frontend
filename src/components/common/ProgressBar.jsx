/**
 * Determinate progress indicator.
 *
 * Exposes the real ARIA progressbar semantics so assistive tech can announce
 * completion percentage.
 */
export function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  variant,
  className = '',
  ...rest
}) {
  const clamped = Math.min(Math.max(Number(value) || 0, 0), max);
  const percent = max > 0 ? Math.round((clamped / max) * 100) : 0;

  return (
    <div className={`ui-progress ${size !== 'md' ? `ui-progress--${size}` : ''} ${className}`.trim()} {...rest}>
      {(label || showValue) && (
        <div className="ui-progress__meta">
          {label && <span>{label}</span>}
          {showValue && <span>{percent}%</span>}
        </div>
      )}

      <div
        className="ui-progress__track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? 'Progress'}
      >
        <div
          className={`ui-progress__bar ${variant ? `ui-progress__bar--${variant}` : ''}`.trim()}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
