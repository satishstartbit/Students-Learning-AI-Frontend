import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader, Card, Input, Select, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import { formatGradeRange, fromGradeValue, gradeOrderRule, toGradeValue } from '../../../../utils/gradeRange';
import GradeRangeFields from '../../components/GradeRangeFields';
import { curriculumSubjectService, topicService } from '../../services/curriculum.service';
import '../../components/masterPages.css';

const listAllSubjects = () => curriculumSubjectService.list({ limit: 100, sortBy: 'name', sortOrder: 'asc' });

export default function TopicFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading, error: loadError, run: fetchItem } = useApi(topicService.get);
  const subjects = useApi(listAllSubjects, { immediate: true });

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: { subjectId: searchParams.get('subjectId') ?? '', name: '', minGrade: '', maxGrade: '', displayOrder: 0, isActive: true },
    validationSchema: {
      subjectId: [required('Choose a subject')],
      name: [required('Enter a topic name')],
      minGrade: [],
      maxGrade: [gradeOrderRule],
    },
    async onSubmit(values) {
      const payload = {
        subjectId: values.subjectId,
        name: values.name.trim(),
        minGrade: toGradeValue(values.minGrade),
        maxGrade: toGradeValue(values.maxGrade),
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) payload.isActive = values.isActive;
      await (isEdit ? topicService.update(id, payload) : topicService.create(payload));
      toast.success(isEdit ? 'Topic updated' : 'Topic created');
      navigate(`/admin/masters/topics?subjectId=${values.subjectId}`);
    },
  });

  const { reset } = form;
  useEffect(() => {
    if (!existing) return;
    reset({
      subjectId: existing.subjectId ?? '',
      name: existing.name ?? '',
      minGrade: fromGradeValue(existing.minGrade),
      maxGrade: fromGradeValue(existing.maxGrade),
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
  }, [existing, reset]);

  const subjectOptions = useMemo(
    () => (subjects.data ?? []).map((s) => ({ value: s.id, label: s.isActive ? s.name : `${s.name} (inactive)` })),
    [subjects.data]
  );
  const chosenSubject = (subjects.data ?? []).find((s) => s.id === form.values.subjectId);
  const listPath = form.values.subjectId ? `/admin/masters/topics?subjectId=${form.values.subjectId}` : '/admin/masters/topics';

  if (isEdit && isLoading && !existing) return <Loader message="Loading topic…" />;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit topic' : 'Add topic'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Topics', to: listPath },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />
      <Card className="ms-form">
        {loadError && <Alert variant="error" className="ui-field">{loadError.message}</Alert>}
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}
        <form onSubmit={form.handleSubmit} noValidate>
          <Select
            label="Subject"
            required
            options={subjectOptions}
            loading={subjects.isLoading}
            placeholder="Choose a subject"
            hint={chosenSubject ? `This subject is for ${formatGradeRange(chosenSubject.minGrade, chosenSubject.maxGrade)}.` : undefined}
            {...form.getFieldProps('subjectId')}
          />
          <Input label="Topic name" required {...form.getFieldProps('name')} />
          <GradeRangeFields fromProps={form.getFieldProps('minGrade')} toProps={form.getFieldProps('maxGrade')} />
          <Input label="Display order" type="number" min="0" {...form.getFieldProps('displayOrder')} />
          {!isEdit && <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />}
          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create topic'}</Button>
            <Button as={Link} to={listPath} variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </>
  );
}
