import { useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PageHeader,
  StatCard,
  Card,
  SectionHeader,
  Button,
  StatusBadge,
  Loader,
  ErrorState,
  EmptyState,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import dashboardService from '../services/dashboard.service';
import { formatDate, formatRelative, isOverdue } from '../../../utils/date';
import { formatName } from '../../../utils/format';
import { ASSIGNMENT_CRUD_STATUS } from '../../../utils/constants';

const LIST_ITEM_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-sm)',
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

/** "Overdue" is derived for display only - never a stored backend status. */
function displayStatus(status, dueDate) {
  if (status === ASSIGNMENT_CRUD_STATUS.PUBLISHED && dueDate && isOverdue(dueDate)) {
    return { status: 'overdue', label: 'Overdue' };
  }
  return { status, label: undefined };
}

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { data, error, isLoading, run } = useApi(dashboardService.getTeacherDashboard);

  const load = useCallback(() => run(), [run]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  if (isLoading && !data) return <Loader message="Loading your dashboard…" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  const stats = data?.stats ?? {};
  const recentAssignments = data?.recentAssignments ?? [];
  const upcomingAssignments = data?.upcomingAssignments ?? [];
  const recentActivity = data?.recentActivity ?? [];
  const recentNotifications = data?.recentNotifications ?? [];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? 'Teacher'}`}
        description="Here's what's happening with your classes."
        actions={
          <Button as={Link} to="/teacher/assignments/new">
            Create assignment
          </Button>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <StatCard label="Students" value={stats.totalStudents ?? 0} icon="🎒" />
        <StatCard label="Subjects" value={stats.totalSubjects ?? 0} icon="📚" />
        <StatCard label="Active assignments" value={stats.activeAssignments ?? 0} icon="📄" />
        <StatCard label="Pending submissions" value={stats.pendingSubmissions ?? 0} icon="⏳" />
        <StatCard label="Completed" value={stats.completedAssignments ?? 0} icon="✅" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Upcoming assignments" className="ui-field">
          {upcomingAssignments.length === 0 ? (
            <EmptyState icon="🗓" title="Nothing due soon" description="Assignments due soon will show up here." />
          ) : (
            <ul style={LIST_ITEM_STYLE}>
              {upcomingAssignments.map((a) => {
                const { status, label } = displayStatus(a.status, a.dueDate);
                return (
                  <li
                    key={a.id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-sm)' }}
                  >
                    <div>
                      <Link to={`/teacher/assignments/${a.id}`} style={{ fontWeight: 600 }}>
                        {a.title}
                      </Link>
                      <div className="ui-hint">
                        {a.subject} · {a.grade} · Due {formatDate(a.dueDate)}
                      </div>
                    </div>
                    <StatusBadge status={status} label={label} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Recent activity" className="ui-field">
          {recentActivity.length === 0 ? (
            <EmptyState icon="📭" title="No recent activity" description="Student submissions will show up here." />
          ) : (
            <ul style={LIST_ITEM_STYLE}>
              {recentActivity.map((a) => (
                <li
                  key={a.submissionId}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-sm)' }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{a.student ? formatName(a.student) : 'A student'}</span>{' '}
                    {a.status === 'submitted' ? 'submitted' : 'updated'}{' '}
                    {a.assignment ? (
                      <Link to={`/teacher/assignments/${a.assignment.id}`}>{a.assignment.title}</Link>
                    ) : (
                      'an assignment'
                    )}
                    <div className="ui-hint">{formatRelative(a.updatedAt)}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <SectionHeader
        title="Recent assignments"
        className="ui-field"
        actions={
          <Button as={Link} to="/teacher/assignments" variant="secondary" size="sm">
            View all
          </Button>
        }
      />
      <Card className="ui-field">
        {recentAssignments.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No assignments yet"
            description="Create your first assignment to get started."
            action={
              <Button as={Link} to="/teacher/assignments/new">
                Create assignment
              </Button>
            }
          />
        ) : (
          <ul style={LIST_ITEM_STYLE}>
            {recentAssignments.map((a) => {
              const { status, label } = displayStatus(a.status, a.dueDate);
              return (
                <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link to={`/teacher/assignments/${a.id}`}>{a.title}</Link>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                    <span className="ui-hint">
                      {a.subject} · {a.grade}
                    </span>
                    <StatusBadge status={status} label={label} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <SectionHeader title="Recent notifications" className="ui-field" />
      <Card className="ui-field">
        {recentNotifications.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications yet" />
        ) : (
          <ul style={LIST_ITEM_STYLE}>
            {recentNotifications.map((n) => (
              <li key={n.id}>
                <div style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                <div className="ui-hint">
                  {n.message} · {formatRelative(n.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
