import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, DatePicker, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import academicService from '../../services/academic.service';

export default function AcademicYearFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(academicService.getAcademicYear);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: { name: '', startDate: '', endDate: '', isCurrent: false, isActive: true, displayOrder: 0 },
    validationSchema: {
      name: [required('Enter a name, e.g. "2026-2027"')],
      startDate: [required('Choose a start date')],
      endDate: [required('Choose an end date')],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name,
        startDate: values.startDate,
        endDate: values.endDate,
        isCurrent: values.isCurrent,
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) payload.isActive = values.isActive;

      const { data } = isEdit
        ? await academicService.updateAcademicYear(id, payload)
        : await academicService.createAcademicYear(payload);

      toast.success(isEdit ? 'Academic year updated' : 'Academic year created');
      navigate('/admin/masters/academic-years');
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    form.reset({
      name: existing.name ?? '',
      startDate: existing.startDate ?? '',
      endDate: existing.endDate ?? '',
      isCurrent: existing.isCurrent ?? false,
      isActive: existing.isActive ?? true,
      displayOrder: existing.displayOrder ?? 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading academic year…" />;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit academic year' : 'Add academic year'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Academic Years', to: '/admin/masters/academic-years' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card>
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}

        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Name" required hint='e.g. "2026-2027"' {...form.getFieldProps('name')} />
          <DatePicker label="Start date" required {...form.getFieldProps('startDate')} />
          <DatePicker label="End date" required {...form.getFieldProps('endDate')} />
          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />

          <Checkbox
            name="isCurrent"
            label="Current academic year"
            description="Setting this clears the current flag on every other academic year."
            checked={form.values.isCurrent}
            onChange={form.handleChange}
          />

          {!isEdit && (
            <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create academic year'}</Button>
            <Button as={Link} to="/admin/masters/academic-years" variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </>
  );
}
