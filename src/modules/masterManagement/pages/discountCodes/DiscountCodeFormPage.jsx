import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Textarea, Select, MultiSelect, DatePicker, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required, max, min, pattern } from '../../../../utils/validation';
import { toDateInputValue } from '../../../../utils/date';
import billingService from '../../services/billing.service';
import '../../components/masterPages.css';

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed amount' },
];

/**
 * Only percentage discounts have an upper bound - fixed_amount stays
 * unbounded. Reads the sibling `discountType` from `allValues`, the same
 * cross-field shape `utils/validation.js`'s own `matches` rule uses.
 */
const percentageMax = (message = 'Percentage discounts cannot exceed 100') => (value, allValues = {}) =>
  allValues.discountType === 'percentage' ? max(100, message)(value) : null;

/** Blank = no limit; otherwise a whole number of at least 1 (0 would make a code nobody can use). */
const limitOrBlank = (value) =>
  value === '' || value == null || (Number.isInteger(Number(value)) && Number(value) >= 1)
    ? null
    : 'Enter a whole number of 1 or more, or leave blank for no limit';

/** Day keys compare as text ("2026-10-31"). */
const notBeforeStart = (value, allValues = {}) =>
  value && allValues.startDate && value < allValues.startDate ? 'The expiry date cannot be before the start date' : null;

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
      startDate: '', expiresAt: '', maxRedemptions: '', maxRedemptionsPerUser: '1', displayOrder: 0, isActive: true,
    },
    validationSchema: {
      code: isEdit
        ? []
        : [required('Enter a discount code'), pattern(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, - or _ only, with no spaces')],
      name: [required('Enter a name')],
      discountValue: [required('Enter the discount value'), min(0, 'The discount cannot be negative'), percentageMax()],
      expiresAt: [notBeforeStart],
      maxRedemptions: [limitOrBlank],
      maxRedemptionsPerUser: [limitOrBlank],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name,
        description: values.description || null,
        discountType: values.discountType,
        discountValue: Number(values.discountValue) || 0,
        startDate: values.startDate || null,
        // A day: the server keeps the code working to the end of it, in your time zone.
        expiresAt: values.expiresAt || null,
        maxRedemptions: values.maxRedemptions === '' ? null : Number(values.maxRedemptions),
        maxRedemptionsPerUser: values.maxRedemptionsPerUser === '' ? null : Number(values.maxRedemptionsPerUser),
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

  // Plans picked for this code follow the loaded record - adjusted during
  // render (React's pattern for state derived from a changed prop), not in an effect.
  const [plansSeededFrom, setPlansSeededFrom] = useState(null);
  if (existing && existing !== plansSeededFrom) {
    setPlansSeededFrom(existing);
    setApplicablePlans(existing.applicablePlans ?? []);
  }

  useEffect(() => {
    if (!existing) return;
    form.reset({
      code: existing.code ?? '',
      name: existing.name ?? '',
      description: existing.description ?? '',
      discountType: existing.discountType ?? 'percentage',
      discountValue: existing.discountValue ?? '',
      startDate: existing.startDate ?? '',
      // The day it ends where you are - slicing the UTC date showed the next day for an evening expiry.
      expiresAt: existing.expiresAt ? toDateInputValue(existing.expiresAt) : '',
      maxRedemptions: existing.maxRedemptions ?? '',
      maxRedemptionsPerUser: existing.maxRedemptionsPerUser ?? '',
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading discount code…" />;

  return (
    <div className="td-page">
      <PageHeader
        title={isEdit ? 'Edit discount code' : 'Add discount code'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Discount Codes', to: '/admin/masters/discount-codes' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card className="ms-form">
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}

        <form onSubmit={form.handleSubmit} noValidate>
          {!isEdit && (
            <Input
              label="Discount code"
              required
              hint="Letters, numbers, - or _. Parents can type it in any case."
              {...form.getFieldProps('code')}
            />
          )}
          <Input label="Name" required {...form.getFieldProps('name')} />
          <Textarea label="Description" {...form.getFieldProps('description')} />
          <Select label="Discount type" options={DISCOUNT_TYPE_OPTIONS} required {...form.getFieldProps('discountType')} />
          <Input
            label="Discount value"
            type="number"
            min={0}
            required
            hint="100% or more than the price makes the plan free - no card is asked for."
            {...form.getFieldProps('discountValue')}
          />
          <DatePicker label="Start date" hint="Works from the start of this day." {...form.getFieldProps('startDate')} />
          <DatePicker label="Expiry date" hint="Works until the end of this day." {...form.getFieldProps('expiresAt')} />
          <Input
            label="Usage limit"
            type="number"
            min={1}
            hint="How many families can use it in total. Leave blank for unlimited."
            {...form.getFieldProps('maxRedemptions')}
          />
          <Input
            label="Uses per family"
            type="number"
            min={1}
            hint="How many times one family can use it. Leave blank for unlimited."
            {...form.getFieldProps('maxRedemptionsPerUser')}
          />
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
    </div>
  );
}
