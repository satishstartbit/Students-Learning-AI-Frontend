import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  PageHeader,
  Card,
  Input,
  Textarea,
  Checkbox,
  Button,
  Alert,
  ButtonGroup,
  SectionHeader,
  Loader,
} from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { required } from '../../../utils/validation';
import masterGenericService from '../services/masterGeneric.service';
import DynamicExtraFields from '../components/DynamicExtraFields';

/**
 * Generic master create/edit form - one screen shared by every simple lookup
 * master. Base fields (name/code/description/icon/displayOrder) are fixed;
 * the "Additional details" section is driven entirely by the owning
 * master_types.field_schema, fetched alongside the record.
 */
export default function MasterFormPage() {
  const { masterType, id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: types } = useApi(masterGenericService.listTypes, { immediate: true });
  const typeRow = (types ?? []).find((t) => t.code === masterType) ?? null;
  const fields = typeRow?.fieldSchema?.fields ?? [];

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(masterGenericService.getItem);

  useEffect(() => {
    if (isEdit) fetchItem(masterType, id).catch(() => {});
  }, [isEdit, masterType, id, fetchItem]);

  const [extraValues, setExtraValues] = useState({});

  const form = useForm({
    initialValues: { name: '', code: '', description: '', icon: '', displayOrder: 0, isActive: true },
    validationSchema: { name: [required('Enter a name')] },
    async onSubmit(values) {
      const payload = {
        name: values.name,
        code: values.code || null,
        description: values.description || null,
        icon: values.icon || null,
        displayOrder: Number(values.displayOrder) || 0,
        extra: extraValues,
      };
      if (!isEdit) payload.isActive = values.isActive;

      const { data } = isEdit
        ? await masterGenericService.updateItem(masterType, id, payload)
        : await masterGenericService.createItem(masterType, payload);

      toast.success(isEdit ? 'Record updated' : 'Record created');
      navigate(`/admin/masters/${masterType}`);
      return data;
    },
  });

  // Populate the form once the existing record has loaded.
  useEffect(() => {
    if (!existing) return;
    form.reset({
      name: existing.name ?? '',
      code: existing.code ?? '',
      description: existing.description ?? '',
      icon: existing.icon ?? '',
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
    setExtraValues(existing.extra ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading record…" />;

  return (
    <>
      <PageHeader
        title={isEdit ? `Edit ${typeRow?.label ?? 'record'}` : `Add ${typeRow?.label ?? 'record'}`}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: typeRow?.label ?? masterType, to: `/admin/masters/${masterType}` },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card>
        {form.submitError && (
          <Alert variant="error" className="ui-field">
            {form.submitError}
          </Alert>
        )}

        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Name" required {...form.getFieldProps('name')} />
          <Input label="Code" {...form.getFieldProps('code')} />
          <Textarea label="Description" {...form.getFieldProps('description')} />
          <Input label="Icon" hint="An emoji or icon key" {...form.getFieldProps('icon')} />
          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />

          {!isEdit && (
            <Checkbox
              name="isActive"
              label="Active"
              checked={form.values.isActive}
              onChange={form.handleChange}
            />
          )}

          {fields.length > 0 && (
            <>
              <SectionHeader title="Additional details" as="h3" />
              <DynamicExtraFields
                fields={fields}
                values={extraValues}
                onChange={(key, value) => setExtraValues((prev) => ({ ...prev, [key]: value }))}
              />
            </>
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>
              {isEdit ? 'Save changes' : 'Create record'}
            </Button>
            <Button as={Link} to={`/admin/masters/${masterType}`} variant="secondary">
              Cancel
            </Button>
          </ButtonGroup>
        </form>
      </Card>
    </>
  );
}
