import { Badge } from '../../../components/common';
import { TASK_STAGES } from '../stages';

const ORDER = [
  ['notStarted', 'not_started'],
  ['inProgress', 'in_progress'],
  ['returned', 'returned'],
  ['submitted', 'submitted'],
  ['reviewed', 'reviewed'],
  ['done', 'done'],
];

/** Task counts per stage, skipping empty stages; overdue called out separately. */
export function TaskCounts({ counts }) {
  if (!counts?.total) return <span className="ui-hint">No current tasks</span>;

  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
      {ORDER.filter(([key]) => counts[key] > 0).map(([key, stage]) => (
        <Badge key={key} variant={TASK_STAGES[stage].tone}>
          {counts[key]} {TASK_STAGES[stage].label.toLowerCase()}
        </Badge>
      ))}
      {counts.overdue > 0 && <Badge variant="danger">{counts.overdue} overdue</Badge>}
    </span>
  );
}

export default TaskCounts;
