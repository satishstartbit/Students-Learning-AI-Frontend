import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Input, Textarea, Select, Checkbox, Button, Alert, ButtonGroup, SectionHeader, IconButton, Loader } from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import { DEFAULT_CURRENCY } from '../../../../utils/locale';
import billingService from '../../services/billing.service';
import '../../components/masterPages.css';

const PLAN_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'family', label: 'Family' },
];
const BILLING_CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

/** Simple key/value editor for the plan's `features` JSON. */
function FeaturesEditor({ features, onChange }) {
  const entries = Object.entries(features ?? {});

  const setEntry = (index, key, value) => {
    const next = [...entries];
    next[index] = [key, value];
    onChange(Object.fromEntries(next));
  };
  const removeEntry = (index) => {
    const next = entries.filter((_, i) => i !== index);
    onChange(Object.fromEntries(next));
  };
  const addEntry = () => onChange(Object.fromEntries([...entries, ['', '']]));

  return (
    <div className="ui-field">
      <label className="ui-label">Features</label>
      {entries.map(([key, value], index) => (
        <div key={index} style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
          <Input placeholder="Feature key" value={key} onChange={(e) => setEntry(index, e.target.value, value)} fieldClassName="" />
          <Input placeholder="Value" value={value} onChange={(e) => setEntry(index, key, e.target.value)} fieldClassName="" />
          <IconButton label="Remove feature" variant="danger" onClick={() => removeEntry(index)}>×</IconButton>
        </div>
      ))}
      <Button type="button" size="sm" variant="secondary" onClick={addEntry}>Add feature</Button>
    </div>
  );
}

export default function SubscriptionPlanFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingItem, run: fetchItem } = useApi(billingService.getPlan);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const [features, setFeatures] = useState({});

  const form = useForm({
    initialValues: {
      name: '', planType: 'individual', billingCycle: 'monthly', price: '', currency: DEFAULT_CURRENCY,
      trialDays: '', maxStudents: '', maxParents: '', description: '', displayOrder: 0, isActive: true,
    },
    validationSchema: {
      name: [required('Enter a plan name')],
      price: [required('Enter a price')],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name,
        planType: values.planType,
        billingCycle: values.billingCycle,
        price: Number(values.price) || 0,
        currency: values.currency || DEFAULT_CURRENCY,
        trialDays: values.trialDays === '' ? undefined : Number(values.trialDays),
        maxStudents: values.maxStudents === '' ? undefined : Number(values.maxStudents),
        maxParents: values.maxParents === '' ? undefined : Number(values.maxParents),
        description: values.description || null,
        features,
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) payload.isActive = values.isActive;

      const { data } = isEdit
        ? await billingService.updatePlan(id, payload)
        : await billingService.createPlan(payload);

      toast.success(isEdit ? 'Subscription plan updated' : 'Subscription plan created');
      navigate('/admin/masters/subscription-plans');
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
      currency: existing.currency ?? DEFAULT_CURRENCY,
      trialDays: existing.trialDays ?? '',
      maxStudents: existing.maxStudents ?? '',
      maxParents: existing.maxParents ?? '',
      description: existing.description ?? '',
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
    setFeatures(existing.features ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (isEdit && loadingItem && !existing) return <Loader message="Loading plan…" />;

  return (
    <div className="td-page">
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
          <Input label={`Price (${DEFAULT_CURRENCY})`} type="number" required {...form.getFieldProps('price')} />
          <Input label="Trial days" type="number" {...form.getFieldProps('trialDays')} />
          <Input label="Number of students" type="number" {...form.getFieldProps('maxStudents')} />
          <Input label="Number of parents" type="number" {...form.getFieldProps('maxParents')} />
          <Textarea label="Description" {...form.getFieldProps('description')} />

          <SectionHeader title="Features" as="h3" />
          <FeaturesEditor features={features} onChange={setFeatures} />

          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />
          {!isEdit && (
            <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />
          )}

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Create plan'}</Button>
            <Button as={Link} to="/admin/masters/subscription-plans" variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </div>
  );
}
