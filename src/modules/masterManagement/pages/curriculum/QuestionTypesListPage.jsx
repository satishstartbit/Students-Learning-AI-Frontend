import CurriculumMasterList from '../../components/CurriculumMasterList';
import { questionTypeService } from '../../services/curriculum.service';
import { formatGradeRange } from '../../../../utils/gradeRange';

const columns = [
  {
    key: 'name',
    header: 'Question type',
    sortable: true,
    render: (row) => (
      <div>
        <strong>{row.name}</strong>
        {row.description && <div className="ui-hint">{row.description}</div>}
      </div>
    ),
  },
  { key: 'code', header: 'Code', render: (row) => <code>{row.code}</code> },
  { key: 'grades', header: 'Grades', render: (row) => formatGradeRange(row.minGrade, row.maxGrade) },
  { key: 'display_order', header: 'Order', sortable: true, render: (row) => row.displayOrder },
];

export default function QuestionTypesListPage() {
  return (
    <CurriculumMasterList
      title="Question Types"
      description="The question formats teachers can add to a task - Quiz, Description, Matching and Passage. These 4 rows only relabel or retire a type; deactivating one hides it from new questions without breaking tasks that already use it."
      noun="question type"
      basePath="/admin/masters/question-types"
      service={questionTypeService}
      columns={columns}
      allowDelete={false}
    />
  );
}
