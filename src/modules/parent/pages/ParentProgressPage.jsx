import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatName } from '../../../utils/format';
import CheckInBadge from '../../progress/components/CheckInBadge';
import StudentProgressDetail from '../../progress/components/StudentProgressDetail';
import TaskCounts from '../../progress/components/TaskCounts';
import parentService from '../services/parent.service';

/**
 * /parent/progress - each child's check-in today and their progress on every
 * task their teachers assigned.
 *
 * Built as its own page rather than folded into Learning Summary: that page
 * covers AI Assistant activity and only a per-status count of assignments,
 * with no task list, due dates or check-ins. Read-only.
 */
export default function ParentProgressPage() {
  const summaries = useApi(parentService.getProgress, { immediate: true });
  const detail = useApi(parentService.getChildProgress);
  const { run: runDetail } = detail;
  const [childId, setChildId] = useState('');

  const children = summaries.data ?? [];
  // First child by default, derived rather than synced from an effect.
  const selectedId = childId || children[0]?.student.id || '';

  useEffect(() => {
    if (selectedId) runDetail(selectedId).catch(() => {});
  }, [selectedId, runDetail]);

  if (summaries.isLoading && !summaries.data) return <Loader message="Loading progress…" />;

  if (summaries.error && !summaries.data) {
    return (
      <>
        <PageHeader title="Progress" />
        <ErrorState title="We couldn't load progress" error={summaries.error} onRetry={() => summaries.run().catch(() => {})} />
      </>
    );
  }

  if (!children.length) {
    return (
      <>
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
      </>
    );
  }

  const selected = children.find((c) => c.student.id === selectedId);

  return (
    <div className="td-page">
      <PageHeader title="Progress" description="How your children are arriving each day, and how their tasks are going." />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        {children.map((child) => {
          const active = child.student.id === selectedId;
          return (
            <button
              key={child.student.id}
              type="button"
              aria-pressed={active}
              onClick={() => setChildId(child.student.id)}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                border: `${active ? 2 : 1}px solid ${active ? 'var(--accent-base)' : 'var(--color-border-default)'}`,
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                font: 'inherit',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{formatName(child.student)}</div>
              {child.student.grade && (
                <div className="ui-hint" style={{ marginBottom: 'var(--spacing-sm)' }}>
                  {child.student.grade}
                </div>
              )}
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <CheckInBadge today={child.today} showDetails={false} />
              </div>
              <TaskCounts counts={child.counts} />
            </button>
          );
        })}
      </div>

      <Card title={selected ? formatName(selected.student) : undefined}>
        {detail.isLoading && <Loader message="Loading…" />}
        {detail.error && !detail.isLoading && (
          <ErrorState title="We couldn't load this child's progress" error={detail.error} onRetry={() => runDetail(selectedId).catch(() => {})} />
        )}
        {!detail.isLoading && !detail.error && detail.data?.student?.id === selectedId && (
          <StudentProgressDetail progress={detail.data} showTeacher />
        )}
      </Card>
    </div>
  );
}
