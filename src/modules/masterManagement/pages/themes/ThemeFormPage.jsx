import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Textarea, Checkbox, Button, Alert, ButtonGroup, SectionHeader, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import appearanceService from '../../services/appearance.service';
import '../../components/masterPages.css';

const DEFAULT_CONFIG = { primary: '#4F46E5', secondary: '#818CF8', background: '#FFFFFF', text: '#111827' };

export default function ThemeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(appearanceService.themes.getOne);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const form = useForm({
    initialValues: { name: '', description: '', displayOrder: 0, isActive: true },
    validationSchema: { name: [required('Enter a theme name')] },
    async onSubmit(values) {
      const payload = {
        name: values.name,
        description: values.description || null,
        configJson: config,
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) payload.isActive = values.isActive;

      const { data } = isEdit
        ? await appearanceService.themes.update(id, payload)
        : await appearanceService.themes.create(payload);

      toast.success(isEdit ? 'Theme updated' : 'Theme created');
      navigate('/admin/masters/themes');
      return data;
    },
  });

  // Theme settings follow the loaded record - adjusted during render, not in an effect.
  const [configSeededFrom, setConfigSeededFrom] = useState(null);
  if (existing && existing !== configSeededFrom) {
    setConfigSeededFrom(existing);
    setConfig({ ...DEFAULT_CONFIG, ...(existing.configJson ?? {}) });
  }

  useEffect(() => {
    if (!existing) return;
    form.reset({
      name: existing.name ?? '',
      description: existing.description ?? '',
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading theme…" />;

  return (
    <div className="td-page">
      <PageHeader
        title={isEdit ? 'Edit colour theme' : 'Add colour theme'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Colour Themes', to: '/admin/masters/themes' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card className="ms-form">
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}

        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Theme name" required {...form.getFieldProps('name')} />
          <Textarea label="Description" {...form.getFieldProps('description')} />

          <SectionHeader title="Colours" as="h3" />
          <Input label="Primary colour" type="color" value={config.primary} onChange={(e) => setConfig((c) => ({ ...c, primary: e.target.value }))} />
          <Input label="Secondary colour" type="color" value={config.secondary} onChange={(e) => setConfig((c) => ({ ...c, secondary: e.target.value }))} />
          <Input label="Background colour" type="color" value={config.background} onChange={(e) => setConfig((c) => ({ ...c, background: e.target.value }))} />
          <Input label="Text colour" type="color" value={config.text} onChange={(e) => setConfig((c) => ({ ...c, text: e.target.value }))} />

          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />
          {!isEdit && (
            <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create theme'}</Button>
            <Button as={Link} to="/admin/masters/themes" variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </div>
  );
}
