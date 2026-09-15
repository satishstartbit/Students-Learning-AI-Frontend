import { useEffect, useRef, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Alert, Button, Loader, Modal } from '../../../components/common';
import { getErrorMessage } from '../../../utils/errorHandler';
import subscriptionService from '../services/subscription.service';
import { STRIPE_LOAD_FAILED_MESSAGE, elementsOptions, paymentsConfigured, useStripeInstance } from '../stripe';

/** Where Stripe returns the browser if the card needs a bank authentication redirect. */
const RETURN_PATH = '/parent/subscription';

function CardForm({ onSaved, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || inFlight.current) return;

    inFlight.current = true;
    setSubmitting(true);
    setError(null);

    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
      confirmParams: { return_url: `${window.location.origin}${RETURN_PATH}` },
    });

    if (stripeError) {
      setError(
        stripeError.type === 'card_error' || stripeError.type === 'validation_error'
          ? stripeError.message
          : 'We could not save your card. Please try again.'
      );
    } else {
      try {
        // The server re-reads the SetupIntent from Stripe before saving anything.
        const { data } = await subscriptionService.confirmSetupIntent(setupIntent.id);
        await onSaved(data.card);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }

    inFlight.current = false;
    setSubmitting(false);
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
      <p className="ui-hint">
        Your card is entered securely with Stripe and is never stored on our servers. It won&apos;t be charged
        now.
      </p>
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} disabled={!stripe || !elements}>
          Save card
        </Button>
      </div>
    </form>
  );
}

/**
 * Add or replace the parent's saved card. Opens a SetupIntent, collects the
 * card in Stripe Elements (so card data goes browser -> Stripe only), then
 * asks the server to verify and save it. Replacing a card removes the old one
 * and points auto-renewal at the new one.
 */
export default function CardSetupModal({ isOpen, replacing = false, onClose, onSaved }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const { stripe, failed } = useStripeInstance(isOpen);

  useEffect(() => {
    if (!isOpen || !paymentsConfigured) return undefined;
    let cancelled = false;
    subscriptionService
      .createSetupIntent()
      .then(({ data }) => !cancelled && setClientSecret(data.clientSecret))
      .catch((err) => !cancelled && setError(getErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const close = () => {
    setClientSecret(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title={replacing ? 'Replace your card' : 'Add a card'}>
      {!paymentsConfigured ? (
        <Alert variant="warning">
          Online payments are not configured yet (VITE_STRIPE_PUBLISHABLE_KEY is missing).
        </Alert>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : failed ? (
        <Alert variant="error">{STRIPE_LOAD_FAILED_MESSAGE}</Alert>
      ) : !clientSecret || !stripe ? (
        <Loader message="Opening secure card form…" />
      ) : (
        <Elements stripe={stripe} options={elementsOptions(clientSecret)}>
          <CardForm
            onCancel={close}
            onSaved={async (card) => {
              await onSaved(card);
              close();
            }}
          />
        </Elements>
      )}
    </Modal>
  );
}
