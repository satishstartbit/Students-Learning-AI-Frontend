import { Badge, DataTable } from '../../../components/common';
import { daysUntilDateKey, formatDateKey, formatDurationLong, formatTime } from '../../../utils/date';
import { formatName } from '../../../utils/format';
// Subject colours come from the same helper the student's own Home/Plan use,
// so a subject reads the same for the child, the parent and the teacher.
import { getSubjectVisual } from '../../student/components/subjectVisual';
import { ENERGY_LEVELS } from '../../checkIn/moods';
import { useMoodLookup } from '../../checkIn/hooks/useMoodLookup';
import MoodIcon from './MoodIcon';
import { TASK_STAGES } from '../stages';
import CheckInStrip from './CheckInStrip';
import './progressDetail.css';

/**
 * One student's progress: today's check-in, today's tasks and focus time, the
 * last two weeks of check-ins, and every assigned task with its status.
 * Read-only - shared by the Parent Progress page (inside its per-child panel)
 * and the Teacher Progress modal, so the two can't drift apart.
 *
 * `stageLabels` lets a caller reword the task stages for its own audience -
 * the parent page says "Handed in" where the teacher, who set the work, reads
 * the shared "Submitted". Tones stay shared either way.
 *
 * Due dates are calendar days, shown with formatDateKey (no timezone shift);
 * "overdue" comes from the backend, judged on the student's own day.
 */

/** "Today" / "Tomorrow" / "Sep 18" - due dates are calendar days, never shifted. */
function dueLabel(dateKey) {
  const days = daysUntilDateKey(dateKey);
  if (days === null) return 'No due date';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  const withWeekday = days > 1 && days <= 7;
  return formatDateKey(dateKey, {
    year: undefined,
    month: 'short',
    day: 'numeric',
    ...(withWeekday ? { weekday: 'short' } : {}),
  });
}

function EnergyDots({ energy }) {
  return (
    <span className="pg-dots" aria-hidden="true">
      {ENERGY_LEVELS.map((level) => (
        <span key={level} className={`pg-dot${level <= energy ? ' pg-dot--on' : ''}`} />
      ))}
    </span>
  );
}

/** Today's check-in, today's tasks and today's focus time. */
function TodayCards({ progress }) {
  // The mood as Master Management publishes it, not a static emoji map.
  const { moodFor } = useMoodLookup();
  const { today, counts, nextDue, focus } = progress;
  const checkIn = today?.checkIn;
  const mood = checkIn ? moodFor(checkIn.mood) : null;

  const done = (counts?.submitted ?? 0) + (counts?.reviewed ?? 0) + (counts?.done ?? 0);
  const total = counts?.total ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const focusToday = focus?.todayMinutes ?? 0;
  const focusSessions = focus?.todaySessions ?? 0;
  const focusWeek = focus?.weekMinutes ?? 0;

  return (
    <div className="pg-cards">
      <section className="pg-card">
        <p className="pg-card__label">Today&rsquo;s check-in</p>

        {checkIn ? (
          <>
            <div className="pg-checkin">
              <MoodIcon mood={mood} size={44} />
              <span className="pg-checkin__text">
                <span className="pg-checkin__mood">{mood.name}</span>
                <span className="pg-checkin__time">Checked in at {formatTime(checkIn.updatedAt)}</span>
              </span>
            </div>
            <p className="pg-energy">
              Energy
              <EnergyDots energy={checkIn.energy} />
              <span className="ui-sr-only">
                {checkIn.energy} of {ENERGY_LEVELS.length}
              </span>
            </p>
          </>
        ) : (
          <>
            <p className="pg-card__value">Not yet</p>
            <p className="pg-card__note">No check-in today. It opens for them each morning.</p>
          </>
        )}
      </section>

      <section className="pg-card">
        <p className="pg-card__label">Tasks today</p>
        <p className="pg-card__value">{total ? `${done} of ${total} done` : 'Nothing assigned'}</p>
        {total > 0 && (
          <div className="pg-bar" role="img" aria-label={`${done} of ${total} tasks done`}>
            <span className="pg-bar__fill" style={{ width: `${pct}%` }} />
          </div>
        )}
        <p className="pg-card__note">
          {nextDue
            ? `Next: ${nextDue.title}, due ${dueLabel(nextDue.dueDate).toLowerCase()}`
            : 'Nothing waiting on them right now.'}
        </p>
      </section>

      <section className="pg-card">
        <p className="pg-card__label">Focus time today</p>
        <p className="pg-card__value">{focusToday ? formatDurationLong(focusToday) : 'None yet'}</p>
        <p className="pg-card__note">
          {focusSessions
            ? `${focusSessions} session${focusSessions === 1 ? '' : 's'}${focusWeek ? ` · ${formatDurationLong(focusWeek)} this week` : ''}`
            : focusWeek
              ? `${formatDurationLong(focusWeek)} this week`
              : 'No focus sessions this week yet.'}
        </p>
      </section>
    </div>
  );
}

/** Every task in view, and where each one stands. */
function AssignedTasks({ tasks, showTeacher, stageLabels }) {
  const columns = [
    { key: 'title', header: 'Task', render: (row) => <span className="pg-task__title">{row.title}</span> },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) =>
        row.subject ? (
          <span className="pg-subject" data-tone={getSubjectVisual(row.subject).tone}>
            {row.subject}
          </span>
        ) : (
          <span className="ui-hint">—</span>
        ),
    },
    ...(showTeacher
      ? [
          {
            key: 'teacher',
            header: 'From',
            // Own work (PDF Q15) says who added it - never a teacher it didn't come from.
            render: (row) =>
              row.teacher ? (
                formatName(row.teacher)
              ) : row.source === 'parent' ? (
                <span className="ui-hint">Added by a parent</span>
              ) : row.source === 'student' ? (
                <span className="ui-hint">Added by your child</span>
              ) : (
                <span className="ui-hint">—</span>
              ),
          },
        ]
      : []),
    {
      key: 'dueDate',
      header: 'Due',
      render: (row) =>
        row.dueDate ? (
          <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            {dueLabel(row.dueDate)}
            {row.overdue && <Badge variant="danger">Overdue</Badge>}
          </span>
        ) : (
          <span className="ui-hint">No due date</span>
        ),
    },
    {
      key: 'stage',
      header: 'Status',
      render: (row) => (
        <Badge variant={TASK_STAGES[row.stage]?.tone ?? 'neutral'}>
          {stageLabels?.[row.stage] ?? TASK_STAGES[row.stage]?.label ?? row.status}
        </Badge>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      render: (row) => {
        if (row.stage !== 'reviewed') return <span className="ui-hint">—</span>;
        // No maximum is recorded against an assignment, so a score shows on
        // its own rather than as "8 / 10".
        const parts = [row.score != null ? String(row.score) : null, row.feedbackGiven ? 'Feedback' : null].filter(Boolean);
        return parts.length ? parts.join(' · ') : 'Marked';
      },
    },
  ];

  return (
    <section className="pg-block">
      <h3 className="pg-block__title">Assigned tasks</h3>
      <div className="pg-tasks">
        <DataTable
          columns={columns}
          data={tasks}
          rowKey="recipientId"
          emptyTitle="Nothing assigned right now"
          caption="Assigned tasks"
        />
      </div>
    </section>
  );
}

export function StudentProgressDetail({ progress, showTeacher = false, stageLabels, name }) {
  const { tasks = [], checkInHistory = [], historyDays = 14, student } = progress;
  const who = name || student?.firstName || formatName(student, { fallback: '' });

  return (
    <div>
      <TodayCards progress={progress} />

      <CheckInStrip history={checkInHistory} todayKey={progress.today?.date} days={historyDays} name={who} />

      <AssignedTasks tasks={tasks} showTeacher={showTeacher} stageLabels={stageLabels} />
    </div>
  );
}

export default StudentProgressDetail;
