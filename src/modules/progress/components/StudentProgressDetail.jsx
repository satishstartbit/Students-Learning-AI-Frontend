import { Badge, DataTable, SectionHeader } from '../../../components/common';
import { formatDateKey, formatTime } from '../../../utils/date';
import { formatName } from '../../../utils/format';
import { ENERGY_LEVELS, findMood } from '../../checkIn/moods';
import { TASK_STAGES } from '../stages';
import CheckInBadge from './CheckInBadge';
import TaskCounts from './TaskCounts';

/**
 * One student's progress: today's check-in, their assigned tasks with status
 * and due state, and recent check-ins. Read-only - shared by the Teacher
 * Progress drawer and the Parent Progress page.
 *
 * Due dates are calendar days, shown with formatDateKey (no timezone shift);
 * "overdue" comes from the backend, judged on the student's own day.
 */
export function StudentProgressDetail({ progress, showTeacher = false }) {
  const { today, counts, tasks = [], checkInHistory = [], historyDays } = progress;

  const taskColumns = [
    {
      key: 'title',
      header: 'Task',
      render: (row) => (
        <>
          <div style={{ fontWeight: 600 }}>{row.title}</div>
          {row.subject && <div className="ui-hint">{row.subject}</div>}
        </>
      ),
    },
    ...(showTeacher
      ? [{ key: 'teacher', header: 'Teacher', render: (row) => (row.teacher ? formatName(row.teacher) : '—') }]
      : []),
    {
      key: 'dueDate',
      header: 'Due',
      render: (row) =>
        row.dueDate ? (
          <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {formatDateKey(row.dueDate)}
            {row.overdue && <Badge variant="danger">Overdue</Badge>}
          </span>
        ) : (
          <span className="ui-hint">No due date</span>
        ),
    },
    {
      key: 'stage',
      header: 'Status',
      render: (row) => <Badge variant={TASK_STAGES[row.stage]?.tone ?? 'neutral'}>{TASK_STAGES[row.stage]?.label ?? row.status}</Badge>,
    },
    {
      key: 'result',
      header: 'Result',
      render: (row) => {
        if (row.stage !== 'reviewed') return <span className="ui-hint">—</span>;
        const parts = [row.score != null ? `Score ${row.score}` : null, row.feedbackGiven ? 'Feedback given' : null].filter(Boolean);
        return parts.length ? parts.join(' · ') : 'Reviewed';
      },
    },
  ];

  const historyColumns = [
    { key: 'date', header: 'Date', render: (row) => formatDateKey(row.date, { weekday: 'short' }) },
    {
      key: 'mood',
      header: 'Feeling',
      render: (row) => {
        const mood = findMood(row.mood);
        return (
          <>
            <span aria-hidden="true">{mood?.emoji}</span> {mood?.label ?? row.mood}
          </>
        );
      },
    },
    { key: 'energy', header: 'Energy', render: (row) => `${row.energy}/${ENERGY_LEVELS.length}` },
    {
      key: 'availableMinutes',
      header: 'Time',
      render: (row) => (row.availableMinutes != null ? `${row.availableMinutes} min` : '—'),
    },
  ];

  return (
    <div>
      <SectionHeader title="Today" as="h3" />
      <p style={{ margin: '0 0 var(--spacing-sm)' }}>
        <CheckInBadge today={today} />
        {today?.checkIn && <span className="ui-hint"> · checked in at {formatTime(today.checkIn.updatedAt)}</span>}
      </p>
      <p style={{ margin: '0 0 var(--spacing-lg)' }}>
        <TaskCounts counts={counts} />
      </p>

      <SectionHeader title="Assigned tasks" as="h3" />
      <DataTable
        columns={taskColumns}
        data={tasks}
        rowKey="recipientId"
        emptyTitle="Nothing assigned right now"
        caption="Assigned tasks"
      />

      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <SectionHeader title={`Check-ins (last ${historyDays ?? 14} days)`} as="h3" />
        <DataTable
          columns={historyColumns}
          data={checkInHistory}
          emptyTitle="No check-ins in this period"
          caption="Recent check-ins"
        />
      </div>
    </div>
  );
}

export default StudentProgressDetail;
