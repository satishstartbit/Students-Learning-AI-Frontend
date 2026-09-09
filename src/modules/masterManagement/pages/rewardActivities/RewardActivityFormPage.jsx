import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Textarea, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required, pattern } from '../../../../utils/validation';
import rewardService from '../../services/reward.service';

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

export default function RewardActivityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(rewardService.getActivity);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: { name: '', activityType: '', description: '', icon: '', points: '', displayOrder: 0, isActive: true },
    validationSchema: {
      name: [required('Enter an activity name')],
      activityType: isEdit ? [] : [required('Enter a key'), pattern(KEY_PATTERN, 'Lowercase letters, digits and underscores only')],
      points: [required('Enter a point value')],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name,
        description: values.description || null,
        icon: values.icon || null,
        points: Number(values.points) || 0,
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) {
        payload.activityType = values.activityType;
        payload.isActive = values.isActive;
      }

      const { data } = isEdit
        ? await rewardService.updateActivity(id, payload)
        : await rewardService.createActivity(payload);

      toast.success(isEdit ? 'Reward activity updated' : 'Reward activity created');
      navigate('/admin/masters/reward-activities');
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    form.reset({
      name: existing.name ?? '',
      activityType: existing.activityType ?? '',
      description: existing.description ?? '',
      icon: existing.icon ?? '',
      points: existing.points ?? '',
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading activity…" />;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit reward activity' : 'Add reward activity'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Reward Activities', to: '/admin/masters/reward-activities' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card>
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}

        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Activity name" required {...form.getFieldProps('name')} />
          {!isEdit && (
            <Input
              label="Key"
              required
              hint="Stable identifier the application awards points against, e.g. daily_checkin_completed"
              {...form.getFieldProps('activityType')}
            />
          )}
          <Textarea label="Description" {...form.getFieldProps('description')} />
          <Input label="Icon" hint="An emoji or icon key" {...form.getFieldProps('icon')} />
          <Input label="Points" type="number" required {...form.getFieldProps('points')} />
          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />

          {!isEdit && (
            <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create activity'}</Button>
            <Button as={Link} to="/admin/masters/reward-activities" variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </>
  );
}
