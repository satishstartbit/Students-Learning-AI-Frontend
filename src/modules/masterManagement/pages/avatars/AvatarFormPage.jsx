import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import appearanceService from '../../services/appearance.service';

export default function AvatarFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(appearanceService.avatars.getOne);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: { name: '', imageUrl: '', category: '', displayOrder: 0, isActive: true },
    validationSchema: {
      name: [required('Enter an avatar name')],
      imageUrl: [required('Enter an image URL')],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name,
        imageUrl: values.imageUrl,
        category: values.category || null,
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) payload.isActive = values.isActive;

      const { data } = isEdit
        ? await appearanceService.avatars.update(id, payload)
        : await appearanceService.avatars.create(payload);

      toast.success(isEdit ? 'Avatar updated' : 'Avatar created');
      navigate('/admin/masters/avatars');
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    form.reset({
      name: existing.name ?? '',
      imageUrl: existing.imageUrl ?? '',
      category: existing.category ?? '',
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading avatar…" />;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit avatar' : 'Add avatar'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Avatars', to: '/admin/masters/avatars' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card>
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}

        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Avatar name" required {...form.getFieldProps('name')} />
          <Input label="Image URL" required {...form.getFieldProps('imageUrl')} />
          <Input label="Category" {...form.getFieldProps('category')} />
          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />

          {!isEdit && (
            <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create avatar'}</Button>
            <Button as={Link} to="/admin/masters/avatars" variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </>
  );
}
