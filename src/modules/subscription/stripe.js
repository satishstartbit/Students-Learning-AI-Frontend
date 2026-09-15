import { useEffect, useState } from 'react';
// The /pure entry: the main entry injects Stripe.js as soon as it's imported.
import { loadStripe } from '@stripe/stripe-js/pure';
import { getActiveLocale } from '../../utils/locale';

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

/** False when the publishable key isn't configured, so callers can show a clear message. */
export const paymentsConfigured = Boolean(PUBLISHABLE_KEY);

let stripeLoad = null;

/**
 * One Stripe.js instance for the whole app (Checkout and the saved-card form) -
 * Stripe warns against creating it per render or per page. Loaded on first use
 * rather than at startup, so pages that never take a card don't fetch it. A
 * failed load (offline, a content blocker) isn't cached, so the next attempt
 * retries.
 */
export function getStripe() {
  if (!paymentsConfigured) return Promise.resolve(null);
  if (!stripeLoad) {
    stripeLoad = loadStripe(PUBLISHABLE_KEY).catch((error) => {
      stripeLoad = null;
      throw error;
    });
  }
  return stripeLoad;
}

/**
 * The Stripe instance for a card form: `{ stripe, failed }`. Starts loading
 * once `enabled` is true; `failed` means Stripe.js couldn't be loaded.
 */
export function useStripeInstance(enabled = true) {
  const [state, setState] = useState({ stripe: null, failed: false });

  useEffect(() => {
    if (!enabled || !paymentsConfigured) return undefined;
    let cancelled = false;
    getStripe()
      .then((stripe) => !cancelled && setState({ stripe, failed: !stripe }))
      .catch(() => !cancelled && setState({ stripe: null, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}

/** Shown when Stripe.js itself couldn't be loaded. */
export const STRIPE_LOAD_FAILED_MESSAGE =
  "We couldn't load the secure card form. Check your internet connection (or pause any content blocker for this site) and try again.";

/** Elements options shared by every Stripe form in the app. */
export const elementsOptions = (clientSecret) => ({
  clientSecret,
  locale: getActiveLocale().split('-')[0] === 'fr' ? 'fr-CA' : 'en',
  appearance: { theme: 'stripe' },
});

/** "Visa •••• 4242" */
export function describeCard(card) {
  if (!card) return '';
  const brand = card.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : 'Card';
  return `${brand} •••• ${card.last4 ?? '????'}`;
}

/** "12/2034" */
export const formatCardExpiry = (card) =>
  card?.expMonth && card?.expYear ? `${String(card.expMonth).padStart(2, '0')}/${card.expYear}` : '';
