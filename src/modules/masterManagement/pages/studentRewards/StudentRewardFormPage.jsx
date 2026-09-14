import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Textarea, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required, pattern, min } from '../../../../utils/validation';
import rewardService from '../../services/reward.service';

export default function StudentRewardFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(rewardService.getReward);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: { name: '', description: '', pointsRequired: '', rewardType: '', imageUrl: '', displayOrder: 0, isActive: true },
    validationSchema: {
      name: [required('Enter a reward name')],
      pointsRequired: [
        required('Enter the points required'),
        pattern(/^\d+$/, 'Enter a whole number'),
        min(0, 'Points must be 0 or more'),
      ],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name,
        description: values.description || null,
        pointsRequired: Number(values.pointsRequired) || 0,
        rewardType: values.rewardType || null,
        imageUrl: values.imageUrl || null,
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) payload.isActive = values.isActive;

      const { data } = isEdit
        ? await rewardService.updateReward(id, payload)
        : await rewardService.createReward(payload);

      toast.success(isEdit ? 'Reward updated' : 'Reward created');
      navigate('/admin/masters/student-rewards');
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    form.reset({
      name: existing.name ?? '',
      description: existing.description ?? '',
      pointsRequired: existing.pointsRequired ?? '',
      rewardType: existing.rewardType ?? '',
      imageUrl: existing.imageUrl ?? '',
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading reward…" />;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit reward' : 'Add reward'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Student Rewards', to: '/admin/masters/student-rewards' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card>
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}

        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Reward name" required {...form.getFieldProps('name')} />
          <Textarea label="Description" {...form.getFieldProps('description')} />
          <Input label="Points required" type="number" required {...form.getFieldProps('pointsRequired')} />
          <Input label="Reward type" hint="e.g. Badge, Streak, Milestone" {...form.getFieldProps('rewardType')} />
          <Input label="Image / icon URL" {...form.getFieldProps('imageUrl')} />
          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />

          {!isEdit && (
            <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create reward'}</Button>
            <Button as={Link} to="/admin/masters/student-rewards" variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </>
  );
}
