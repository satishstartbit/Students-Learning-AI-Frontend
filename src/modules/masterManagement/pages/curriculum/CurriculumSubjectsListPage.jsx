import { useNavigate } from 'react-router-dom';
import { LuList } from 'react-icons/lu';
import { Alert, IconButton } from '../../../../components/common';
import { Tooltip } from '../../../../components/ui/tooltip';
import CurriculumMasterList from '../../components/CurriculumMasterList';
import { curriculumSubjectService } from '../../services/curriculum.service';
import { formatGradeRange } from '../../../../utils/gradeRange';

const columns = [
  { key: 'name', header: 'Subject', sortable: true, render: (row) => <strong>{row.name}</strong> },
  { key: 'grades', header: 'Grades', render: (row) => formatGradeRange(row.minGrade, row.maxGrade) },
  { key: 'topics', header: 'Topics', render: (row) => row.topicCount ?? 0 },
  { key: 'display_order', header: 'Order', sortable: true, render: (row) => row.displayOrder },
];

export default function CurriculumSubjectsListPage() {
  const navigate = useNavigate();
  return (
    <CurriculumMasterList
      title="Curriculum Subjects"
      description="Subjects teachers choose when creating a task. Each subject has its own list of topics."
      noun="subject"
      basePath="/admin/masters/curriculum-subjects"
      service={curriculumSubjectService}
      columns={columns}
      headerNote={
        <Alert variant="info" className="ui-field">
          Teachers' student lists are matched by subject name, so keep these names the same as the subjects on
          teacher–student relationships (e.g. rename both together).
        </Alert>
      }
      rowActions={(row) => (
        <Tooltip label="View topics" side="top">
          <IconButton
            icon={<LuList aria-hidden="true" />}
            label="View topics"
            variant="primary"
            size="sm"
            onClick={() => navigate(`/admin/masters/topics?subjectId=${row.id}`)}
          />
        </Tooltip>
      )}
    />
  );
}
