import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  Loader,
  PageHeader,
  ProgressBar,
  SectionHeader,
  Select,
  StatCard,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatDateTime, formatDuration } from '../../../utils/date';
import { formatName } from '../../../utils/format';
import { listChildren } from '../../parent/services/parent.service';
import * as aiAssistantService from '../services/aiAssistant.service';

/**
 * A high-level learning summary for one of the parent's own children.
 *
 * Self-contained rather than nested under the children list, since that page
 * is a list + modal with no per-child route to hang this off. Activity and
 * progress only - the child's conversations with the assistant are private
 * and are never returned by the API.
 */
export default function ParentLearningSummaryPage() {
  const [childId, setChildId] = useState('');

  const { data: children, error: childrenError, isLoading: childrenLoading, run: runChildren } =
    useApi(listChildren);
  const { data: summary, error, isLoading, run } = useApi(aiAssistantService.getParentLearningSummary);

  useEffect(() => {
    runChildren({ limit: 100 }).catch(() => {
      /* surfaced through `childrenError` */
    });
  }, [runChildren]);

  // Defaults to the first child so the page is useful without a click, but
  // derived rather than stored so nothing has to sync it from an effect.
  const selectedChildId = childId || children?.[0]?.id || '';

  const load = useCallback(() => {
    if (!selectedChildId) return Promise.resolve();
    return run(selectedChildId);
  }, [run, selectedChildId]);

  useEffect(() => {
    load().catch(() => {
      /* surfaced through `error` */
    });
  }, [load]);

  const childOptions = (children ?? []).map((c) => ({ value: c.id, label: formatName(c) }));

  const progress = summary?.overallProgress;
  const sessions = summary?.recentSessions ?? [];
  const assignmentProgress = summary?.assignmentProgress ?? {};
  const assignmentEntries = Object.entries(assignmentProgress);

  const sessionColumns = [
    { key: 'subject', header: 'Subject', render: (row) => row.subject ?? '—' },
    { key: 'topic', header: 'Topic', render: (row) => row.topic ?? '—' },
    { key: 'date', header: 'Date', render: (row) => formatDateTime(row.date) },
    {
      key: 'durationMinutes',
      header: 'Duration',
      render: (row) => (row.durationMinutes ? formatDuration(row.durationMinutes) : '—'),
    },
    {
      key: 'practice',
      header: 'Practice',
      render: (row) =>
        row.practiceQuestionCount > 0
          ? `${row.practiceCorrectCount} / ${row.practiceQuestionCount} correct`
          : '—',
    },
  ];

  if (childrenLoading) return <Loader message="Loading your children…" />;

  if (!childrenLoading && !childrenError && !children?.length) {
    return (
      <>
        <PageHeader title="Learning Summary" />
        <EmptyState
          title="No children on your account yet"
          description="Once you add a child, their learning progress will show up here."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Learning Summary"
        description="How your child is getting on with their learning assistant and assignments."
      />

      <Card flat className="ui-field">
        <Select
          label="Child"
          options={childOptions}
          value={selectedChildId}
          onChange={(e) => setChildId(e.target.value)}
        />
      </Card>

      {isLoading && <Loader message="Loading learning summary…" />}

      {!isLoading && error && (
        <EmptyState
          title="We couldn't load this summary"
          description={error.message ?? 'Please try again in a moment.'}
        />
      )}

      {!isLoading && !error && summary && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            <StatCard label="Learning sessions" value={progress?.sessionsCount ?? 0} />
            <StatCard
              label="Practice questions"
              value={progress?.practiceQuestionCount ?? 0}
              hint={
                progress?.practiceQuestionCount
                  ? `${progress.practiceCorrectCount} answered correctly`
                  : undefined
              }
            />
            <StatCard
              label="Success rate"
              value={progress?.completionRate === null || progress?.completionRate === undefined
                ? '—'
                : `${progress.completionRate}%`}
            />
          </div>

          {progress?.completionRate !== null && progress?.completionRate !== undefined && (
            <Card className="ui-field" title="Overall practice progress">
              <ProgressBar value={progress.completionRate} max={100} />
            </Card>
          )}

          <Card className="ui-field" title="Subjects practised">
            {summary.subjectsPracticed?.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                {summary.subjectsPracticed.map((s) => (
                  <Badge key={s} variant="primary">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="ui-hint">No subjects practised yet.</p>
            )}
          </Card>

          <Card className="ui-field" title="Topics studied">
            {summary.topicsStudied?.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                {summary.topicsStudied.map((t) => (
                  <Badge key={t.topic} variant="secondary">
                    {t.topic} ×{t.count}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="ui-hint">No topics studied yet.</p>
            )}
          </Card>

          {assignmentEntries.length > 0 && (
            <Card className="ui-field" title="Assignment progress">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                {assignmentEntries.map(([status, count]) => (
                  <Badge key={status} variant="primary">
                    {status.replace(/_/g, ' ')}: {count}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          <SectionHeader title="Recent learning activity" />

          <DataTable
            columns={sessionColumns}
            data={sessions}
            emptyTitle="No learning sessions yet"
            emptyDescription="When your child uses the AI learning assistant, their sessions will be listed here."
          />
        </>
      )}
    </>
  );
}
