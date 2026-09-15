import { useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { PageHeader, Card, Button, Alert, SectionHeader, Loader, Radio } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatCurrency } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/errorHandler';
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

function PaymentForm({ checkout, savedCard }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { refresh: refreshAccess } = useSubscriptionAccess();

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

    const returnUrl = `${window.location.origin}${RETURN_PATH}`;
    // Only leave the page when the card genuinely needs it (3-D Secure etc.).
    const { error: stripeError, paymentIntent } = useSaved
      ? await stripe.confirmPayment({
          clientSecret: checkout.clientSecret,
          redirect: 'if_required',
          confirmParams: { payment_method: savedCard.paymentMethodId, return_url: returnUrl },
        })
      : await stripe.confirmPayment({
          elements,
          redirect: 'if_required',
          confirmParams: { return_url: returnUrl },
        });

    if (stripeError) {
      // Card-level problems (declined, wrong CVC) carry a message meant for
      // the cardholder; anything else gets a generic line.
      setError(
        stripeError.type === 'card_error' || stripeError.type === 'validation_error'
          ? stripeError.message
          : 'We could not process your payment. Please try again.'
      );
      inFlight.current = false;
      setSubmitting(false);
      return;
    }

    try {
      if (paymentIntent?.status === 'succeeded') {
        await subscriptionService.confirmCheckout(paymentIntent.id);
        toast.success('Payment received — your subscription is active');
      } else {
        // `processing`: the webhook will activate it once the bank settles.
        toast.info('Payment is processing. Your subscription will activate shortly.');
      }
      // Unlock the rest of the parent area before leaving this page.
      await refreshAccess();
      navigate(RETURN_PATH, { replace: true });
    } catch (err) {
      // The charge went through; only the instant activation failed. The
      // webhook still activates it, so this is not a lost payment.
      setError(`${getErrorMessage(err)} Your payment was received — your subscription will appear shortly.`);
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
          label="Pay with"
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
          Pay {formatCurrency(checkout.amount, checkout.currency)}
        </Button>
      </div>
    </form>
  );
}

/**
 * /parent/subscription/checkout
 *
 * Reached only from the plan picker, which has already opened a PaymentIntent
 * server-side and priced it (plan + coupon) there - this page never decides
 * the amount. Refreshing loses the one-time client secret, so a direct visit
 * goes back to the picker rather than showing a dead form.
 */
export default function CheckoutPage() {
  const { state } = useLocation();
  const checkout = state?.checkout;
  const paymentMethod = useApi(subscriptionService.getPaymentMethod, { immediate: Boolean(checkout?.clientSecret) });
  const { stripe, failed: stripeFailed } = useStripeInstance(Boolean(checkout?.clientSecret));

  if (!checkout?.clientSecret) return <Navigate to={RETURN_PATH} replace />;

  // Prefer the fresh read; fall back to what the subscription page had.
  const savedCard = paymentMethod.data ? paymentMethod.data.card : (state?.savedCard ?? null);

  return (
    <>
      <PageHeader
        title="Payment"
        description="Your card is entered securely with Stripe and is never stored on our servers."
        breadcrumbs={[{ label: 'Subscription', to: RETURN_PATH }, { label: 'Payment' }]}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
          <div className="ui-hint">
            Billed {checkout.plan?.billingCycle === 'yearly' ? 'yearly' : 'monthly'}
          </div>

          <div style={{ marginTop: 'var(--spacing-md)', display: 'grid', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span>{formatCurrency(checkout.subtotal, checkout.currency)}</span>
            </div>
            {checkout.discount > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'var(--color-success-fg)',
                }}
              >
                <span>Discount{checkout.coupon ? ` (${checkout.coupon.code})` : ''}</span>
                <span>−{formatCurrency(checkout.discount, checkout.currency)}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                paddingTop: 'var(--spacing-sm)',
                borderTop: '1px solid var(--color-border-default)',
              }}
            >
              <span>Total due today</span>
              <span>{formatCurrency(checkout.amount, checkout.currency)}</span>
            </div>
          </div>

          <p className="ui-hint" style={{ marginTop: 'var(--spacing-md)' }}>
            Your subscription renews automatically each{' '}
            {checkout.plan?.billingCycle === 'yearly' ? 'year' : 'month'} with the card you pay with. You
            can turn off auto-renewal or cancel any time on the Subscription page and keep access until the
            end of the period you have paid for.
          </p>
        </Card>
      </div>
    </>
  );
}
