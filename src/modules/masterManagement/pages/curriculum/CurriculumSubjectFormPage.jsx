import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import { fromGradeValue, gradeOrderRule, toGradeValue } from '../../../../utils/gradeRange';
import GradeRangeFields from '../../components/GradeRangeFields';
import { curriculumSubjectService } from '../../services/curriculum.service';
import '../../components/masterPages.css';

const LIST_PATH = '/admin/masters/curriculum-subjects';

export default function CurriculumSubjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { data: existing, isLoading, error: loadError, run: fetchItem } = useApi(curriculumSubjectService.get);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: { name: '', minGrade: '', maxGrade: '', displayOrder: 0, isActive: true },
    validationSchema: { name: [required('Enter a subject name')], minGrade: [], maxGrade: [gradeOrderRule] },
    async onSubmit(values) {
      const payload = {
        name: values.name.trim(),
        minGrade: toGradeValue(values.minGrade),
        maxGrade: toGradeValue(values.maxGrade),
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) payload.isActive = values.isActive;
      await (isEdit ? curriculumSubjectService.update(id, payload) : curriculumSubjectService.create(payload));
      toast.success(isEdit ? 'Subject updated' : 'Subject created');
      navigate(LIST_PATH);
    },
  });

  const { reset } = form;
  useEffect(() => {
    if (!existing) return;
    reset({
      name: existing.name ?? '',
      minGrade: fromGradeValue(existing.minGrade),
      maxGrade: fromGradeValue(existing.maxGrade),
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
  }, [existing, reset]);

  if (isEdit && isLoading && !existing) return <Loader message="Loading subject…" />;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit subject' : 'Add subject'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Curriculum Subjects', to: LIST_PATH },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />
      <Card className="ms-form">
        {loadError && <Alert variant="error" className="ui-field">{loadError.message}</Alert>}
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}
        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Subject name" required {...form.getFieldProps('name')} />
          <GradeRangeFields fromProps={form.getFieldProps('minGrade')} toProps={form.getFieldProps('maxGrade')} />
          <Input label="Display order" type="number" min="0" {...form.getFieldProps('displayOrder')} />
          {!isEdit && <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />}
          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create subject'}</Button>
            <Button as={Link} to={LIST_PATH} variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </>
  );
}
