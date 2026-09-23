import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import appearanceService from '../../services/appearance.service';
import '../../components/masterPages.css';

export default function StickerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(appearanceService.stickers.getOne);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: { name: '', imageUrl: '', category: '', displayOrder: 0, isActive: true },
    validationSchema: {
      name: [required('Enter a sticker name')],
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
        ? await appearanceService.stickers.update(id, payload)
        : await appearanceService.stickers.create(payload);

      toast.success(isEdit ? 'Sticker updated' : 'Sticker created');
      navigate('/admin/masters/stickers');
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

  if (isEdit && loadingItem && !existing) return <Loader message="Loading sticker…" />;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit sticker' : 'Add sticker'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Stickers', to: '/admin/masters/stickers' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card className="ms-form">
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}

        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Sticker name" required {...form.getFieldProps('name')} />
          <Input label="Image URL" required {...form.getFieldProps('imageUrl')} />
          <Input label="Category" hint="e.g. Achievement, Motivation, Fun, Study, Celebration" {...form.getFieldProps('category')} />
          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />

          {!isEdit && (
            <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create sticker'}</Button>
            <Button as={Link} to="/admin/masters/stickers" variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </>
  );
}
