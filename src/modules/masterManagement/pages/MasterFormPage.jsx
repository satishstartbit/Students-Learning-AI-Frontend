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
import IconField from '../components/IconField';

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

  // The icon upload picker's own state (mode/file/removed) lives outside
  // useForm, same as ThemeFormPage's colour `config` - it isn't a plain
  // scalar field, it travels as multipart when there's a file to send.
  const [iconState, setIconState] = useState({ mode: 'text', file: null, removed: false });

  // Extra fields live directly on the form's own values (keyed by field.key)
  // so they share the same validation/error machinery as the base fields.
  const extraSchema = Object.fromEntries(
    fields
      .filter((f) => f.required)
      .map((f) => [f.key, [required(`${f.label ?? f.key} is required`)]])
  );

  const form = useForm({
    initialValues: { name: '', code: '', description: '', icon: '', displayOrder: 0, isActive: true },
    validationSchema: { name: [required('Enter a name')], ...extraSchema },
    async onSubmit(values) {
      const extra = Object.fromEntries(fields.map((f) => [f.key, values[f.key]]));
      const payload = {
        name: values.name,
        code: values.code || null,
        description: values.description || null,
        displayOrder: Number(values.displayOrder) || 0,
        extra,
      };
      if (!isEdit) payload.isActive = values.isActive;

      // icon/iconFile/removeIcon are mutually exclusive - only send whichever
      // one the icon picker actually changed, so an untouched uploaded icon
      // is never wiped out just by opening the "Upload image" tab.
      if (iconState.file) payload.iconFile = iconState.file;
      else if (iconState.removed) payload.removeIcon = true;
      else if (iconState.mode === 'text') payload.icon = values.icon || '';

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
      ...(existing.extra ?? {}),
    });
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
          <IconField
            key={existing?.id ?? 'new'}
            textValue={form.values.icon}
            onTextChange={(value) => form.setFieldValue('icon', value)}
            iconUrl={existing?.iconUrl ?? null}
            onStateChange={setIconState}
          />
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
                values={form.values}
                errors={Object.fromEntries(
                  fields.map((f) => [f.key, form.touched[f.key] ? form.errors[f.key] : null])
                )}
                onChange={(key, value) => form.setFieldValue(key, value)}
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
