import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Card,
  DataTable,
  PageHeader,
  ProgressBar,
  SectionHeader,
  Select,
  StatCard,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatRelative } from '../../../utils/date';
import * as aiAssistantService from '../services/aiAssistant.service';

/**
 * What the teacher's own students have been practising with the AI assistant.
 *
 * Deliberately aggregates only - topics, counts and completion rates. The
 * conversation itself is never exposed here; the backend does not return it.
 */
export default function TeacherLearningActivityPage() {
  const [subject, setSubject] = useState('');

  const { data, error, isLoading, run } = useApi(aiAssistantService.getTeacherLearningActivity);
  const { data: subjectData, run: runSubjects } = useApi(aiAssistantService.listSubjects);

  const load = useCallback(() => run({ subject }), [run, subject]);

  useEffect(() => {
    load().catch(() => {
      /* surfaced through `error` */
    });
  }, [load]);

  useEffect(() => {
    runSubjects().catch(() => {
      /* the filter just stays empty if lookups fail */
    });
  }, [runSubjects]);

  const students = data?.students ?? [];
  const topics = data?.topics ?? [];

  const subjectOptions = (subjectData ?? []).map((s) => ({ value: s.name, label: s.name }));

  const totalSessions = students.reduce((sum, s) => sum + (s.sessionsCount ?? 0), 0);
  const totalQuestions = students.reduce((sum, s) => sum + (s.practiceQuestionCount ?? 0), 0);
  const totalCorrect = students.reduce((sum, s) => sum + (s.practiceCorrectCount ?? 0), 0);

  const columns = [
    {
      key: 'studentName',
      header: 'Student',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.studentName ?? '—'}</span>,
    },
    { key: 'sessionsCount', header: 'Sessions' },
    {
      key: 'topics',
      header: 'Topics practised',
      render: (row) =>
        row.topics?.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
            {row.topics.slice(0, 4).map((t) => (
              <Badge key={t.topic} variant="primary">
                {t.topic}
                {t.count > 1 ? ` ×${t.count}` : ''}
              </Badge>
            ))}
            {row.topics.length > 4 && <Badge>+{row.topics.length - 4} more</Badge>}
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'practice',
      header: 'Practice',
      render: (row) =>
        row.practiceQuestionCount > 0
          ? `${row.practiceCorrectCount} / ${row.practiceQuestionCount}`
          : '—',
    },
    {
      key: 'completionRate',
      header: 'Success rate',
      render: (row) =>
        row.completionRate === null || row.completionRate === undefined ? (
          '—'
        ) : (
          <div style={{ minWidth: 120 }}>
            <ProgressBar value={row.completionRate} max={100} />
            <span className="ui-hint">{row.completionRate}%</span>
          </div>
        ),
    },
    {
      key: 'lastActivityAt',
      header: 'Last active',
      render: (row) => (row.lastActivityAt ? formatRelative(row.lastActivityAt) : '—'),
    },
  ];

  return (
    <div className="td-page">
      <PageHeader
        title="Student Learning Activity"
        description="How your students are using the AI learning assistant. Conversations stay private - this shows activity only."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <StatCard label="Students active" value={students.length} loading={isLoading} />
        <StatCard label="Learning sessions" value={totalSessions} loading={isLoading} />
        <StatCard
          label="Practice questions"
          value={totalQuestions}
          hint={totalQuestions > 0 ? `${totalCorrect} answered correctly` : undefined}
          loading={isLoading}
        />
      </div>

      {topics.length > 0 && (
        <Card className="ui-field" title="Most requested topics">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
            {topics.map((t) => (
              <Badge key={t.topic} variant="secondary">
                {t.topic} ×{t.count}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <Card flat className="ui-field">
        <Select
          label="Subject"
          options={subjectOptions}
          placeholder="All subjects"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </Card>

      <SectionHeader title="Per student" />

      <DataTable
        columns={columns}
        data={students}
        rowKey="studentId"
        isLoading={isLoading}
        error={error}
        onRetry={load}
        emptyTitle={subject ? 'No activity for that subject' : 'No learning activity yet'}
        emptyDescription={
          subject
            ? 'Try clearing the subject filter.'
            : 'Once your students start using the AI learning assistant, their activity will appear here.'
        }
      />
    </div>
  );
}
