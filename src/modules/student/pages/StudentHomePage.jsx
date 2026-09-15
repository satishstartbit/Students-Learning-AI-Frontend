import { Link } from 'react-router-dom';
import { Card, Button, ProgressBar, StatCard, StickyBoard, Loader } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { useApi } from '../../../hooks/useApi';
import { useMyTasks } from '../hooks/useMyTasks';
import { useStudentExperience } from '../hooks/useStudentExperience';
import StudentCheckInCard from '../components/StudentCheckInCard';
import rewardService from '../services/reward.service';
import focusService from '../services/focus.service';

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * "My Day" for Grade 6+ - the mature counterpart to the K-5 KidHomePage,
 * built around this same session's Text Field / Sticky Note design-system
 * work and the Ocean brand tokens (theme/variables.css).
 *
 * Sticky notes here are local-only (no backend yet - see the note on
 * StickyBoard/StickyNote in components/common) rather than faked as real
 * data from an API that doesn't exist, so "Add a note" is a no-op for now.
 */
export default function StudentHomePage() {
  const { user } = useAuth();
  const { profile } = useStudentExperience();
  const tasks = useMyTasks();
  const summary = useApi(rewardService.getSummary, { immediate: true });
  const todayMinutes = useApi(focusService.getTodayMinutes, { immediate: true });

  const toDoCount = tasks.toDo.length;
  const doneToday = tasks.done.length;
  const totalToday = toDoCount + doneToday;

  return (
    <>
      <div className="ui-pageheader">
        <div>
          <h1 className="ui-pageheader__title">
            {timeOfDayGreeting()}, {user?.firstName ?? 'there'}
          </h1>
          <p className="ui-pageheader__description">
            {toDoCount === 0 ? 'Nothing left today - nice work.' : `${toDoCount} ${toDoCount === 1 ? 'task' : 'tasks'} left today`}
            {profile?.grade ? ` · ${profile.grade}` : ''}
          </p>
        </div>
        <div className="ui-pageheader__actions">
          <Button as={Link} to="/student/focus">
            Start focus
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--spacing-lg)', alignItems: 'start' }}>
        <div>
          <Card
            title="Today's tasks"
            subtitle={totalToday ? `${totalToday} total · ${toDoCount} to go` : undefined}
            actions={
              <Button as={Link} to="/student/assignments" variant="secondary" size="sm">
                View full plan
              </Button>
            }
            className="ui-field"
          >
            {totalToday > 0 && (
              <ProgressBar
                value={doneToday}
                max={totalToday}
                label={`${doneToday}/${totalToday} complete`}
                className="ui-field"
              />
            )}

            {tasks.isLoading ? (
              <Loader message="Loading your tasks…" />
            ) : toDoCount === 0 ? (
              <p className="ui-hint">You&apos;re all caught up for today.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {tasks.toDo.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/student/assignments/${item.assignment?.id ?? item.assignmentId}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 'var(--spacing-md)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <span>{item.assignment?.title ?? 'Assignment'}</span>
                      <span className="ui-hint">{item.assignment?.subject}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <StickyBoard notes={[]} title="My Notes" />
        </div>

        <div>
          <StudentCheckInCard />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
            <StatCard
              label="Points"
              value={summary.data?.totalPoints ?? 0}
              icon="🏆"
              loading={summary.isLoading && !summary.data}
            />
            <StatCard
              label="Focus today"
              value={`${todayMinutes.data?.minutes ?? 0} min`}
              icon="⏱"
              loading={todayMinutes.isLoading && !todayMinutes.data}
            />
          </div>

          <Card title="Rewards" className="ui-field" style={{ marginTop: 'var(--spacing-lg)' }}>
            <p className="ui-hint">Trade your points in for something fun.</p>
            <Button as={Link} to="/student/rewards" variant="secondary" size="sm">
              See rewards
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
