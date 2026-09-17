import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, ProgressBar, Loader, ErrorState } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { useWeekPlan, startOfWeek } from '../hooks/useWeekPlan';
import { addDays, formatDate, formatDateKey, formatDuration, getDateKey, daysUntil } from '../../../utils/date';
import SubjectIcon from '../components/SubjectIcon';

const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DONE_STATUSES = new Set(['submitted', 'reviewed', 'completed']);

function DueSoonRow({ task }) {
  const assignment = task.assignment ?? {};
  const days = daysUntil(assignment.dueDate);
  const label = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days > 1 ? `In ${days} days` : formatDate(assignment.dueDate);

  return (
    <Link
      to={`/student/assignments/${assignment.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) 0',
        borderBottom: '1px solid var(--color-border)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <SubjectIcon subject={assignment.subject} size="sm" />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 600, color: 'var(--color-text-primary)' }}>{assignment.title}</span>
        <span className="ui-hint">{assignment.subject}</span>
      </span>
      <span className="ui-hint" style={{ flex: 'none', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </Link>
  );
}

/**
 * Grade 6+ "Plan" - a Monday-Sunday calendar of assignments, grouped by due
 * date (see hooks/useWeekPlan.js - reads the same data the Home dashboard
 * already fetches, no new endpoint). "Add assignment" is a personal-task
 * idea from the reference design that has no backend of its own yet, so it
 * says so rather than silently doing nothing.
 */
export default function StudentPlanPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState('week');

  const weekStart = useMemo(() => addDays(startOfWeek(), weekOffset * 7), [weekOffset]);
  const { days, isLoading, error, reload } = useWeekPlan(weekStart);
  const todayKey = getDateKey();

  // Day view: today, if the current week is showing; otherwise the first day
  // of whichever week is selected (today itself isn't in that week).
  const dayViewDay = weekOffset === 0 ? days.find((d) => d.key === todayKey) ?? days[0] : days[0];
  const shownDays = viewMode === 'day' ? [dayViewDay] : days;

  const weekTotal = days.reduce((n, d) => n + d.items.length, 0);
  const weekDone = days.reduce((n, d) => n + d.items.filter((t) => DONE_STATUSES.has(t.status)).length, 0);
  const weekMinutes = days.reduce(
    (n, d) => n + d.items.reduce((m, t) => m + (Number(t.assignment?.estimatedMinutes) || 0), 0),
    0
  );
  const dueThisWeek = days.reduce((n, d) => n + d.items.filter((t) => !DONE_STATUSES.has(t.status)).length, 0);

  const dueSoon = useMemo(() => {
    const all = days.flatMap((d) => d.items);
    return all
      .filter((t) => !DONE_STATUSES.has(t.status) && t.assignment?.dueDate)
      .sort((a, b) => daysUntil(a.assignment.dueDate) - daysUntil(b.assignment.dueDate))
      .slice(0, 4);
  }, [days]);

  if (isLoading) return <Loader message="Loading your week…" />;
  if (error) return <ErrorState onRetry={reload} />;

  return (
    <>
      <div className="ui-pageheader">
        <div>
          <h1 className="ui-pageheader__title">Plan</h1>
          <p className="ui-pageheader__description">Your week, one step at a time.</p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <Button size="sm" variant="ghost" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
            ‹
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
            ›
          </Button>
          <span style={{ fontWeight: 700, marginLeft: 'var(--spacing-sm)' }}>
            {formatDate(weekStart)} – {formatDate(addDays(weekStart, 6))}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <div className="ui-btngroup ui-btngroup--attached">
            <Button size="sm" variant={viewMode === 'week' ? 'primary' : 'secondary'} onClick={() => setViewMode('week')}>
              Week
            </Button>
            <Button size="sm" variant={viewMode === 'day' ? 'primary' : 'secondary'} onClick={() => setViewMode('day')}>
              Day
            </Button>
          </div>
          <Button
            size="sm"
            startIcon={<span aria-hidden="true">+</span>}
            onClick={() => toast.info('Adding your own tasks is coming soon - for now this shows what your teachers assign.')}
          >
            Add assignment
          </Button>
        </div>
      </div>

      {/* auto-fit, not a fixed split (same trade-off as the Focus page's
          two-panel layout: equal columns on desktop, but on tablet/phone the
          sidebar wraps below the week grid instead of squeezing either one -
          no separate breakpoint needed). */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--spacing-lg)', alignItems: 'start' }}>
        {/* A 7-day row this narrow needs its own horizontal scroll well
            before the page does - never let it widen the page itself. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${shownDays.length}, minmax(128px, 1fr))`,
            gap: 'var(--spacing-sm)',
            overflowX: 'auto',
            paddingBottom: 'var(--spacing-xs)',
          }}
        >
          {shownDays.map((day, i) => {
            const dayIndex = days.indexOf(day);
            const isToday = day.key === todayKey;
            const done = day.items.filter((t) => DONE_STATUSES.has(t.status)).length;
            const minutes = day.items.reduce((m, t) => m + (Number(t.assignment?.estimatedMinutes) || 0), 0);

            return (
              <div
                key={day.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-lg)',
                  background: isToday ? 'var(--accent-soft, var(--color-primary-soft))' : 'var(--color-surface-alt)',
                  border: isToday ? '1px solid var(--accent-base, var(--color-primary))' : '1px solid transparent',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <p className="ui-hint" style={{ margin: 0, fontWeight: 700, letterSpacing: '0.04em' }}>
                    {WEEKDAY_LABELS[dayIndex] ?? WEEKDAY_LABELS[i]}
                  </p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>
                    {formatDateKey(day.key, { day: 'numeric', month: undefined, year: undefined, weekday: undefined })}
                  </p>
                </div>

                {day.items.map((task) => {
                  const assignment = task.assignment ?? {};
                  const isDone = DONE_STATUSES.has(task.status);
                  return (
                    <Card key={task.recipientId ?? task.id} flat padded={false}>
                      <div style={{ padding: 'var(--spacing-sm)' }}>
                        <SubjectIcon subject={assignment.subject} size="sm" />
                        <p className="ui-hint" style={{ margin: 'var(--spacing-2xs) 0 0' }}>{assignment.subject}</p>
                        <p style={{ margin: 'var(--spacing-xs) 0 0', fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                          {assignment.title}
                        </p>
                        {isDone ? (
                          <p className="ui-hint" style={{ marginTop: 'var(--spacing-xs)' }}>
                            ✓ {formatDuration(assignment.estimatedMinutes)}
                          </p>
                        ) : (
                          <>
                            {assignment.estimatedMinutes ? (
                              <p className="ui-hint" style={{ margin: 'var(--spacing-xs) 0' }}>
                                🕐 {formatDuration(assignment.estimatedMinutes)}
                              </p>
                            ) : null}
                            <Button as={Link} to={`/student/assignments/${assignment.id}`} size="sm" fullWidth>
                              Start
                            </Button>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: 'var(--spacing-xs)',
                    textAlign: 'center',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {day.items.length > 0 && (
                    <>
                      {done} / {day.items.length} done
                      {minutes > 0 && <> · {formatDuration(minutes)} planned</>}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <Card title="This week" className="ui-field">
            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0 0 var(--spacing-xs)' }}>
              {weekDone} of {weekTotal} steps done
            </p>
            <ProgressBar value={weekDone} max={weekTotal || 1} className="ui-field" />
            <p className="ui-hint">
              📅 {dueThisWeek} assignment{dueThisWeek === 1 ? '' : 's'} due
              {weekMinutes > 0 && <> · 🕐 {formatDuration(weekMinutes)} planned</>}
            </p>
          </Card>

          <Card
            title="Due soon"
            actions={
              <Link to="/student/assignments" style={{ fontSize: 'var(--font-size-sm)' }}>
                View all
              </Link>
            }
          >
            {dueSoon.length === 0 ? (
              <p className="ui-hint">Nothing due soon.</p>
            ) : (
              dueSoon.map((task) => <DueSoonRow key={task.recipientId ?? task.id} task={task} />)
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
