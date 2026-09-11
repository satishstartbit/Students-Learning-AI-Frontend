import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  StatusBadge,
  Table,
  Input,
  Label,
  Alert,
  Loader,
  SectionHeader,
  ConfirmationModal,
  Textarea,
  EmptyState,
  Toast,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatDate } from '../../../utils/date';
import { formatCurrency } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/errorHandler';
import subscriptionService from '../services/subscription.service';

/** One selectable plan. */
function PlanCard({ plan, selected, onSelect }) {
  const childLimit =
    plan.minChildren && plan.maxChildren && plan.minChildren !== plan.maxChildren
      ? `${plan.minChildren}–${plan.maxChildren} children`
      : plan.maxChildren
        ? `Up to ${plan.maxChildren} ${plan.maxChildren === 1 ? 'child' : 'children'}`
        : 'Unlimited children';

  return (
    <Card
      className="ui-field"
      style={selected ? { borderColor: 'var(--accent-base)', borderWidth: 2 } : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{plan.name}</div>
          {plan.description && <p className="ui-hint">{plan.description}</p>}
        </div>
        {plan.trialDays > 0 && <Badge variant="success">{plan.trialDays}-day trial</Badge>}
      </div>

      <div style={{ margin: 'var(--spacing-md) 0', fontSize: '1.5rem', fontWeight: 700 }}>
        {formatCurrency(plan.price, plan.currency)}
        <span className="ui-hint" style={{ fontSize: '0.9rem', fontWeight: 400 }}>
          {' '}
          / {plan.billingCycle === 'yearly' ? 'year' : 'month'}
        </span>
      </div>

      <Badge variant="neutral">{childLimit}</Badge>

      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <Button fullWidth variant={selected ? 'primary' : 'secondary'} onClick={() => onSelect(plan)}>
          {selected ? 'Selected' : 'Choose this plan'}
        </Button>
      </div>
    </Card>
  );
}

/**
 * /parent/subscription
 *
 * Shows the parent's current subscription when they have one, and the plan
 * picker when they don't. Card details are never entered here - choosing a
 * plan hands off to the Stripe-hosted card form on the checkout step.
 */
export default function ParentSubscriptionPage() {
  const navigate = useNavigate();

  const subscription = useApi(subscriptionService.getMySubscription);
  const payments = useApi(subscriptionService.listMyPayments);
  const plans = useApi(subscriptionService.listPlans);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [quote, setQuote] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    subscription.run().catch(() => {});
    payments.run().catch(() => {});
    plans.run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Coming back from a 3-D Secure / bank redirect: Stripe appends the
  // PaymentIntent to the URL. Confirm it once (the server re-reads it from
  // Stripe), then strip the params so a refresh doesn't repeat it.
  const [searchParams, setSearchParams] = useSearchParams();
  const returnedIntent = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');
  const handledReturn = useRef(false);

  useEffect(() => {
    if (!returnedIntent) {
      load();
      return;
    }
    if (handledReturn.current) return;
    handledReturn.current = true;

    const finish = async () => {
      if (redirectStatus === 'succeeded') {
        try {
          await subscriptionService.confirmCheckout(returnedIntent);
          toast.success('Payment received — your subscription is active');
        } catch {
          toast.info('Payment received. Your subscription will activate shortly.');
        }
      } else {
        toast.error('Your payment was not completed. Please try again.');
      }
      setSearchParams({}, { replace: true });
    };
    finish();
  }, [returnedIntent, redirectStatus, load, setSearchParams]);

  const current = subscription.data?.subscription ?? null;
  const hasSubscription = Boolean(current);

  const applyCoupon = async () => {
    if (!selectedPlan) return;
    setCheckingCoupon(true);
    setCouponError(null);
    try {
      const { data } = await subscriptionService.validateCoupon({
        planId: selectedPlan.id,
        code: couponCode.trim() || null,
      });
      setQuote(data);
      if (couponCode.trim()) toast.success('Discount applied');
    } catch (err) {
      setQuote(null);
      setCouponError(getErrorMessage(err));
    } finally {
      setCheckingCoupon(false);
    }
  };

  const selectPlan = (plan) => {
    setSelectedPlan(plan);
    setQuote(null);
    setCouponError(null);
  };

  const goToCheckout = async () => {
    if (!selectedPlan) return;
    setStartingCheckout(true);
    try {
      const { data } = await subscriptionService.startCheckout({
        planId: selectedPlan.id,
        code: couponCode.trim() || null,
      });
      // The client secret is handed to Stripe Elements on the next screen; it
      // is single-use and scoped to this one payment.
      navigate('/parent/subscription/checkout', { state: { checkout: data } });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStartingCheckout(false);
    }
  };

  const submitCancel = async () => {
    setCancelling(true);
    try {
      await subscriptionService.cancelMySubscription(cancelReason.trim() || null);
      toast.success('Your subscription will end when the current period finishes');
      setCancelOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const paymentColumns = [
    { key: 'createdAt', header: 'Date', render: (row) => formatDate(row.createdAt) },
    { key: 'planName', header: 'Plan', render: (row) => row.planName ?? '—' },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <div>
          {formatCurrency(row.amount, row.currency)}
          {row.discountApplied > 0 && (
            <div className="ui-hint">−{formatCurrency(row.discountApplied, row.currency)} discount</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status} />
          {row.refundAmount > 0 && (
            <div className="ui-hint">{formatCurrency(row.refundAmount, row.currency)} refunded</div>
          )}
        </div>
      ),
    },
  ];

  if (subscription.isLoading && !subscription.data && plans.isLoading) {
    return <Loader message="Loading your subscription…" />;
  }

  return (
    <>
      <PageHeader
        title="Subscription"
        description={
          hasSubscription
            ? 'Your current plan, billing history and renewal date.'
            : 'Choose a plan to get started.'
        }
      />

      {subscription.error && <Alert variant="error">{getErrorMessage(subscription.error)}</Alert>}

      {hasSubscription ? (
        <>
          <Card className="ui-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{current.plan?.name}</div>
                <div className="ui-hint">
                  {formatCurrency(current.plan?.price, current.plan?.currency)} /{' '}
                  {current.plan?.billingCycle === 'yearly' ? 'year' : 'month'}
                </div>
                <div style={{ marginTop: 'var(--spacing-sm)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <StatusBadge status={current.status} />
                  {current.cancelAtPeriodEnd && <Badge variant="warning">Ends at period</Badge>}
                  {current.discountCode && <Badge variant="primary">{current.discountCode.code}</Badge>}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="ui-hint">
                  {current.cancelAtPeriodEnd ? 'Access ends' : 'Renews on'}
                </div>
                <div style={{ fontWeight: 600 }}>
                  {current.currentPeriodEnd ? formatDate(current.currentPeriodEnd) : '—'}
                </div>
              </div>
            </div>

            {current.status === 'past_due' && (
              <Alert variant="warning" className="ui-field">
                We could not charge your saved card. We will try again over the next few days —
                update your card to avoid losing access.
              </Alert>
            )}

            {!current.cancelAtPeriodEnd && (
              <div style={{ marginTop: 'var(--spacing-lg)' }}>
                <Button variant="secondary" onClick={() => setCancelOpen(true)}>
                  Cancel subscription
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <SectionHeader title="Billing history" as="h3" />
            <Table
              columns={paymentColumns}
              data={payments.data ?? []}
              rowKey="id"
              emptyContent="No payments yet."
              caption="Billing history"
            />
          </Card>
        </>
      ) : (
        <>
          {(plans.data ?? []).length === 0 ? (
            <EmptyState
              icon="💳"
              title="No plans available yet"
              description="There are no active subscription plans to choose from right now."
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 'var(--spacing-lg)',
              }}
            >
              {(plans.data ?? []).map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan?.id === plan.id}
                  onSelect={selectPlan}
                />
              ))}
            </div>
          )}

          {selectedPlan && (
            <Card style={{ marginTop: 'var(--spacing-lg)' }}>
              <SectionHeader title={`Checkout — ${selectedPlan.name}`} as="h3" />

              {/* Label outside the row and tops aligned, so the button lines up
                  with the input rather than with the field's bottom margin. */}
              <Label htmlFor="coupon-code">Discount code</Label>
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-sm)',
                  alignItems: 'flex-start',
                  marginTop: 'var(--spacing-xs)',
                }}
              >
                <Input
                  id="coupon-code"
                  placeholder="Optional"
                  value={couponCode}
                  error={couponError}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    // The shown discount belonged to the old code - drop it
                    // until the new one is applied.
                    setQuote(null);
                    if (couponError) setCouponError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyCoupon();
                    }
                  }}
                />
                <Button variant="secondary" onClick={applyCoupon} loading={checkingCoupon}>
                  Apply
                </Button>
              </div>

              <div style={{ marginTop: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(quote?.subtotal ?? selectedPlan.price, selectedPlan.currency)}</span>
                </div>
                {quote?.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success-fg)' }}>
                    <span>Discount {quote.coupon ? `(${quote.coupon.code})` : ''}</span>
                    <span>−{formatCurrency(quote.discount, selectedPlan.currency)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    marginTop: 'var(--spacing-sm)',
                    paddingTop: 'var(--spacing-sm)',
                    borderTop: '1px solid var(--color-border-default)',
                  }}
                >
                  <span>Total due today</span>
                  <span>{formatCurrency(quote?.total ?? selectedPlan.price, selectedPlan.currency)}</span>
                </div>
              </div>

              <div style={{ marginTop: 'var(--spacing-lg)' }}>
                <Button onClick={goToCheckout} loading={startingCheckout}>
                  Continue to payment
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={submitCancel}
        loading={cancelling}
        variant="danger"
        title="Cancel your subscription?"
        confirmLabel="Cancel subscription"
        cancelLabel="Keep it"
        message={`You will keep access until ${
          current?.currentPeriodEnd ? formatDate(current.currentPeriodEnd) : 'the end of the current period'
        }, and you will not be charged again.`}
      >
        <Textarea
          label="Reason (optional)"
          rows={2}
          placeholder="Tell us why you're leaving"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </ConfirmationModal>

      <Toast />
    </>
  );
}
