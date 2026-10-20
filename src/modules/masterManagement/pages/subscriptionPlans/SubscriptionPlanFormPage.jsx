import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Textarea, Select, Checkbox, Button, Alert, ButtonGroup, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import { DEFAULT_CURRENCY } from '../../../../utils/locale';
import { listAddress } from '../../../../utils/listQuery';
import billingService from '../../services/billing.service';
import '../../components/masterPages.css';
import OrderField from '../../components/OrderField';
import { orderPayload } from '../../components/masterOrder';
import { familySizeProblem, minimumProblem, planPayload, priceProblem, trialProblem } from './planFormRules';
import MasterBackButton from '../../components/MasterBackButton';

const PLAN_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'family', label: 'Family' },
];
const BILLING_CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

// Field rules live in planFormRules.js (+ test); the server checks the same.
const chargeablePrice = (value) => priceProblem(value, DEFAULT_CURRENCY);
const minimumWithinPrice = (value, values) => minimumProblem(value, values, DEFAULT_CURRENCY);

// No Features editor (removed 2026-10-20, user request): nothing in the app shows a
// plan's features, so the form doesn't send them - a new plan gets none (the
// column defaults to {}), and saving an older plan leaves what it has.
export default function SubscriptionPlanFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(billingService.getPlan);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: {
      name: '', planType: 'individual', billingCycle: 'monthly', price: '', minimumAmount: '', currency: DEFAULT_CURRENCY,
      trialDays: '', maxStudents: '', maxParents: '', description: '', displayOrder: '', isActive: true,
    },
    // 2026-10-20 (user request): trial days, number of students/parents (at least 1) and the
    // minimum amount are required.
    validationSchema: {
      name: [required('Enter a plan name')],
      price: [required('Enter a price'), chargeablePrice],
      minimumAmount: [required('Enter the minimum amount (0 for no minimum)'), minimumWithinPrice],
      trialDays: [required('Enter the trial days (0 for no free trial)'), trialProblem],
      maxStudents: [required('Enter the number of students'), familySizeProblem],
      maxParents: [required('Enter the number of parents'), familySizeProblem],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name,
        planType: values.planType,
        billingCycle: values.billingCycle,
        ...planPayload(values),
        currency: values.currency || DEFAULT_CURRENCY,
        description: values.description || null,
        displayOrder: orderPayload(values.displayOrder),
      };
      if (!isEdit) payload.isActive = values.isActive;

      const { data } = isEdit
        ? await billingService.updatePlan(id, payload)
        : await billingService.createPlan(payload);

      toast.success(isEdit ? 'Subscription plan updated' : 'Subscription plan created');
      navigate(listAddress('/admin/masters/subscription-plans'));
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    form.reset({
      name: existing.name ?? '',
      planType: existing.planType ?? 'individual',
      billingCycle: existing.billingCycle ?? 'monthly',
      price: existing.price ?? '',
      minimumAmount: existing.minimumAmount ?? '0.00',
      currency: existing.currency ?? DEFAULT_CURRENCY,
      trialDays: existing.trialDays ?? '',
      maxStudents: existing.maxStudents ?? '',
      maxParents: existing.maxParents ?? '',
      description: existing.description ?? '',
      displayOrder: existing.displayOrder ?? '',
      isActive: existing.isActive ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading plan…" />;

  return (
    <div className="td-page">
      <MasterBackButton />
      <PageHeader
        title={isEdit ? 'Edit subscription plan' : 'Add subscription plan'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Subscription Plans', to: '/admin/masters/subscription-plans' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <Card className="ms-form">
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}

        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Plan name" required {...form.getFieldProps('name')} />
          <Select label="Plan type" options={PLAN_TYPE_OPTIONS} required {...form.getFieldProps('planType')} />
          <Select label="Billing cycle" options={BILLING_CYCLE_OPTIONS} required {...form.getFieldProps('billingCycle')} />
          <Input
            label={`Price (${DEFAULT_CURRENCY})`}
            type="number"
            min={0}
            step="0.01"
            required
            hint="0 makes it a free plan: families start it without a card."
            {...form.getFieldProps('price')}
          />
          <Input
            label={`Minimum amount (${DEFAULT_CURRENCY})`}
            type="number"
            min={0}
            step="0.01"
            required
            hint="The least a family pays for this plan, whatever discount code is used. 0 = no minimum. It can't be more than the price."
            {...form.getFieldProps('minimumAmount')}
          />
          <Input
            label="Trial days"
            type="number"
            min={0}
            max={365}
            required
            hint="A free trial for a family's first subscription: the card is saved, then charged when the trial ends. 0 = no trial."
            {...form.getFieldProps('trialDays')}
          />
          <Input
            label="Number of students"
            type="number"
            min={1}
            required
            hint="Most children a family can add on this plan (at least 1)."
            {...form.getFieldProps('maxStudents')}
          />
          <Input
            label="Number of parents"
            type="number"
            min={1}
            required
            hint="Most parent accounts in the family, the account holder included (at least 1)."
            {...form.getFieldProps('maxParents')}
          />
          <Textarea label="Description" {...form.getFieldProps('description')} />

          <OrderField isEdit={isEdit} {...form.getFieldProps('displayOrder')} />
          {!isEdit && (
            <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create plan'}</Button>
            <Button as={Link} to={listAddress('/admin/masters/subscription-plans')} variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </div>
  );
}
