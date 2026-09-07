import Card from './Card';
import ProgressBar from './ProgressBar';

/**
 * Card showing progress towards a target - assignment completion, points
 * toward a reward, focus minutes for the day.
 */
export function ProgressCard({
  title,
  description,
  value = 0,
  max = 100,
  unit,
  variant,
  footer,
  className = '',
  ...rest
}) {
  const percent = max > 0 ? Math.round((Math.min(value, max) / max) * 100) : 0;

  return (
    <Card flat className={className} footer={footer} {...rest}>
      <div className="ui-statcard__row">
        <div>
          <p className="ui-statcard__label">{title}</p>
          <div className="ui-statcard__value">
            {value}
            <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.7 }}>
              {' '}
              / {max}
              {unit ? ` ${unit}` : ''}
            </span>
          </div>
        </div>
        <span className="ui-statcard__icon" aria-hidden="true">
          {percent}%
        </span>
      </div>

      {description && <p className="ui-sectionheader__description">{description}</p>}

      <ProgressBar
        value={value}
        max={max}
        variant={variant}
        label={`${title} progress`}
        className="ui-field"
      />
    </Card>
  );
}

export default ProgressCard;
