import CurriculumMasterList from '../../components/CurriculumMasterList';
import { taskTypeService } from '../../services/curriculum.service';
import { formatGradeRange } from '../../../../utils/gradeRange';

const columns = [
  {
    key: 'name',
    header: 'Task type',
    sortable: true,
    render: (row) => (
      <div>
        <strong>
          {row.icon && (
            <span aria-hidden="true" style={{ marginRight: 6 }}>
              {row.icon}
            </span>
          )}
          {row.name}
        </strong>
        {row.description && <div className="ui-hint">{row.description}</div>}
      </div>
    ),
  },
  { key: 'grades', header: 'Grades', render: (row) => formatGradeRange(row.minGrade, row.maxGrade) },
  { key: 'subtaskStyle', header: 'Subtask style', render: (row) => <code>{row.subtaskStyle}</code> },
  { key: 'display_order', header: 'Order', sortable: true, render: (row) => row.displayOrder },
];

export default function TaskTypesListPage() {
  return (
    <CurriculumMasterList
      title="Task Types"
      description="The kinds of task teachers can create. Grade ranges keep types meant for older students out of younger grades' lists."
      noun="task type"
      basePath="/admin/masters/task-types"
      service={taskTypeService}
      columns={columns}
    />
  );
}
