import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Select } from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import CurriculumMasterList from '../../components/CurriculumMasterList';
import { curriculumSubjectService, topicService } from '../../services/curriculum.service';
import { formatGradeRange } from '../../../../utils/gradeRange';

const listAllSubjects = () => curriculumSubjectService.list({ limit: 100, sortBy: 'name', sortOrder: 'asc' });

/** Topics, one flat list per subject - pick the subject here (or arrive from a subject's "Topics" button). */
export default function TopicsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId') ?? '';
  const subjects = useApi(listAllSubjects, { immediate: true });

  const subjectOptions = useMemo(
    () => (subjects.data ?? []).map((s) => ({ value: s.id, label: s.isActive ? s.name : `${s.name} (inactive)` })),
    [subjects.data]
  );
  const subjectName = subjectOptions.find((o) => o.value === subjectId)?.label;

  const columns = [
    { key: 'name', header: 'Topic', sortable: true, render: (row) => <strong>{row.name}</strong> },
    ...(subjectId ? [] : [{ key: 'subject', header: 'Subject', render: (row) => row.subject?.name ?? '—' }]),
    { key: 'grades', header: 'Grades', render: (row) => formatGradeRange(row.minGrade, row.maxGrade) },
    { key: 'display_order', header: 'Order', sortable: true, render: (row) => row.displayOrder },
  ];

  return (
    <CurriculumMasterList
      title={subjectName ? `Topics - ${subjectName}` : 'Topics'}
      description="Topics within a subject. Teachers see a subject's active topics that fit the task's grade."
      noun="topic"
      basePath="/admin/masters/topics"
      service={topicService}
      columns={columns}
      query={subjectId ? { subjectId } : {}}
      createTo={subjectId ? `/admin/masters/topics/create?subjectId=${subjectId}` : '/admin/masters/topics/create'}
      filters={
        <Select
          label="Subject"
          placeholder="All subjects"
          options={subjectOptions}
          loading={subjects.isLoading}
          value={subjectId}
          onChange={(e) => setSearchParams(e.target.value ? { subjectId: e.target.value } : {}, { replace: true })}
        />
      }
    />
  );
}
