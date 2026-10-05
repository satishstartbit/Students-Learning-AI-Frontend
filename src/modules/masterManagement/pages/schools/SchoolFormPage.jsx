import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Checkbox, Button, Alert, ButtonGroup, SectionHeader, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required, email as emailRule, phone as phoneRule, postalCode as postalCodeRule } from '../../../../utils/validation';
import { DEFAULT_COUNTRY } from '../../../../utils/locale';
import AddressFields from '../../../auth/components/AddressFields';
import academicService from '../../services/academic.service';
import '../../components/masterPages.css';

/** "CA" / "CAN" / "Canada" (any case) - the postal-code validation rule below only applies then. */
const isCanada = (country) =>
  !country || ['CA', 'CAN', 'CANADA'].includes(String(country).trim().toUpperCase());

export default function SchoolFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(academicService.getSchool);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: {
      name: '', schoolCode: '', address: '', city: '', state: '',
      country: DEFAULT_COUNTRY === 'CA' ? 'Canada' : '', postalCode: '',
      contactPerson: '', contactEmail: '', contactPhone: '', isActive: true, displayOrder: 0,
    },
    validationSchema: {
      name: [required('Enter a school name')],
      contactEmail: [emailRule()],
      contactPhone: [phoneRule()],
      // Only enforced for a Canadian address - a future non-Canadian school
      // (Phase 3 multi-org onboarding) keeps free-text postal/zip.
      postalCode: [(value, allValues) => (isCanada(allValues.country) ? postalCodeRule()(value) : null)],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name,
        schoolCode: values.schoolCode || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        country: values.country || null,
        postalCode: values.postalCode || null,
        contactPerson: values.contactPerson || null,
        contactEmail: values.contactEmail || null,
        contactPhone: values.contactPhone || null,
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) payload.isActive = values.isActive;

      const { data } = isEdit
        ? await academicService.updateSchool(id, payload)
        : await academicService.createSchool(payload);

      toast.success(isEdit ? 'School updated' : 'School created');
      navigate('/admin/masters/schools');
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    form.reset({
      name: existing.name ?? '',
      schoolCode: existing.schoolCode ?? '',
      address: existing.address ?? '',
      city: existing.city ?? '',
      state: existing.state ?? '',
      country: existing.country ?? '',
      postalCode: existing.postalCode ?? '',
      contactPerson: existing.contactPerson ?? '',
      contactEmail: existing.contactEmail ?? '',
      contactPhone: existing.contactPhone ?? '',
      isActive: existing.isActive ?? true,
      displayOrder: existing.displayOrder ?? 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading school…" />;

  return (
    <div className="td-page">
      <PageHeader
        title={isEdit ? 'Edit school' : 'Add school'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          // { label: 'Schools / Organizations', to: '/admin/masters/schools' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card className="ms-form">
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}

        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="School name" required {...form.getFieldProps('name')} />
          <Input label="School code" {...form.getFieldProps('schoolCode')} />
          <AddressFields values={form.values} getProps={form.getFieldProps} setFieldValue={form.setFieldValue} />

          <SectionHeader title="Contact" as="h3" />
          <Input label="Contact person" {...form.getFieldProps('contactPerson')} />
          <Input label="Contact email" type="email" {...form.getFieldProps('contactEmail')} />
          <Input label="Contact phone" type="tel" {...form.getFieldProps('contactPhone')} />

          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />
          {!isEdit && (
            <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create school'}</Button>
            <Button as={Link} to="/admin/masters/schools" variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </div>
  );
}
