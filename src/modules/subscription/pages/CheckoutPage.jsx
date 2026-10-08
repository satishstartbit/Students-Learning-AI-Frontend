import { useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { PageHeader, Card, Button, Alert, SectionHeader, Loader, Radio } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatDate } from '../../../utils/date';
import { formatCurrency } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/errorHandler';
import PriceSummary from '../components/PriceSummary';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';
import subscriptionService from '../services/subscription.service';
import {
  STRIPE_LOAD_FAILED_MESSAGE,
  describeCard,
  elementsOptions,
  formatCardExpiry,
  paymentsConfigured,
  useStripeInstance,
} from '../stripe';

/** Where Stripe sends the browser back after a 3-D Secure / bank redirect. */
const RETURN_PATH = '/parent/subscription';

const per = (plan) => (plan?.billingCycle === 'yearly' ? 'year' : 'month');

/**
 * What this checkout is: a free trial (`mode: 'setup'` - the card is saved,
 * not charged), a plan change (it carries a `credit`), or a first payment.
 */
const kindOf = (checkout) => (checkout.mode === 'setup' ? 'trial' : checkout.credit != null ? 'change' : 'payment');

function PaymentForm({ checkout, savedCard }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { refresh: refreshAccess } = useSubscriptionAccess();
  const kind = kindOf(checkout);
  const trial = kind === 'trial';

  // Default to the card already on file; "new" shows the card form.
  const [method, setMethod] = useState(savedCard ? 'saved' : 'new');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const useSaved = Boolean(savedCard) && method === 'saved';

  const submit = async (event) => {
    event.preventDefault();
    if (!stripe || (!useSaved && !elements) || inFlight.current) return;

    inFlight.current = true;
    setSubmitting(true);
    setError(null);

    // A trial's redirect back says so, so the page starts the trial rather than just saving a card.
    const returnUrl = `${window.location.origin}${RETURN_PATH}${trial ? '?checkout=trial' : ''}`;
    // Only leave the page when the card genuinely needs it (3-D Secure etc.).
    // A free trial saves the card (SetupIntent) - nothing is charged now.
    const confirm = trial ? stripe.confirmSetup.bind(stripe) : stripe.confirmPayment.bind(stripe);
    const result = useSaved
      ? await confirm({
          clientSecret: checkout.clientSecret,
          redirect: 'if_required',
          confirmParams: { payment_method: savedCard.paymentMethodId, return_url: returnUrl },
        })
      : await confirm({
          elements,
          redirect: 'if_required',
          confirmParams: { return_url: returnUrl },
        });
    const { error: stripeError } = result;
    const intent = trial ? result.setupIntent : result.paymentIntent;

    if (stripeError) {
      // Card-level problems (declined, wrong CVC) carry a message meant for
      // the cardholder; anything else gets a generic line.
      setError(
        stripeError.type === 'card_error' || stripeError.type === 'validation_error'
          ? stripeError.message
          : trial
            ? 'We could not save your card. Please try again.'
            : 'We could not process your payment. Please try again.'
      );
      inFlight.current = false;
      setSubmitting(false);
      return;
    }

    try {
      if (intent?.status === 'succeeded') {
        await subscriptionService.confirmCheckout(trial ? { setupIntentId: intent.id } : { paymentIntentId: intent.id });
        if (trial) toast.success('Your card is saved and nothing was charged.', { title: 'Your free trial has started' });
        else if (kind === 'change') toast.success(`You're now on ${checkout.plan?.name}.`, { title: 'Plan changed' });
        else toast.success('Payment received — your subscription is active');
      } else {
        // `processing`: the webhook will activate it once the bank settles.
        toast.info('Payment is processing. Your subscription will activate shortly.');
      }
      // Unlock the rest of the parent area before leaving this page.
      await refreshAccess();
      navigate(RETURN_PATH, { replace: true });
    } catch (err) {
      // Stripe has the card (or the payment); only the instant activation
      // failed. The webhook still activates it, so nothing is lost.
      setError(
        `${getErrorMessage(err)} ${trial ? 'Your card was saved - your trial will appear shortly.' : 'Your payment was received — your subscription will appear shortly.'}`
      );
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}

      {savedCard && (
        <Radio
          name="payment-method"
          label={trial ? 'Card for when the trial ends' : 'Pay with'}
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          disabled={submitting}
          options={[
            {
              value: 'saved',
              label: describeCard(savedCard),
              description: formatCardExpiry(savedCard) ? `Expires ${formatCardExpiry(savedCard)}` : undefined,
            },
            {
              value: 'new',
              label: 'A different card',
              description: 'It replaces your saved card for future renewals.',
            },
          ]}
        />
      )}

      {/* Kept mounted (just hidden) so switching back and forth doesn't lose what was typed.
          Inline display, since .ui-field's own display would beat the hidden attribute. */}
      <div className="ui-field" style={useSaved ? { display: 'none' } : undefined}>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
        <Button as={Link} to={RETURN_PATH} variant="secondary" aria-disabled={submitting}>
          Back
        </Button>
        <Button type="submit" loading={submitting} disabled={!stripe || !elements}>
          {trial ? 'Start free trial' : `Pay ${formatCurrency(checkout.amount, checkout.currency)}`}
        </Button>
      </div>
    </form>
  );
}

/**
 * /parent/subscription/checkout
 *
 * Reached only from the Subscription page, which has already opened the
 * intent server-side and priced it there (plan, code, free trial, credit for
 * a plan change) - this page never decides the amount. Three kinds: a first
 * payment, a free trial (the card is saved, not charged) and a plan change.
 * Refreshing loses the one-time client secret, so a direct visit goes back
 * to the Subscription page rather than showing a dead form.
 */
export default function CheckoutPage() {
  const { state } = useLocation();
  const checkout = state?.checkout;
  const paymentMethod = useApi(subscriptionService.getPaymentMethod, { immediate: Boolean(checkout?.clientSecret) });
  const { stripe, failed: stripeFailed } = useStripeInstance(Boolean(checkout?.clientSecret));

  if (!checkout?.clientSecret) return <Navigate to={RETURN_PATH} replace />;

  // Prefer the fresh read; fall back to what the subscription page had.
  const savedCard = paymentMethod.data ? paymentMethod.data.card : (state?.savedCard ?? null);
  const kind = kindOf(checkout);
  const cycle = per(checkout.plan);
  const title = kind === 'trial' ? 'Start your free trial' : kind === 'change' ? 'Change plan' : 'Payment';

  return (
    <div className="td-page">
      <PageHeader
        title={title}
        description={
          kind === 'trial'
            ? 'Your card is saved securely with Stripe and is not charged until the trial ends.'
            : 'Your card is entered securely with Stripe and is never stored on our servers.'
        }
        breadcrumbs={[{ label: 'Subscription', to: RETURN_PATH }, { label: title }]}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
          gap: 'var(--spacing-lg)',
          alignItems: 'start',
        }}
      >
        <Card>
          <SectionHeader title="Card details" as="h3" />
          {!paymentsConfigured ? (
            <Alert variant="warning">
              Online payments are not configured yet (VITE_STRIPE_PUBLISHABLE_KEY is missing). Please
              contact support to complete your subscription.
            </Alert>
          ) : stripeFailed ? (
            <Alert variant="error">{STRIPE_LOAD_FAILED_MESSAGE}</Alert>
          ) : !stripe || (paymentMethod.isLoading && !paymentMethod.data) ? (
            <Loader message="Loading payment options…" />
          ) : (
            <Elements stripe={stripe} options={elementsOptions(checkout.clientSecret)}>
              <PaymentForm checkout={checkout} savedCard={savedCard} />
            </Elements>
          )}
        </Card>

        <Card>
          <SectionHeader title="Order summary" as="h3" />
          <div style={{ fontWeight: 600 }}>{checkout.plan?.name}</div>
          <div className="ui-hint">Billed {cycle === 'year' ? 'yearly' : 'monthly'}</div>

          <PriceSummary
            currency={checkout.currency}
            rows={[
              { label: kind === 'change' ? `${checkout.plan?.name} (per ${cycle})` : 'Subtotal', value: checkout.subtotal },
              checkout.discount > 0 && {
                label: `Discount${checkout.coupon ? ` (${checkout.coupon.code})` : ''}`,
                value: checkout.discount,
                saving: true,
              },
              kind === 'change' &&
                checkout.credit > 0 && {
                  label: `Unused time on ${checkout.currentPlan?.name ?? 'your plan'}`,
                  value: checkout.credit,
                  saving: true,
                },
              kind === 'trial' && { label: 'Free trial', text: `${checkout.trialDays} days` },
              { label: 'Total due today', value: checkout.amount, total: true },
            ]}
          />

          <p className="ui-hint" style={{ marginTop: 'var(--spacing-md)' }}>
            {kind === 'trial' &&
              `When the trial ends on ${formatDate(checkout.trialEndsAt)}, this card is charged ${formatCurrency(checkout.total, checkout.currency)} and the plan renews each ${cycle}. Cancel any time before then and you won't be charged.`}
            {kind === 'change' &&
              `${checkout.plan?.name} starts today and renews on ${formatDate(checkout.periodEnd)} with the card you pay with. You can turn off auto-renewal or cancel any time on the Subscription page.`}
            {kind === 'payment' &&
              `Your subscription renews automatically each ${cycle} with the card you pay with. You can turn off auto-renewal or cancel any time on the Subscription page and keep access until the end of the period you have paid for.`}
          </p>
        </Card>
      </div>
    </div>
  );
}
