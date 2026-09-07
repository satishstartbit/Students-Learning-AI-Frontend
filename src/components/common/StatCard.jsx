import Card from './Card';
import Spinner from './Spinner';

/**
 * Single headline metric for dashboards.
 *
 * @param trend - { direction: 'up' | 'down', value: string }
 */
export function StatCard({
  label,
  value,
  icon,
  trend,
  hint,
  loading = false,
  className = '',
  ...rest
}) {
  return (
    <Card flat className={className} {...rest}>
      <div className="ui-statcard__row">
        <div>
          <p className="ui-statcard__label">{label}</p>

          <div className="ui-statcard__value">
            {loading ? <Spinner label={`Loading ${label}`} /> : value}
          </div>

          {trend && (
            <div className={`ui-statcard__trend ui-statcard__trend--${trend.direction}`}>
              <span aria-hidden="true">{trend.direction === 'up' ? '▲' : '▼'}</span> {trend.value}
            </div>
          )}

          {hint && <p className="ui-hint">{hint}</p>}
        </div>

        {icon && (
          <span className="ui-statcard__icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}

export default StatCard;
