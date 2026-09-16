import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Textarea, Select, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import { fromGradeValue, gradeOrderRule, toGradeValue } from '../../../../utils/gradeRange';
import GradeRangeFields from '../../components/GradeRangeFields';
import { questionTypeService } from '../../services/curriculum.service';

const LIST_PATH = '/admin/masters/question-types';
const EMPTY = { name: '', description: '', code: '', minGrade: '', maxGrade: '', displayOrder: 0, isActive: true };

// Fixed 4-value set - these are the only answer shapes the teacher builder actually knows how to render.
const CODE_OPTIONS = [
  { value: 'mcq', label: 'Quiz (Multiple Choice)' },
  { value: 'free_text', label: 'Description (Written Answer)' },
  { value: 'matching', label: 'Matching' },
  { value: 'passage_mcq', label: 'Passage' },
];

export default function QuestionTypeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { data: existing, isLoading, error: loadError, run: fetchItem } = useApi(questionTypeService.get);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: EMPTY,
    validationSchema: {
      name: [required('Enter a name')],
      code: isEdit ? [] : [required('Choose which answer type this labels')],
      minGrade: [],
      maxGrade: [gradeOrderRule],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim() || null,
        minGrade: toGradeValue(values.minGrade),
        maxGrade: toGradeValue(values.maxGrade),
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) {
        payload.code = values.code;
        payload.isActive = values.isActive;
      }
      await (isEdit ? questionTypeService.update(id, payload) : questionTypeService.create(payload));
      toast.success(isEdit ? 'Question type updated' : 'Question type created');
      navigate(LIST_PATH);
    },
  });

  const { reset } = form;
  useEffect(() => {
    if (!existing) return;
    reset({
      name: existing.name ?? '',
      description: existing.description ?? '',
      code: existing.code ?? '',
      minGrade: fromGradeValue(existing.minGrade),
      maxGrade: fromGradeValue(existing.maxGrade),
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
  }, [existing, reset]);

  if (isEdit && isLoading && !existing) return <Loader message="Loading question type…" />;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit question type' : 'Add question type'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Question Types', to: LIST_PATH },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />
      <Card>
        {loadError && <Alert variant="error" className="ui-field">{loadError.message}</Alert>}
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}
        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Name" required hint="Shown to teachers in the Question Type list." {...form.getFieldProps('name')} />
          <Textarea label="Description" rows={2} {...form.getFieldProps('description')} />
          {isEdit ? (
            <Input label="Code" value={CODE_OPTIONS.find((o) => o.value === existing?.code)?.label ?? existing?.code ?? ''} disabled hint="Which builder this labels - set once, when the type was created." />
          ) : (
            <Select
              label="Answer type this labels"
              required
              options={CODE_OPTIONS}
              placeholder="Choose one"
              hint="Which of the 4 built-in question builders this row labels. Can't be changed later."
              {...form.getFieldProps('code')}
            />
          )}
          <GradeRangeFields fromProps={form.getFieldProps('minGrade')} toProps={form.getFieldProps('maxGrade')} />
          <Input label="Display order" type="number" min="0" {...form.getFieldProps('displayOrder')} />
          {!isEdit && <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />}
          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create question type'}</Button>
            <Button as={Link} to={LIST_PATH} variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </>
  );
}
