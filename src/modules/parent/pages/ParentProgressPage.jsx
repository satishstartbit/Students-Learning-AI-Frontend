import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LuCheck } from 'react-icons/lu';
import { Avatar, Badge, Button, DataTable, EmptyState, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { daysUntilDateKey, formatDateKey, formatDurationLong, formatTime } from '../../../utils/date';
import { formatName } from '../../../utils/format';
import { describeMood, ENERGY_LEVELS } from '../../checkIn/moods';
import { TASK_STAGES } from '../../progress/stages';
import ProgressCheckInStrip from '../components/ProgressCheckInStrip';
import { subjectTone } from '../components/subjectTone';
import parentService from '../services/parent.service';
import '../components/parentPanels.css';
import '../components/parentProgress.css';

/**
 * Parent-facing wording for the task stages. The shared TASK_STAGES labels
 * (modules/progress/stages.js) are written for the teacher who set the work -
 * a parent reads "Handed in", not "Submitted". Tones stay shared, so a stage
 * is the same colour on both pages.
 */
const PARENT_STAGE_LABEL = {
  not_started: 'Not started',
  in_progress: 'In progress',
  returned: 'Sent back to fix',
  submitted: 'Handed in',
  reviewed: 'Marked',
};

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
    <span className="pp-dots" aria-hidden="true">
      {ENERGY_LEVELS.map((level) => (
        <span key={level} className={`pp-dot${level <= energy ? ' pp-dot--on' : ''}`} />
      ))}
    </span>
  );
}

/** Today's check-in, today's tasks and today's focus time - the three cards. */
function TodayCards({ progress }) {
  const { today, counts, nextDue, focus } = progress;
  const checkIn = today?.checkIn;
  const mood = checkIn ? describeMood(checkIn.mood) : null;

  const done = (counts?.submitted ?? 0) + (counts?.reviewed ?? 0);
  const total = counts?.total ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const nextDueLabel = nextDue ? dueLabel(nextDue.dueDate) : null;
  const focusToday = focus?.todayMinutes ?? 0;
  const focusSessions = focus?.todaySessions ?? 0;
  const focusWeek = focus?.weekMinutes ?? 0;

  return (
    <div className="pp-cards">
      <section className="pp-card">
        <p className="pp-card__label">Today&rsquo;s check-in</p>

        {checkIn ? (
          <>
            <div className="pp-checkin">
              <span className="pp-face" data-mood={checkIn.mood} aria-hidden="true">
                {mood.emoji}
              </span>
              <span className="pp-checkin__text">
                <span className="pp-checkin__mood">{mood.name}</span>
                <span className="pp-checkin__time">Checked in at {formatTime(checkIn.updatedAt)}</span>
              </span>
            </div>
            <p className="pp-energy">
              Energy
              <EnergyDots energy={checkIn.energy} />
              <span className="ui-sr-only">
                {checkIn.energy} of {ENERGY_LEVELS.length}
              </span>
            </p>
          </>
        ) : (
          <>
            <p className="pp-card__value">Not yet</p>
            <p className="pp-card__note">No check-in today. It opens for them each morning.</p>
          </>
        )}
      </section>

      <section className="pp-card">
        <p className="pp-card__label">Tasks today</p>
        <p className="pp-card__value">
          {total ? `${done} of ${total} done` : 'Nothing assigned'}
        </p>
        {total > 0 && (
          <div className="pp-bar" role="img" aria-label={`${done} of ${total} tasks done`}>
            <span className="pp-bar__fill" style={{ width: `${pct}%` }} />
          </div>
        )}
        <p className="pp-card__note">
          {nextDue ? `Next: ${nextDue.title}, due ${nextDueLabel.toLowerCase()}` : 'Nothing waiting on them right now.'}
        </p>
      </section>

      <section className="pp-card">
        <p className="pp-card__label">Focus time today</p>
        <p className="pp-card__value">{focusToday ? formatDurationLong(focusToday) : 'None yet'}</p>
        <p className="pp-card__note">
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

/** Everything the child's teachers have assigned, and where each task stands. */
function AssignedTasks({ tasks }) {
  const columns = [
    {
      key: 'title',
      header: 'Task',
      render: (row) => <span className="pp-task__title">{row.title}</span>,
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) =>
        row.subject ? (
          <span className="pp-subject" data-tone={subjectTone(row.subject)}>
            {row.subject}
          </span>
        ) : (
          <span className="ui-hint">—</span>
        ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (row) => (row.teacher ? formatName(row.teacher) : <span className="ui-hint">—</span>),
    },
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
          {PARENT_STAGE_LABEL[row.stage] ?? TASK_STAGES[row.stage]?.label ?? row.status}
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
    <section className="pp-block">
      <h3 className="pp-block__title">Assigned tasks</h3>
      <div className="pp-tasks">
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

/**
 * /parent/progress - pick a child, then see how they are arriving each day and
 * how their work is going.
 *
 * Built as its own page rather than folded into Learning Summary: that page
 * covers AI Assistant activity and only a per-status count of assignments,
 * with no task list, due dates or check-ins. Read-only.
 */
export default function ParentProgressPage() {
  const summaries = useApi(parentService.getProgress, { immediate: true });
  const detail = useApi(parentService.getChildProgress);
  const { run: runDetail } = detail;

  // Which child is shown lives in the URL (?childId=), so "View progress" on
  // a My Children card opens on that child and the choice survives a reload
  // or a shared link.
  const [searchParams, setSearchParams] = useSearchParams();
  const childId = searchParams.get('childId') ?? '';
  const setChildId = (id) => setSearchParams(id ? { childId: id } : {}, { replace: true });

  const children = summaries.data ?? [];
  // First child by default, derived rather than synced from an effect. An id
  // that isn't one of this parent's children falls back the same way.
  const known = children.some((c) => c.student.id === childId);
  const selectedId = (known ? childId : '') || children[0]?.student.id || '';

  useEffect(() => {
    if (selectedId) runDetail(selectedId).catch(() => {});
  }, [selectedId, runDetail]);

  if (summaries.isLoading && !summaries.data) return <Loader message="Loading progress…" />;

  if (summaries.error && !summaries.data) {
    return (
      <div className="td-page">
        <PageHeader title="Progress" />
        <ErrorState title="We couldn't load progress" error={summaries.error} onRetry={() => summaries.run().catch(() => {})} />
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className="td-page">
        <PageHeader title="Progress" />
        <EmptyState
          icon="👨‍👩‍👧"
          title="No children on your account yet"
          description="Once you add a child, their check-ins and task progress will show up here."
          action={
            <Button as={Link} to="/parent/children">
              Go to My Children
            </Button>
          }
        />
      </div>
    );
  }

  const selected = children.find((c) => c.student.id === selectedId);
  const selectedName = selected ? formatName(selected.student) : '';
  const firstName = selected?.student?.firstName ?? selectedName;
  const ready = !detail.isLoading && !detail.error && detail.data?.student?.id === selectedId;

  return (
    <div className="td-page">
      <PageHeader title="Progress" description="How each child is arriving each day, and how their work is going." />

      <section>
        <p className="pp-picker__label" id="pp-choose-child">
          Choose a child
        </p>
        <div className="pp-picker" role="group" aria-labelledby="pp-choose-child">
          {children.map((child) => {
            const active = child.student.id === selectedId;
            const name = formatName(child.student);
            const checkIn = child.today?.checkIn;
            const counts = child.counts ?? {};
            const done = (counts.submitted ?? 0) + (counts.reviewed ?? 0);

            return (
              <button
                key={child.student.id}
                type="button"
                className="pp-child"
                aria-pressed={active}
                onClick={() => setChildId(child.student.id)}
              >
                <Avatar name={name} size="md" />

                <span className="pp-child__body">
                  <span className="pp-child__name">{name}</span>
                  {child.student.grade && <span className="pp-child__grade">{child.student.grade}</span>}

                  <span className="pp-child__chips">
                    {checkIn ? (
                      <Badge variant="success">Checked in · {describeMood(checkIn.mood).name}</Badge>
                    ) : (
                      <Badge variant="neutral">Not checked in yet</Badge>
                    )}
                    <Badge variant="neutral">
                      {counts.total ? `${done} of ${counts.total} tasks today` : 'No tasks yet'}
                    </Badge>
                  </span>
                </span>

                {active && (
                  <span className="pp-child__tick" aria-hidden="true">
                    <LuCheck size={13} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="pp-panel">
        <div className="pp-panel__head">
          <Avatar name={selectedName} size="md" />
          <div>
            <h2 className="pp-panel__title">{selectedName}&rsquo;s progress</h2>
            <p className="pp-panel__sub">
              {[selected?.student?.grade, `Everything below is about ${firstName}.`].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {detail.isLoading && <Loader message="Loading…" />}

        {detail.error && !detail.isLoading && (
          <ErrorState
            title="We couldn't load this child's progress"
            error={detail.error}
            onRetry={() => runDetail(selectedId).catch(() => {})}
          />
        )}

        {ready && (
          <>
            <TodayCards progress={detail.data} />

            <ProgressCheckInStrip
              history={detail.data.checkInHistory}
              todayKey={detail.data.today?.date}
              days={detail.data.historyDays ?? 14}
              name={firstName}
            />

            <AssignedTasks tasks={detail.data.tasks ?? []} />
          </>
        )}
      </section>
    </div>
  );
}
