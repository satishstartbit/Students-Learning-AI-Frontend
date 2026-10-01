import { Badge } from '../../../components/common';
import { sourceLabel } from '../planView';

/**
 * Who added a piece of work (PDF Q13, Q15): teacher work says so; work a
 * student or parent added never looks teacher-verified.
 */
export function ProvenanceBadge({ source, viewer = 'student' }) {
  return <Badge variant={source === 'teacher' ? 'info' : 'neutral'}>{sourceLabel(source, viewer)}</Badge>;
}

export default ProvenanceBadge;
