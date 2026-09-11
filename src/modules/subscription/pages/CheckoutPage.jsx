import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { PageHeader, Card, Button, Alert, SectionHeader } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { formatCurrency } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/errorHandler';
import { getActiveLocale } from '../../../utils/locale';
import subscriptionService from '../services/subscription.service';

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Created once per page load - Stripe warns against re-creating it per render.
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

/** Where Stripe sends the browser back after a 3-D Secure / bank redirect. */
const RETURN_PATH = '/parent/subscription';

function PaymentForm({ checkout }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      // Only leave the page when the card genuinely needs it (3-D Secure etc.).
      redirect: 'if_required',
      confirmParams: { return_url: `${window.location.origin}${RETURN_PATH}` },
    });

    if (stripeError) {
      // Card-level problems (declined, wrong CVC) carry a message meant for
      // the cardholder; anything else gets a generic line.
      setError(
        stripeError.type === 'card_error' || stripeError.type === 'validation_error'
          ? stripeError.message
          : 'We could not process your payment. Please try again.'
      );
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
      navigate(RETURN_PATH, { replace: true });
    } catch (err) {
      // The charge went through; only the instant activation failed. The
      // webhook still activates it, so this is not a lost payment.
      setError(
        `${getErrorMessage(err)} Your payment was received — your subscription will appear shortly.`
      );
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

      <div className="ui-field">
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

  if (!checkout?.clientSecret) return <Navigate to={RETURN_PATH} replace />;

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
          {stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: checkout.clientSecret,
                locale: getActiveLocale().split('-')[0] === 'fr' ? 'fr-CA' : 'en',
                appearance: { theme: 'stripe' },
              }}
            >
              <PaymentForm checkout={checkout} />
            </Elements>
          ) : (
            <Alert variant="warning">
              Online payments are not configured yet (VITE_STRIPE_PUBLISHABLE_KEY is missing). Please
              contact support to complete your subscription.
            </Alert>
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
            {checkout.plan?.billingCycle === 'yearly' ? 'year' : 'month'} until you cancel. You can
            cancel any time and keep access until the end of the period you have paid for.
          </p>
        </Card>
      </div>
    </>
  );
}
