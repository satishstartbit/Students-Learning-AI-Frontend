import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LuUsersRound } from 'react-icons/lu';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Input,
  Label,
  Alert,
  Loader,
  SectionHeader,
  ConfirmationModal,
  Textarea,
  EmptyState,
  ErrorState,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatDate } from '../../../utils/date';
import { formatCurrency, formatName, formatStatus } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/errorHandler';
import { planFitReason } from '../../parent/familyLimits';
import { useViewingChild } from '../../parent/hooks/useViewingChild';
import BillingHistory from '../components/BillingHistory';
import PaymentMethodCard from '../components/PaymentMethodCard';
import PriceSummary from '../components/PriceSummary';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';
import subscriptionService from '../services/subscription.service';
import { describeCard } from '../stripe';
import '../components/subscription.css';

/** The plan's status as the mockup words it ("Free trial", not "Trialing"). */
const PLAN_STATUS = {
  trialing: { label: 'Free trial', variant: 'primary' },
  active: { label: 'Active', variant: 'success' },
  past_due: { label: 'Payment due', variant: 'warning' },
};

const per = (plan) => (plan?.billingCycle === 'yearly' ? 'year' : 'month');

/** "Up to 3 children" / "Unlimited children" - a blank plan limit means no limit. */
const limitText = (max, one, many) => (max ? `Up to ${max} ${max === 1 ? one : many}` : `Unlimited ${many}`);

/**
 * One selectable plan. `fitReason` = why it can't hold the family as it is
 * now; `current` = the plan the family is already on. Neither can be chosen.
 * The trial badge only shows to a family that would get the trial (their first subscription).
 */
function PlanCard({ plan, selected, onSelect, fitReason, current = false, trialEligible = true }) {
  let label = 'Choose this plan';
  if (current) label = 'Your current plan';
  else if (selected) label = 'Selected';
  else if (fitReason) label = 'Too small for your family';

  return (
    <Card
      className={`ui-field${current ? ' sub-plancard--current' : ''}`}
      style={selected ? { borderColor: 'var(--accent-base)', borderWidth: 2 } : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
        <div className="min-w-0">
          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{plan.name}</div>
          {plan.description && <p className="ui-hint">{plan.description}</p>}
        </div>
        {current ? (
          <Badge variant="primary">Your plan</Badge>
        ) : (
          trialEligible && plan.trialDays > 0 && <Badge variant="success">{plan.trialDays}-day free trial</Badge>
        )}
      </div>

      <div style={{ margin: 'var(--spacing-md) 0', fontSize: '1.5rem', fontWeight: 700 }}>
        {formatCurrency(plan.price, plan.currency)}
        <span className="ui-hint" style={{ fontSize: '0.9rem', fontWeight: 400 }}>
          {' '}
          / {per(plan)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Badge variant="neutral">{limitText(plan.maxChildren, 'child', 'children')}</Badge>
        <Badge variant="neutral">{limitText(plan.maxParents, 'parent', 'parents')}</Badge>
      </div>

      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <Button
          fullWidth
          variant={selected ? 'primary' : 'secondary'}
          disabled={current || Boolean(fitReason)}
          onClick={() => onSelect(plan)}
        >
          {label}
        </Button>
        {fitReason && !current && <p className="ui-hint">{fitReason}</p>}
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
 * status (or why they're locked out), the plan's limits, auto-renewal,
 * changing plan, the saved card, the plan picker when nothing is in force,
 * and billing history. Prices always come from the server (plan, code, free
 * trial, credit for a plan change) - this page never decides an amount. Card
 * details are never entered here: they go into Stripe Elements, on the
 * checkout step or in the card dialog. `?change=1` opens the plan options
 * (My Children links here when the plan is full).
 */
export default function ParentSubscriptionPage() {
  const navigate = useNavigate();
  const { refresh: refreshAccess } = useSubscriptionAccess();
  const { viewingChild } = useViewingChild();
  const [searchParams, setSearchParams] = useSearchParams();

  const overview = useApi(subscriptionService.getMySubscription);
  const payments = useApi(subscriptionService.listMyPayments);
  const plans = useApi(subscriptionService.listPlans);
  const paymentMethod = useApi(subscriptionService.getPaymentMethod);

  // Choosing a first plan.
  const [selectedPlan, setSelectedPlan] = useState(null);
  // Mirrors selectedPlan synchronously (setSelectedPlan itself only takes
  // effect on the next render) so an in-flight price request can tell, right
  // when its response lands, whether the user has since picked another plan.
  const selectedPlanRef = useRef(null);
  const [couponCode, setCouponCode] = useState('');
  const [baseQuote, setBaseQuote] = useState(null); // the plan without a code: trial, due today
  const [quote, setQuote] = useState(null); // with the applied code
  const [couponError, setCouponError] = useState(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);

  // Changing plan while subscribed (the account holder).
  const [changeOpen, setChangeOpen] = useState(() => searchParams.get('change') === '1');
  const [changeTarget, setChangeTarget] = useState(null);
  const changeTargetRef = useRef(null);
  const [changeQuote, setChangeQuote] = useState(null);
  const [changeQuoteError, setChangeQuoteError] = useState(null);
  const [startingChange, setStartingChange] = useState(false);

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
  // a checkout appends payment_intent, the card dialog and a free trial
  // append setup_intent (a trial also carries ?checkout=trial). Confirm once
  // (the server re-reads the intent from Stripe), then strip the params so a
  // refresh doesn't repeat it.
  const returnedIntent = searchParams.get('payment_intent');
  const returnedSetup = searchParams.get('setup_intent');
  const redirectStatus = searchParams.get('redirect_status');
  const trialReturn = searchParams.get('checkout') === 'trial';
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
            if (trialReturn) {
              await subscriptionService.confirmCheckout({ setupIntentId: returnedSetup });
              toast.success('Your free trial has started');
            } else {
              await subscriptionService.confirmSetupIntent(returnedSetup);
              toast.success('Card saved');
            }
          } catch (err) {
            toast.error(getErrorMessage(err));
          }
        } else {
          toast.error(
            trialReturn
              ? 'Your card was not saved, so the free trial has not started. Please try again.'
              : 'Your card was not saved. Please try again.'
          );
        }
      } else if (redirectStatus === 'succeeded') {
        try {
          await subscriptionService.confirmCheckout({ paymentIntentId: returnedIntent });
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
  }, [returnedIntent, returnedSetup, redirectStatus, trialReturn, load, setSearchParams, refreshAccess]);

  const current = overview.data?.subscription ?? null;
  const latest = overview.data?.latestSubscription ?? null;
  const access = overview.data?.access ?? null;
  const card = paymentMethod.data?.card ?? null;
  const hasSubscription = Boolean(current);

  // Extra parents share the account holder's plan, read-only: no plan picker,
  // renewal, cancel, change, card or billing history.
  const familyInfo = overview.data?.family ?? null;
  const isAccountHolder = familyInfo?.isAccountHolder !== false;
  const holderName = formatName(familyInfo?.accountHolder, { fallback: 'the account holder' });
  const lock = isAccountHolder
    ? lockMessage(access, latest)
    : access && !access.hasAccess
      ? `Your family's plan is not active. Ask ${holderName}, the account holder, to renew it.`
      : null;

  // ---- choosing a first plan

  /** The server's price for the selected plan with `code` (or none); undefined if the parent picked another plan meanwhile. */
  const priceSelected = async (plan, code) => {
    const { data } = await subscriptionService.validateCoupon({ planId: plan.id, code: code || null });
    return selectedPlanRef.current?.id === plan.id ? data : undefined;
  };

  const resetChoice = () => {
    selectedPlanRef.current = null;
    setSelectedPlan(null);
    setCouponCode('');
    setQuote(null);
    setBaseQuote(null);
    setCouponError(null);
  };

  const selectPlan = (plan) => {
    selectedPlanRef.current = plan;
    setSelectedPlan(plan);
    setQuote(null);
    setBaseQuote(null);
    setCouponError(null);
    // Trial and what's due today come from the server; until then the plan's own price shows.
    priceSelected(plan, null)
      .then((data) => data && setBaseQuote(data))
      .catch(() => {});
  };

  /** Applies the typed code. True when the new price is showing. */
  const applyCoupon = async () => {
    if (!selectedPlan) return false;
    const plan = selectedPlan;
    setCheckingCoupon(true);
    setCouponError(null);
    try {
      const data = await priceSelected(plan, couponCode.trim());
      if (data === undefined) return false;
      setQuote(data);
      if (couponCode.trim()) toast.success('Discount applied');
      return true;
    } catch (err) {
      if (selectedPlanRef.current?.id === plan.id) {
        setQuote(null);
        setCouponError(getErrorMessage(err));
      }
      return false;
    } finally {
      setCheckingCoupon(false);
    }
  };

  const shown = quote ?? baseQuote;
  const appliedCode = quote?.coupon?.code ?? null;
  const typedCode = couponCode.trim();
  const codePending = Boolean(typedCode) && typedCode.toLowerCase() !== (appliedCode ?? '').toLowerCase();
  const trialDays = shown?.trialDays ?? 0;
  const nothingToPay = Boolean(shown) && shown.total === 0;
  let checkoutLabel = 'Continue to payment';
  if (trialDays > 0) checkoutLabel = 'Start free trial';
  else if (nothingToPay) checkoutLabel = 'Start plan';

  const goToCheckout = async () => {
    if (!selectedPlan) return;
    // A code typed but not applied yet: apply it first, so the new total is
    // seen before anything is paid.
    if (codePending) {
      await applyCoupon();
      return;
    }
    setStartingCheckout(true);
    try {
      const { data } = await subscriptionService.startCheckout({ planId: selectedPlan.id, code: appliedCode });
      if (data.mode === 'none') {
        toast.success(`${selectedPlan.name} is active. There's nothing to pay.`, { title: 'Subscription active' });
        resetChoice();
        await reload();
        return;
      }
      // The client secret is handed to Stripe Elements on the next screen; it
      // is single-use and scoped to this one payment (or, for a free trial, to
      // saving the card). The saved card (if any) travels too, so checkout can
      // offer to use it.
      navigate('/parent/subscription/checkout', { state: { checkout: data, savedCard: card } });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStartingCheckout(false);
    }
  };

  // ---- changing plan

  const closeChange = () => {
    setChangeOpen(false);
    changeTargetRef.current = null;
    setChangeTarget(null);
    setChangeQuote(null);
    setChangeQuoteError(null);
  };

  const pickChange = (plan) => {
    changeTargetRef.current = plan;
    setChangeTarget(plan);
    setChangeQuote(null);
    setChangeQuoteError(null);
    subscriptionService
      .getPlanChangeQuote(plan.id)
      .then(({ data }) => changeTargetRef.current?.id === plan.id && setChangeQuote(data))
      .catch((err) => changeTargetRef.current?.id === plan.id && setChangeQuoteError(getErrorMessage(err)));
  };

  const confirmChange = async () => {
    if (!changeTarget || !changeQuote) return;
    setStartingChange(true);
    try {
      const { data } = await subscriptionService.startPlanChange(changeTarget.id);
      if (data.mode === 'none') {
        toast.success(`You're now on ${changeTarget.name}.`, { title: 'Plan changed' });
        closeChange();
        await reload();
        return;
      }
      navigate('/parent/subscription/checkout', { state: { checkout: data, savedCard: card } });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStartingChange(false);
    }
  };

  // ---- cancel and renewal

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

  if (overview.isLoading && !overview.data && plans.isLoading) {
    return <Loader message="Loading your subscription…" />;
  }

  const periodEnd = current?.currentPeriodEnd ? formatDate(current.currentPeriodEnd) : 'the end of the current period';
  const trialing = current?.status === 'trialing';
  let autoRenewDescription = '';
  if (current?.cancelledAt) {
    autoRenewDescription = `Cancelled on ${formatDate(current.cancelledAt)} - access ends ${periodEnd}. You can subscribe again once it ends.`;
  } else if (current?.autoRenew) {
    const when = trialing ? `Your free trial ends on ${periodEnd}, then your plan starts` : `Your plan renews on ${periodEnd}`;
    autoRenewDescription = card
      ? `On. ${when} and charges ${describeCard(card)}.`
      : `On. ${when} - add a card, or the payment will fail.`;
  } else if (current) {
    autoRenewDescription = `Off. Access ends ${periodEnd}. Turn it back on any time before then to keep your plan.`;
  }

  const allPayments = payments.data ?? [];
  const planStatus = current ? (PLAN_STATUS[current.status] ?? { label: formatStatus(current.status), variant: 'neutral' }) : null;
  // The free trial is for a family's first subscription (the server decides; this only hides the badge).
  const trialEligible = !latest;

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

      {/* Billing is per family, while most parent pages follow the child in the sidebar. */}
      <div className="sub-family" role="note">
        <LuUsersRound className="sub-family__icon" aria-hidden="true" />
        <span className="sub-family__title">Family account</span>
        <span className="sub-family__text">
          This page covers your whole family{viewingChild?.firstName ? `, not just ${viewingChild.firstName}` : ''}.
        </span>
      </div>

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
        // The plan and its card side by side (the mockup); an extra parent sees the plan alone.
        <div className={isAccountHolder ? 'sub-grid' : undefined}>
          <section className="sub-card" aria-labelledby="sub-plan-title">
            <div className="sub-plan__top">
              <div className="min-w-0">
                <h2 id="sub-plan-title" className="sub-plan__name">
                  {current.plan?.name}
                </h2>
                <p className="sub-plan__price">
                  {formatCurrency(current.plan?.price, current.plan?.currency)}
                  <span className="sub-plan__cycle">/ {per(current.plan)}</span>
                </p>
                <div className="sub-plan__badges">
                  <Badge variant={planStatus.variant} className="sub-badge">
                    {planStatus.label}
                  </Badge>
                  {current.cancelledAt ? (
                    <Badge variant="warning" className="sub-badge">
                      Cancelled
                    </Badge>
                  ) : (
                    !current.autoRenew && (
                      <Badge variant="warning" className="sub-badge">
                        Ends at period end
                      </Badge>
                    )
                  )}
                  {current.discountCode && (
                    <Badge variant="primary" className="sub-badge">
                      {current.discountCode.code}
                    </Badge>
                  )}
                </div>
                <p className="sub-card__subtitle">
                  {limitText(current.plan?.maxChildren, 'child', 'children')} ·{' '}
                  {limitText(current.plan?.maxParents, 'parent', 'parents')}
                </p>
              </div>

              <div className="sub-plan__when">
                <span className="sub-plan__when-label">
                  {!current.autoRenew ? 'Access ends' : trialing ? 'Trial ends' : 'Renews on'}
                </span>
                <span className="sub-plan__when-date">{current.currentPeriodEnd ? formatDate(current.currentPeriodEnd) : '—'}</span>
              </div>
            </div>

            {current.status === 'past_due' && (
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <Alert variant="warning">
                  We could not charge your saved card. We will try again over the next few days — update your card to
                  avoid losing access.
                </Alert>
              </div>
            )}

            {isAccountHolder && (
              <div className="sub-plan__renew">
                <button
                  type="button"
                  role="switch"
                  className="sub-switch"
                  aria-checked={Boolean(current.autoRenew)}
                  aria-labelledby="sub-renew-label"
                  aria-describedby="sub-renew-text"
                  disabled={Boolean(current.cancelledAt) || togglingAutoRenew}
                  onClick={() => (current.autoRenew ? setAutoRenewOffOpen(true) : changeAutoRenew(true))}
                />
                <div className="min-w-0">
                  <span id="sub-renew-label" className="sub-plan__renew-label">
                    Auto-renewal
                  </span>
                  <span id="sub-renew-text" className="sub-plan__renew-text">
                    {autoRenewDescription}
                  </span>
                </div>
              </div>
            )}

            {isAccountHolder && (
              <div className="sub-plan__actions">
                <Button variant="secondary" aria-expanded={changeOpen} onClick={changeOpen ? closeChange : () => setChangeOpen(true)}>
                  {changeOpen ? 'Close plan options' : 'Change plan'}
                </Button>
                {!current.cancelledAt && (
                  <Button variant="secondary" onClick={() => setCancelOpen(true)}>
                    Cancel subscription
                  </Button>
                )}
              </div>
            )}
          </section>

          {isAccountHolder && <PaymentMethodCard card={card} autoRenewing={Boolean(current.autoRenew)} onChanged={reload} />}
        </div>
      )}

      {hasSubscription && isAccountHolder && changeOpen && (
        <section className="sub-change" aria-label="Change plan">
          <SectionHeader
            title="Change plan"
            as="h2"
            description={
              trialing
                ? 'Your free trial carries on with the plan you choose.'
                : 'The new plan starts today. The unused part of what you paid for this period comes off the price.'
            }
          />
          <div className="sub-plans">
            {(plans.data ?? []).map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                current={plan.id === current.plan?.id}
                selected={changeTarget?.id === plan.id}
                onSelect={pickChange}
                fitReason={planFitReason(plan, familyInfo)}
                trialEligible={false}
              />
            ))}
          </div>

          {changeTarget && (
            <Card className="ui-field sub-change">
              <SectionHeader title={`Change to ${changeTarget.name}`} as="h3" />
              {changeQuoteError ? (
                <Alert variant="error">{changeQuoteError}</Alert>
              ) : !changeQuote ? (
                <Loader message="Working out the price…" />
              ) : (
                <>
                  <PriceSummary
                    currency={changeQuote.currency}
                    rows={[
                      { label: `${changeTarget.name} (per ${per(changeTarget)})`, value: changeQuote.subtotal },
                      changeQuote.discount > 0 && {
                        label: `Discount (${changeQuote.coupon?.code ?? 'code'})`,
                        value: changeQuote.discount,
                        saving: true,
                      },
                      changeQuote.credit > 0 && {
                        label: `Unused time on ${changeQuote.currentPlan?.name ?? 'your plan'}`,
                        value: changeQuote.credit,
                        saving: true,
                      },
                      { label: 'Due today', value: changeQuote.dueToday, total: true },
                    ]}
                  />
                  <p className="sub-note">
                    {changeQuote.trial
                      ? `Your free trial carries on until ${formatDate(changeQuote.periodEnd)}, then ${formatCurrency(changeQuote.total, changeQuote.currency)} a ${per(changeTarget)}.`
                      : `${changeTarget.name} starts today and renews on ${formatDate(changeQuote.periodEnd)} at ${formatCurrency(changeQuote.total, changeQuote.currency)} a ${per(changeTarget)}.`}
                    {!changeQuote.trial && changeQuote.credit > changeQuote.total && ' The rest of your credit adds time to the new plan.'}
                  </p>
                  {changeQuote.couponDropped && (
                    <p className="sub-note">
                      Your code {current.discountCode?.code} doesn't apply to {changeTarget.name}, so it won't carry over.
                    </p>
                  )}
                  <div style={{ marginTop: 'var(--spacing-lg)' }}>
                    <Button onClick={confirmChange} loading={startingChange}>
                      {changeQuote.dueToday > 0
                        ? `Pay ${formatCurrency(changeQuote.dueToday, changeQuote.currency)} and change plan`
                        : 'Change plan'}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          )}
        </section>
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
            <div className="sub-plans">
              {(plans.data ?? []).map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan?.id === plan.id}
                  onSelect={selectPlan}
                  fitReason={planFitReason(plan, familyInfo)}
                  trialEligible={trialEligible}
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

              <PriceSummary
                currency={selectedPlan.currency}
                rows={[
                  { label: 'Subtotal', value: shown?.subtotal ?? selectedPlan.price },
                  shown?.discount > 0 && {
                    label: `Discount${shown.coupon ? ` (${shown.coupon.code})` : ''}`,
                    value: shown.discount,
                    saving: true,
                  },
                  trialDays > 0 && { label: 'Free trial', text: `${trialDays} days` },
                  { label: 'Total due today', value: shown?.dueToday ?? selectedPlan.price, total: true },
                ]}
              />
              {trialDays > 0 && (
                <p className="sub-note">
                  Then {formatCurrency(shown.total, selectedPlan.currency)} a {per(selectedPlan)} from{' '}
                  {formatDate(shown.trialEndsAt)}. Your card is saved now and only charged when the trial ends - cancel
                  before then and you pay nothing.
                </p>
              )}
              {nothingToPay && <p className="sub-note">There's nothing to pay, so no card is needed.</p>}
              {codePending && !couponError && (
                <p className="sub-note">Your code is applied when you continue - you'll see the new total first.</p>
              )}

              <div style={{ marginTop: 'var(--spacing-lg)' }}>
                <Button onClick={goToCheckout} loading={startingCheckout || checkingCoupon}>
                  {checkoutLabel}
                </Button>
              </div>
            </Card>
          )}

          {/* Plans first when there's nothing in force - the card can also be added at checkout. */}
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <PaymentMethodCard card={card} autoRenewing={false} onChanged={reload} />
          </div>
        </>
      )}

      {isAccountHolder && (hasSubscription || allPayments.length > 0) && <BillingHistory payments={allPayments} />}

      <ConfirmationModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={submitCancel}
        loading={cancelling}
        variant="danger"
        title="Cancel your subscription?"
        confirmLabel="Cancel subscription"
        cancelLabel="Keep it"
        message={
          trialing
            ? `Your free trial carries on until ${periodEnd}, and you will not be charged. A cancellation can't be undone - you can subscribe again once it ends.`
            : `You will keep access until ${periodEnd}, and you will not be charged again. Unlike turning off auto-renewal, a cancellation can't be undone - you can subscribe again once it ends.`
        }
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
    </div>
  );
}
