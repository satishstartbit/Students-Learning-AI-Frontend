import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Textarea, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { pattern, required } from '../../../../utils/validation';
import { fromGradeValue, gradeOrderRule, toGradeValue } from '../../../../utils/gradeRange';
import GradeRangeFields from '../../components/GradeRangeFields';
import { taskTypeService } from '../../services/curriculum.service';
import '../../components/masterPages.css';

const LIST_PATH = '/admin/masters/task-types';
const EMPTY = { name: '', description: '', minGrade: '', maxGrade: '', subtaskStyle: '', displayOrder: 0, isActive: true };

export default function TaskTypeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { data: existing, isLoading, error: loadError, run: fetchItem } = useApi(taskTypeService.get);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: EMPTY,
    validationSchema: {
      name: [required('Enter a name')],
      subtaskStyle: [
        required('Enter a subtask style'),
        pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words joined by hyphens, e.g. linear-steps'),
      ],
      minGrade: [],
      maxGrade: [gradeOrderRule],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim() || null,
        minGrade: toGradeValue(values.minGrade),
        maxGrade: toGradeValue(values.maxGrade),
        subtaskStyle: values.subtaskStyle.trim(),
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) payload.isActive = values.isActive;
      await (isEdit ? taskTypeService.update(id, payload) : taskTypeService.create(payload));
      toast.success(isEdit ? 'Task type updated' : 'Task type created');
      navigate(LIST_PATH);
    },
  });

  const { reset } = form;
  useEffect(() => {
    if (!existing) return;
    reset({
      name: existing.name ?? '',
      description: existing.description ?? '',
      minGrade: fromGradeValue(existing.minGrade),
      maxGrade: fromGradeValue(existing.maxGrade),
      subtaskStyle: existing.subtaskStyle ?? '',
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
  }, [existing, reset]);

  if (isEdit && isLoading && !existing) return <Loader message="Loading task type…" />;

  return (
    <div className="td-page">
      <PageHeader
        title={isEdit ? 'Edit task type' : 'Add task type'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Task Types', to: LIST_PATH },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />
      <Card className="ms-form">
        {loadError && <Alert variant="error" className="ui-field">{loadError.message}</Alert>}
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}
        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Name" required {...form.getFieldProps('name')} />
          <Textarea
            label="Description"
            hint="Shown to teachers when they pick a task type."
            rows={3}
            {...form.getFieldProps('description')}
          />
          <GradeRangeFields fromProps={form.getFieldProps('minGrade')} toProps={form.getFieldProps('maxGrade')} />
          <Input
            label="Subtask style"
            required
            hint="Used by the AI when it breaks a task into steps - not shown to teachers. e.g. linear-steps, milestone-based, research-draft-revise"
            {...form.getFieldProps('subtaskStyle')}
          />
          <Input label="Display order" type="number" min="0" {...form.getFieldProps('displayOrder')} />
          {!isEdit && <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />}
          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create task type'}</Button>
            <Button as={Link} to={LIST_PATH} variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </div>
  );
}
