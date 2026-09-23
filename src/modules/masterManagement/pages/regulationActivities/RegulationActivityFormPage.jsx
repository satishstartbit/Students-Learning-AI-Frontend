import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Textarea, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import regulationService from '../../services/regulation.service';
import '../../components/masterPages.css';

const ACTIVITY_TYPE_HINT = 'e.g. Breathing, Grounding, Movement, Calming Sounds, Music, Mindfulness';

export default function RegulationActivityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(regulationService.getActivity);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: {
      name: '', toolType: '', description: '', instructions: '', mediaUrl: '',
      durationMinutes: '', icon: '', category: '', displayOrder: 0, isActive: true,
    },
    validationSchema: {
      name: [required('Enter an activity name')],
      toolType: [required('Enter an activity type')],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name,
        toolType: values.toolType,
        description: values.description || null,
        instructions: values.instructions || null,
        mediaUrl: values.mediaUrl || null,
        durationMinutes: values.durationMinutes === '' ? undefined : Number(values.durationMinutes),
        icon: values.icon || null,
        category: values.category || null,
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) payload.isActive = values.isActive;

      const { data } = isEdit
        ? await regulationService.updateActivity(id, payload)
        : await regulationService.createActivity(payload);

      toast.success(isEdit ? 'Regulation activity updated' : 'Regulation activity created');
      navigate('/admin/masters/regulation-activities');
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    form.reset({
      name: existing.name ?? '',
      toolType: existing.toolType ?? '',
      description: existing.description ?? '',
      instructions: existing.instructions ?? '',
      mediaUrl: existing.mediaUrl ?? '',
      durationMinutes: existing.durationMinutes ?? '',
      icon: existing.icon ?? '',
      category: existing.category ?? '',
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading activity…" />;

  return (
    <div className="td-page">
      <PageHeader
        title={isEdit ? 'Edit regulation activity' : 'Add regulation activity'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Regulation Activities', to: '/admin/masters/regulation-activities' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card className="ms-form">
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}

        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Activity name" required {...form.getFieldProps('name')} />
          <Input label="Activity type" required hint={ACTIVITY_TYPE_HINT} {...form.getFieldProps('toolType')} />
          <Textarea label="Description" {...form.getFieldProps('description')} />
          <Textarea label="Instructions" {...form.getFieldProps('instructions')} />
          <Input label="Audio / media URL" {...form.getFieldProps('mediaUrl')} />
          <Input label="Recommended duration (minutes)" type="number" {...form.getFieldProps('durationMinutes')} />
          <Input label="Icon" hint="An emoji or icon key" {...form.getFieldProps('icon')} />
          <Input label="Category" {...form.getFieldProps('category')} />
          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />

          {!isEdit && (
            <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create activity'}</Button>
            <Button as={Link} to="/admin/masters/regulation-activities" variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </div>
  );
}
