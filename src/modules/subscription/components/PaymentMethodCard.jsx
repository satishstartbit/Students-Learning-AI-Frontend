import { useState } from 'react';
import { Badge, Button, Card, ConfirmationModal } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import subscriptionService from '../services/subscription.service';
import { describeCard, formatCardExpiry } from '../stripe';
import CardSetupModal from './CardSetupModal';

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
 */
export default function PaymentMethodCard({ card, autoRenewing, onChanged, className }) {
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
    <Card title="Payment method" subtitle="The card used for your subscription and its renewals." className={className}>
      {card ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <span aria-hidden="true" style={{ fontSize: 22 }}>
              💳
            </span>
            <strong>{describeCard(card)}</strong>
            {formatCardExpiry(card) && <span className="ui-hint">Expires {formatCardExpiry(card)}</span>}
            {expired && <Badge variant="danger">Expired</Badge>}
            {autoRenewing && <Badge variant="primary">Used for auto-renewal</Badge>}
          </div>
          {expired && (
            <p className="ui-hint" style={{ color: 'var(--color-danger-fg)' }}>
              This card has expired - replace it so your subscription can renew.
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
            <Button variant="secondary" onClick={() => setSetupOpen(true)}>
              Replace card
            </Button>
            {!autoRenewing && (
              <Button variant="ghost" onClick={() => setRemoveOpen(true)}>
                Remove card
              </Button>
            )}
          </div>
          {autoRenewing && (
            <p className="ui-hint" style={{ marginBottom: 0 }}>
              To remove this card, replace it or turn off auto-renewal first.
            </p>
          )}
        </>
      ) : (
        <>
          <p style={{ marginTop: 0 }}>No card saved yet.</p>
          <Button onClick={() => setSetupOpen(true)}>Add card</Button>
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
    </Card>
  );
}
