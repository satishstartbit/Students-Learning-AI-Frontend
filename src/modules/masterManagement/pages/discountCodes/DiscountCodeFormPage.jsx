import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Textarea, Select, MultiSelect, DatePicker, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import billingService from '../../services/billing.service';

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed amount' },
];

export default function DiscountCodeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(billingService.getDiscountCode);
  const { data: plans } = useApi(billingService.listPlans, { immediate: true, args: [{ limit: 100, status: 'active' }] });
  const planOptions = (plans ?? []).map((p) => ({ value: p.id, label: `${p.name} (${p.billingCycle})` }));

  const [applicablePlans, setApplicablePlans] = useState([]);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: {
      code: '', name: '', description: '', discountType: 'percentage', discountValue: '',
      startDate: '', expiresAt: '', maxRedemptions: '', displayOrder: 0, isActive: true,
    },
    validationSchema: {
      code: isEdit ? [] : [required('Enter a discount code')],
      name: [required('Enter a name')],
      discountValue: [required('Enter the discount value')],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name,
        description: values.description || null,
        discountType: values.discountType,
        discountValue: Number(values.discountValue) || 0,
        startDate: values.startDate || null,
        expiresAt: values.expiresAt || null,
        maxRedemptions: values.maxRedemptions === '' ? null : Number(values.maxRedemptions),
        applicablePlans,
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) {
        payload.code = values.code;
        payload.isActive = values.isActive;
      }

      const { data } = isEdit
        ? await billingService.updateDiscountCode(id, payload)
        : await billingService.createDiscountCode(payload);

      toast.success(isEdit ? 'Discount code updated' : 'Discount code created');
      navigate('/admin/masters/discount-codes');
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    form.reset({
      code: existing.code ?? '',
      name: existing.name ?? '',
      description: existing.description ?? '',
      discountType: existing.discountType ?? 'percentage',
      discountValue: existing.discountValue ?? '',
      startDate: existing.startDate ?? '',
      expiresAt: existing.expiresAt ? String(existing.expiresAt).slice(0, 10) : '',
      maxRedemptions: existing.maxRedemptions ?? '',
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
    setApplicablePlans(existing.applicablePlans ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading discount code…" />;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit discount code' : 'Add discount code'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Discount Codes', to: '/admin/masters/discount-codes' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card>
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}

        <form onSubmit={form.handleSubmit} noValidate>
          {!isEdit && <Input label="Discount code" required {...form.getFieldProps('code')} />}
          <Input label="Name" required {...form.getFieldProps('name')} />
          <Textarea label="Description" {...form.getFieldProps('description')} />
          <Select label="Discount type" options={DISCOUNT_TYPE_OPTIONS} required {...form.getFieldProps('discountType')} />
          <Input label="Discount value" type="number" required {...form.getFieldProps('discountValue')} />
          <DatePicker label="Start date" {...form.getFieldProps('startDate')} />
          <DatePicker label="Expiry date" {...form.getFieldProps('expiresAt')} />
          <Input label="Usage limit" type="number" hint="Leave blank for unlimited" {...form.getFieldProps('maxRedemptions')} />
          <MultiSelect
            label="Applicable plans"
            options={planOptions}
            value={applicablePlans}
            onChange={setApplicablePlans}
            placeholder="All plans"
            hint="Leave empty to apply to every plan"
          />
          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />

          {!isEdit && (
            <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create code'}</Button>
            <Button as={Link} to="/admin/masters/discount-codes" variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </>
  );
}
