import { useState } from 'react';
import { LuCreditCard } from 'react-icons/lu';
import { Badge, Button, ConfirmationModal } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import subscriptionService from '../services/subscription.service';
import { describeCard, formatCardExpiry } from '../stripe';
import CardSetupModal from './CardSetupModal';
import './subscription.css';

/** True when a card's expiry month has already passed. */
function isExpired(card) {
  if (!card?.expMonth || !card?.expYear) return false;
  const now = new Date();
  return card.expYear < now.getFullYear() || (card.expYear === now.getFullYear() && card.expMonth < now.getMonth() + 1);
}

/**
 * The parent's saved card: shows it, and lets them add, replace or remove it.
 * Removing is blocked by the server while auto-renewal depends on the card;
 * the button is hidden in that case too, with the reason shown instead.
 * Laid out as the Subscription mockup's "Payment method" card.
 */
export default function PaymentMethodCard({ card, autoRenewing, onChanged, className = '' }) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const remove = async () => {
    setRemoving(true);
    try {
      await subscriptionService.removePaymentMethod();
      toast.success('Card removed');
      setRemoveOpen(false);
      await onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  const expired = isExpired(card);

  return (
    <section className={`sub-card ${className}`.trim()} aria-labelledby="sub-payment-title">
      <h2 id="sub-payment-title" className="sub-card__title">
        Payment method
      </h2>
      <p className="sub-card__subtitle">The card used for your plan and its renewals.</p>

      {card ? (
        <>
          <div className="sub-cardbox">
            <LuCreditCard className="sub-cardbox__icon" aria-hidden="true" />
            <div className="sub-cardbox__body">
              <span className="sub-cardbox__name">{describeCard(card)}</span>
              {formatCardExpiry(card) && <span className="sub-cardbox__meta">Expires {formatCardExpiry(card)}</span>}
            </div>
            <div className="sub-cardbox__badges">
              {expired && (
                <Badge variant="danger" className="sub-badge">
                  Expired
                </Badge>
              )}
              {autoRenewing && (
                <Badge variant="primary" className="sub-badge">
                  Auto-renewal
                </Badge>
              )}
            </div>
          </div>
          {expired && (
            <p className="sub-note" style={{ color: 'var(--color-danger-fg)' }}>
              This card has expired - replace it so your subscription can renew.
            </p>
          )}
          <div className="sub-cardbox__actions">
            <Button variant="secondary" onClick={() => setSetupOpen(true)}>
              Replace card
            </Button>
            {!autoRenewing && (
              <Button variant="ghost" onClick={() => setRemoveOpen(true)}>
                Remove card
              </Button>
            )}
          </div>
          <p className="sub-note">
            {autoRenewing && 'To remove this card, replace it or turn off auto-renewal first. '}
            Card details are handled securely by Stripe.
          </p>
        </>
      ) : (
        <>
          <div className="sub-cardbox">
            <LuCreditCard className="sub-cardbox__icon" aria-hidden="true" />
            <div className="sub-cardbox__body">
              <span className="sub-cardbox__name">No card saved yet</span>
              <span className="sub-cardbox__meta">Add one for your plan&apos;s renewals.</span>
            </div>
          </div>
          <div className="sub-cardbox__actions">
            <Button onClick={() => setSetupOpen(true)}>Add card</Button>
          </div>
          <p className="sub-note">Card details are handled securely by Stripe.</p>
        </>
      )}

      <CardSetupModal
        isOpen={setupOpen}
        replacing={Boolean(card)}
        onClose={() => setSetupOpen(false)}
        onSaved={async () => {
          toast.success(card ? 'Card replaced' : 'Card saved');
          await onChanged();
        }}
      />

      <ConfirmationModal
        isOpen={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={remove}
        loading={removing}
        variant="danger"
        title="Remove this card?"
        message={`${describeCard(card)} will be removed from your account. You'll need to add a card again before auto-renewal or your next payment.`}
        confirmLabel="Remove card"
        cancelLabel="Keep it"
      />
    </section>
  );
}
