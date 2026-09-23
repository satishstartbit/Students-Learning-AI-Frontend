import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable, PageHeader, Select, StatusBadge } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { usePagination } from '../../../hooks/usePagination';
import { formatDateTime, formatRelative } from '../../../utils/date';
import * as aiAssistantService from '../services/aiAssistant.service';

/**
 * The student's past AI learning sessions.
 *
 * An active session resumes where it left off; a finished one opens read-only
 * (LearningSessionPage disables its input when the session is not active).
 */
const STATUS_OPTIONS = [
  { value: 'active', label: 'In progress' },
  { value: 'completed', label: 'Finished' },
  { value: 'abandoned', label: 'Abandoned' },
];

export default function LearningHistoryPage() {
  const navigate = useNavigate();
  const pagination = usePagination();
  const [status, setStatus] = useState('');

  const { data, meta, error, isLoading, run } = useApi(aiAssistantService.listSessions);
  const { page, limit, applyMeta, goToPage } = pagination;

  const load = useCallback(() => run({ page, limit, status }), [run, page, limit, status]);

  useEffect(() => {
    load().catch(() => {
      /* surfaced through `error` */
    });
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const sessions = data ?? [];

  const columns = [
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.subject ?? '—'}</span>,
    },
    { key: 'topic', header: 'Topic', render: (row) => row.topic ?? '—' },
    {
      key: 'startedAt',
      header: 'Date',
      render: (row) => formatDateTime(row.startedAt ?? row.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'practice',
      header: 'Practice',
      render: (row) =>
        row.practiceQuestionCount > 0 ? (
          <Badge variant={row.practiceCorrectCount === row.practiceQuestionCount ? 'success' : 'primary'}>
            {row.practiceCorrectCount} / {row.practiceQuestionCount} correct
          </Badge>
        ) : (
          '—'
        ),
    },
    {
      key: 'lastActivityAt',
      header: 'Last activity',
      render: (row) => (row.lastActivityAt ? formatRelative(row.lastActivityAt) : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => navigate(`/student/assistant/${row.id}`)}>
          {row.status === 'active' ? 'Resume' : 'View'}
        </Button>
      ),
    },
  ];

  return (
    <div className="td-page">
      <PageHeader
        title="Learning History"
        description="Everything you have worked on with your learning assistant."
        actions={
          <Button as={Link} to="/student/assistant" variant="secondary">
            Back to Assistant
          </Button>
        }
      />

      <Card flat className="ui-field">
        <Select
          label="Show"
          options={STATUS_OPTIONS}
          placeholder="All sessions"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            goToPage(1);
          }}
        />
      </Card>

      <DataTable
        columns={columns}
        data={sessions}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={status ? 'Nothing matches that filter' : 'No learning sessions yet'}
        emptyDescription={
          status
            ? 'Try showing all sessions instead.'
            : 'Start a session with your learning assistant and it will show up here.'
        }
        emptyAction={
          !status ? (
            <Button as={Link} to="/student/assistant">
              Start learning
            </Button>
          ) : null
        }
      />
    </div>
  );
}
