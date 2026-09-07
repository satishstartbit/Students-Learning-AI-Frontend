import Badge from './Badge';
import { STATUS_TONE } from '../../utils/constants';
import { formatStatus } from '../../utils/format';

/**
 * Badge for a domain status value.
 *
 * The colour comes from the shared STATUS_TONE map rather than a per-screen
 * lookup, so "completed" looks the same everywhere in the app.
 */
export function StatusBadge({ status, label, dot = true, className = '', ...rest }) {
  if (!status) return null;

  return (
    <Badge
      variant={STATUS_TONE[status] ?? 'neutral'}
      dot={dot}
      className={className}
      {...rest}
    >
      {label ?? formatStatus(status)}
    </Badge>
  );
}

export default StatusBadge;
