import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import appearanceService from '../../services/appearance.service';

const DEFAULT_CONFIG = { background: '#FEF3C7', border: '#FBBF24' };

export default function StickyNoteStyleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(appearanceService.stickyNoteStyles.getOne);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const form = useForm({
    initialValues: { name: '', displayOrder: 0, isActive: true },
    validationSchema: { name: [required('Enter a style name')] },
    async onSubmit(values) {
      const payload = { name: values.name, configJson: config, displayOrder: Number(values.displayOrder) || 0 };
      if (!isEdit) payload.isActive = values.isActive;

      const { data } = isEdit
        ? await appearanceService.stickyNoteStyles.update(id, payload)
        : await appearanceService.stickyNoteStyles.create(payload);

      toast.success(isEdit ? 'Sticky note style updated' : 'Sticky note style created');
      navigate('/admin/masters/sticky-note-styles');
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    form.reset({ name: existing.name ?? '', displayOrder: existing.displayOrder ?? 0, isActive: existing.isActive ?? true });
    setConfig({ ...DEFAULT_CONFIG, ...(existing.configJson ?? {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading style…" />;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit sticky note style' : 'Add sticky note style'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Sticky Note Styles', to: '/admin/masters/sticky-note-styles' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card>
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}

        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Style name" required {...form.getFieldProps('name')} />
          <Input label="Background colour" type="color" value={config.background} onChange={(e) => setConfig((c) => ({ ...c, background: e.target.value }))} />
          <Input label="Border colour" type="color" value={config.border} onChange={(e) => setConfig((c) => ({ ...c, border: e.target.value }))} />
          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />

          {!isEdit && (
            <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create style'}</Button>
            <Button as={Link} to="/admin/masters/sticky-note-styles" variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </>
  );
}
