import { useCallback, useEffect } from 'react';
import { Alert, Avatar, Button, EmptyState, Loader, Modal, SectionHeader, StatusBadge, Table } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatDateTime } from '../../../utils/date';
import { formatName } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/errorHandler';
import teacherStudentService from '../services/teacherStudent.service';

const RELATIONSHIP_COLUMNS = [
  { key: 'subject', header: 'Subject', render: (r) => r.subject ?? '—' },
  { key: 'grade', header: 'Grade', render: (r) => r.grade ?? '—' },
  { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

/** Read-only "view student" panel, opened from My Students. */
export function StudentDetailModal({ isOpen, studentId, onClose }) {
  const detail = useApi(teacherStudentService.getMyStudent);
  const { run } = detail;

  const load = useCallback(() => {
    if (studentId) run(studentId).catch(() => {});
  }, [run, studentId]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const student = detail.data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student ? formatName(student) : 'Student details'}
      size="lg"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {detail.isLoading && !student && <Loader message="Loading student…" />}
      {detail.error && <Alert variant="error">{getErrorMessage(detail.error)}</Alert>}

      {student && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <Avatar src={student.profileImageUrl} name={formatName(student)} size="lg" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{formatName(student)}</div>
              <div className="ui-hint">{student.email}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <StatusBadge status={student.status} />
            </div>
          </div>

          <SectionHeader title="Student information" as="h3" className="ui-field" />
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <span className="ui-hint">Grade</span>
              <div>{student.grade || '—'}</div>
            </div>
            <div>
              <span className="ui-hint">Subjects</span>
              <div>{student.subjects || '—'}</div>
            </div>
            <div>
              <span className="ui-hint">Last active</span>
              <div>{student.lastLoginAt ? formatDateTime(student.lastLoginAt) : 'Never'}</div>
            </div>
            <div>
              <span className="ui-hint">Phone</span>
              <div>{student.phone || '—'}</div>
            </div>
          </div>

          <SectionHeader title="Your subjects & grades with this student" as="h3" className="ui-field" />
          {(student.relationships ?? []).length === 0 ? (
            <EmptyState
              icon="🔗"
              title="No subjects on record"
              description="This student isn't linked to you under any subject/grade yet."
            />
          ) : (
            <Table columns={RELATIONSHIP_COLUMNS} data={student.relationships} rowKey="id" />
          )}
        </>
      )}
    </Modal>
  );
}

export default StudentDetailModal;
