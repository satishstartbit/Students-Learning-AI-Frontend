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
  ErrorState,
  Checkbox,
  Toast,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatDate } from '../../../utils/date';
import { formatCurrency, formatName } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/errorHandler';
import { planFitReason } from '../../parent/familyLimits';
import PaymentMethodCard from '../components/PaymentMethodCard';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';
import subscriptionService from '../services/subscription.service';
import { describeCard } from '../stripe';

/** One selectable plan. `fitReason` = why it can't hold the family as it is now (it can't be chosen). */
function PlanCard({ plan, selected, onSelect, fitReason }) {
  const childLimit =
    plan.minChildren && plan.maxChildren && plan.minChildren !== plan.maxChildren
      ? `${plan.minChildren}–${plan.maxChildren} children`
      : plan.maxChildren
        ? `Up to ${plan.maxChildren} ${plan.maxChildren === 1 ? 'child' : 'children'}`
        : 'Unlimited children';
  const parentLimit = plan.maxParents
    ? `Up to ${plan.maxParents} ${plan.maxParents === 1 ? 'parent' : 'parents'}`
    : 'Unlimited parents';

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

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Badge variant="neutral">{childLimit}</Badge>
        <Badge variant="neutral">{parentLimit}</Badge>
      </div>

      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <Button
          fullWidth
          variant={selected ? 'primary' : 'secondary'}
          disabled={Boolean(fitReason)}
          onClick={() => onSelect(plan)}
        >
          {selected ? 'Selected' : fitReason ? 'Too small for your family' : 'Choose this plan'}
        </Button>
        {fitReason && <p className="ui-hint">{fitReason}</p>}
      </div>
    </Card>
  );
}

/** Why the family is locked out, in words - shown above everything when there's no access. */
function lockMessage(access, latest) {
  if (!access || access.hasAccess) return null;
  const planName = latest?.plan?.name ? `${latest.plan.name} ` : '';
  const ended = latest?.currentPeriodEnd ? ` on ${formatDate(latest.currentPeriodEnd)}` : '';
  if (access.reason === 'cancelled') {
    return `Your ${planName}subscription was cancelled. Choose a plan to restore access for you and your children.`;
  }
  if (access.reason === 'expired') {
    return `Your ${planName}subscription ended${ended}. Choose a plan to restore access for you and your children.`;
  }
  return 'Choose a plan to unlock the platform for you and your children. Until then, other pages stay locked.';
}

/**
 * /parent/subscription
 *
 * The parent's subscription hub, and where the paywall sends them: current
 * status (or why they're locked out), auto-renewal, the saved card, the plan
 * picker when nothing is in force, and billing history. Card details are
 * never entered on this page itself - they go into Stripe Elements, either on
 * the checkout step or in the card dialog.
 */
export default function ParentSubscriptionPage() {
  const navigate = useNavigate();
  const { refresh: refreshAccess } = useSubscriptionAccess();

  const overview = useApi(subscriptionService.getMySubscription);
  const payments = useApi(subscriptionService.listMyPayments);
  const plans = useApi(subscriptionService.listPlans);
  const paymentMethod = useApi(subscriptionService.getPaymentMethod);

  const [selectedPlan, setSelectedPlan] = useState(null);
  // Mirrors selectedPlan synchronously (setSelectedPlan itself only takes
  // effect on the next render) so an in-flight coupon request can tell,
  // right when its response lands, whether the user has since switched to a
  // different plan.
  const selectedPlanRef = useRef(null);
  const [couponCode, setCouponCode] = useState('');
  const [quote, setQuote] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [autoRenewOffOpen, setAutoRenewOffOpen] = useState(false);
  const [togglingAutoRenew, setTogglingAutoRenew] = useState(false);

  const load = useCallback(() => {
    overview.run().catch(() => {});
    payments.run().catch(() => {});
    plans.run().catch(() => {});
    paymentMethod.run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** After anything that changes the subscription or card: re-read it all, and the layout's access. */
  const reload = useCallback(async () => {
    await Promise.all([overview.run(), payments.run(), paymentMethod.run()].map((p) => p.catch(() => {})));
    await refreshAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshAccess]);

  // Coming back from a Stripe redirect (3-D Secure / bank authentication):
  // a checkout appends payment_intent, the card dialog appends setup_intent.
  // Confirm once (the server re-reads the intent from Stripe), then strip the
  // params so a refresh doesn't repeat it.
  const [searchParams, setSearchParams] = useSearchParams();
  const returnedIntent = searchParams.get('payment_intent');
  const returnedSetup = searchParams.get('setup_intent');
  const redirectStatus = searchParams.get('redirect_status');
  const handledReturn = useRef(false);

  useEffect(() => {
    if (!returnedIntent && !returnedSetup) {
      load();
      return;
    }
    if (handledReturn.current) return;
    handledReturn.current = true;

    const finish = async () => {
      if (returnedSetup) {
        if (redirectStatus === 'succeeded') {
          try {
            await subscriptionService.confirmSetupIntent(returnedSetup);
            toast.success('Card saved');
          } catch (err) {
            toast.error(getErrorMessage(err));
          }
        } else {
          toast.error('Your card was not saved. Please try again.');
        }
      } else if (redirectStatus === 'succeeded') {
        try {
          await subscriptionService.confirmCheckout(returnedIntent);
          toast.success('Payment received — your subscription is active');
        } catch {
          toast.info('Payment received. Your subscription will activate shortly.');
        }
      } else if (redirectStatus === 'processing') {
        // Some payment methods settle asynchronously - this is not a
        // failure, so don't tell the user to retry a charge that may still
        // succeed.
        toast.info("Your payment is processing — we'll update your subscription once it's confirmed.");
      } else {
        toast.error('Your payment was not completed. Please try again.');
      }
      setSearchParams({}, { replace: true });
      load();
      await refreshAccess();
    };
    finish();
  }, [returnedIntent, returnedSetup, redirectStatus, load, setSearchParams, refreshAccess]);

  const current = overview.data?.subscription ?? null;
  const latest = overview.data?.latestSubscription ?? null;
  const access = overview.data?.access ?? null;
  const card = paymentMethod.data?.card ?? null;
  const hasSubscription = Boolean(current);

  // Extra parents share the account holder's plan, read-only: no plan picker,
  // renewal, cancel, card or billing history.
  const familyInfo = overview.data?.family ?? null;
  const isAccountHolder = familyInfo?.isAccountHolder !== false;
  const holderName = formatName(familyInfo?.accountHolder, { fallback: 'the account holder' });
  const lock = isAccountHolder
    ? lockMessage(access, latest)
    : access && !access.hasAccess
      ? `Your family's plan is not active. Ask ${holderName}, the account holder, to renew it.`
      : null;

  const applyCoupon = async () => {
    if (!selectedPlan) return;
    const requestedPlanId = selectedPlan.id;
    setCheckingCoupon(true);
    setCouponError(null);
    try {
      const { data } = await subscriptionService.validateCoupon({
        planId: requestedPlanId,
        code: couponCode.trim() || null,
      });
      // The parent may have switched plans while this request was in
      // flight - a stale quote for the old plan must not be applied now.
      if (selectedPlanRef.current?.id !== requestedPlanId) return;
      setQuote(data);
      if (couponCode.trim()) toast.success('Discount applied');
    } catch (err) {
      if (selectedPlanRef.current?.id !== requestedPlanId) return;
      setQuote(null);
      setCouponError(getErrorMessage(err));
    } finally {
      setCheckingCoupon(false);
    }
  };

  const selectPlan = (plan) => {
    selectedPlanRef.current = plan;
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
      // is single-use and scoped to this one payment. The saved card (if any)
      // travels too, so checkout can offer to pay with it.
      navigate('/parent/subscription/checkout', { state: { checkout: data, savedCard: card } });
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
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const changeAutoRenew = async (enabled) => {
    setTogglingAutoRenew(true);
    try {
      await subscriptionService.setAutoRenew(enabled);
      toast.success(enabled ? 'Auto-renewal is on' : 'Auto-renewal is off');
      setAutoRenewOffOpen(false);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingAutoRenew(false);
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

  if (overview.isLoading && !overview.data && plans.isLoading) {
    return <Loader message="Loading your subscription…" />;
  }

  const periodEnd = current?.currentPeriodEnd ? formatDate(current.currentPeriodEnd) : 'the end of the current period';
  let autoRenewDescription = '';
  if (current?.cancelledAt) {
    autoRenewDescription = `Cancelled on ${formatDate(current.cancelledAt)} - access ends ${periodEnd}. You can subscribe again once it ends.`;
  } else if (current?.autoRenew) {
    autoRenewDescription = card
      ? `Renews on ${periodEnd}, charging ${describeCard(card)}.`
      : `Renews on ${periodEnd} - add a card below, or the renewal payment will fail.`;
  } else if (current) {
    autoRenewDescription = `Off - access ends ${periodEnd}. Turn it back on any time before then to keep your subscription.`;
  }

  const allPayments = payments.data ?? [];

  return (
    <div className="td-page">
      <PageHeader
        title="Subscription"
        description={
          !isAccountHolder
            ? "Your family's plan, shared with you."
            : hasSubscription
              ? 'Your plan, auto-renewal, payment method and billing history.'
              : 'Choose a plan to get started.'
        }
      />

      {overview.error && (
        <ErrorState variant="compact" title="We couldn't load your subscription" error={overview.error} onRetry={load} />
      )}

      {lock && (
        <Alert variant="warning" className="ui-field">
          {lock}
        </Alert>
      )}

      {!isAccountHolder && (
        <Alert variant="info" className="ui-field">
          {holderName} manages your family's plan. You share it, but only they can change or cancel it.
        </Alert>
      )}

      {hasSubscription && (
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
                {current.cancelledAt ? (
                  <Badge variant="warning">Cancelled</Badge>
                ) : (
                  !current.autoRenew && <Badge variant="warning">Ends at period end</Badge>
                )}
                {current.discountCode && <Badge variant="primary">{current.discountCode.code}</Badge>}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="ui-hint">{current.autoRenew ? 'Renews on' : 'Access ends'}</div>
              <div style={{ fontWeight: 600 }}>{current.currentPeriodEnd ? formatDate(current.currentPeriodEnd) : '—'}</div>
            </div>
          </div>

          {current.status === 'past_due' && (
            <Alert variant="warning" className="ui-field">
              We could not charge your saved card. We will try again over the next few days — update your
              card below to avoid losing access.
            </Alert>
          )}

          {isAccountHolder && (
            <div style={{ marginTop: 'var(--spacing-lg)' }}>
              <Checkbox
                name="autoRenew"
                label="Auto-renewal"
                description={autoRenewDescription}
                checked={current.autoRenew}
                disabled={Boolean(current.cancelledAt) || togglingAutoRenew}
                onChange={(event) => (event.target.checked ? changeAutoRenew(true) : setAutoRenewOffOpen(true))}
              />
            </div>
          )}

          {isAccountHolder && !current.cancelledAt && (
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <Button variant="secondary" onClick={() => setCancelOpen(true)}>
                Cancel subscription
              </Button>
            </div>
          )}
        </Card>
      )}

      {hasSubscription && isAccountHolder && (
        <PaymentMethodCard card={card} autoRenewing={Boolean(current.autoRenew)} onChanged={reload} className="ui-field" />
      )}

      {!hasSubscription && isAccountHolder && (
        <>
          <SectionHeader title="Choose a plan" as="h2" />
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
                  fitReason={planFitReason(plan, familyInfo)}
                />
              ))}
            </div>
          )}

          {selectedPlan && (
            <Card style={{ marginTop: 'var(--spacing-lg)' }} className="ui-field">
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

          {/* Plans first when there's nothing in force - the card can also be added at checkout. */}
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <PaymentMethodCard card={card} autoRenewing={false} onChanged={reload} className="ui-field" />
          </div>
        </>
      )}

      {isAccountHolder && (hasSubscription || allPayments.length > 0) && (
        <Card>
          <SectionHeader title="Billing history" as="h3" />
          <Table
            columns={paymentColumns}
            data={allPayments}
            rowKey="id"
            emptyContent="No payments yet."
            caption="Billing history"
          />
        </Card>
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
        message={`You will keep access until ${periodEnd}, and you will not be charged again. Unlike turning off auto-renewal, a cancellation can't be undone - you can subscribe again once it ends.`}
      >
        <Textarea
          label="Reason (optional)"
          rows={2}
          placeholder="Tell us why you're leaving"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={autoRenewOffOpen}
        onClose={() => setAutoRenewOffOpen(false)}
        onConfirm={() => changeAutoRenew(false)}
        loading={togglingAutoRenew}
        title="Turn off auto-renewal?"
        confirmLabel="Turn off"
        cancelLabel="Keep it on"
        message={`Your subscription will end on ${periodEnd} and you won't be charged again. You and your children keep access until then, and you can turn auto-renewal back on any time before that date.`}
      />

      <Toast />
    </div>
  );
}
