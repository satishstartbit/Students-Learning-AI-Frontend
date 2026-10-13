import { useRef, useState } from 'react';
import { Modal, Button, Input, Select, Textarea, Checkbox, Alert, Loader, ErrorState, StatusBadge } from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { formatDate } from '../../../../utils/date';
import { formatCurrency, formatName, titleCase } from '../../../../utils/format';
import { getErrorMessage } from '../../../../utils/errorHandler';
import subscriptionService from '../../services/subscription.service';
import TransactionId from './TransactionId';
import { Rows, Section } from './DetailRows';
import {
  REFUND_REASON_OPTIONS,
  CONFIRM_WORD,
  amountText,
  cardLabel,
  confirmMatches,
  isFullRefund,
  newRequestKey,
  paymentStatusLabel,
  refundAmountProblem,
  refundReasonLabel,
  refundTaxSplit,
  refundableOf,
} from './adminBilling';
import './adminBilling.css';


const taxText = (lines, currency) =>
  lines.map((line) => `${formatCurrency(line.amount, currency)} ${line.name}${line.rate ? ` (${line.rate}%)` : ''}`).join(' + ');

/**
 * The refund dialog (Payments page, and "Refund unused time?" on
 * Subscriptions): everything about the payment in one place - who, the
 * original charge, the card (brand, last four, expiry - never more), what has
 * been refunded so far, where the money goes, the tax share - then the
 * refund itself, made safe:
 *   - a reason is required (reports group by it), a note is optional;
 *   - the button locks after one click and the request carries a key Stripe
 *     uses for idempotency, so a double click can't refund twice;
 *   - a full refund asks for REFUND (or the amount) to be typed, and whether
 *     to cancel the subscription (on by default - untick for a goodwill refund);
 *   - a plain line says what happens to the subscription.
 * Mount it with a `key` per opening so each opening gets a fresh request key.
 */
export default function RefundDialog({ paymentId, initialAmount = null, onClose, onDone }) {
  const detail = useApi(subscriptionService.adminGetPayment, { immediate: true, args: [paymentId] });
  const payment = detail.data;

  const [amount, setAmount] = useState(initialAmount != null ? amountText(initialAmount) : null);
  const [reasonCode, setReasonCode] = useState('');
  const [note, setNote] = useState('');
  const [cancelSubscription, setCancelSubscription] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // One key per opening: a retried request after a network error replays, never doubles.
  const [requestKey] = useState(newRequestKey);
  const sentRef = useRef(false);

  const currency = payment?.currency;
  const refundable = payment ? refundableOf(payment) : 0;
  const value = amount ?? (payment ? amountText(refundable) : '');
  const full = payment ? isFullRefund(payment, value) : false;
  const amountProblem = payment ? refundAmountProblem(value, payment) : null;
  const split = payment ? refundTaxSplit(payment, value) : { preTax: 0, tax: 0, lines: [] };
  const subscriptionInForce = Boolean(payment?.subscription?.inForce);
  const willCancel = full && cancelSubscription && subscriptionInForce;
  const confirmed = !full || confirmMatches(confirmText, value);
  const canRefund =
    payment &&
    payment.transactionType === 'payment' &&
    payment.status !== 'refunded' &&
    refundable > 0 &&
    Boolean(payment.stripePaymentIntentId);
  const ready = canRefund && !amountProblem && Boolean(reasonCode) && confirmed;

  const submit = async () => {
    setTouched(true);
    if (!ready || sentRef.current) return;
    sentRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const { data, message } = await subscriptionService.adminRefundPayment(paymentId, {
        amount: Number(value),
        reasonCode,
        note: note.trim() || null,
        requestKey,
        cancelSubscription,
      });
      const outcome = data?.refundOutcome ?? {};
      if (outcome.status === 'failed') toast.error(message || 'Stripe could not make this refund', { title: 'Refund failed' });
      else if (outcome.status === 'pending') toast.info(message || 'Stripe is still processing this refund.', { title: 'Refund pending' });
      else toast.success(message || 'Refund issued');
      onDone?.(data);
    } catch (err) {
      // Same key on the next try: if Stripe already refunded, it replays rather than refunds again.
      sentRef.current = false;
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const card = payment?.card ?? (payment?.cardLast4 ? { brand: payment.cardBrand, last4: payment.cardLast4 } : null);
  const effect = !subscriptionInForce
    ? 'Only the money goes back - this plan is no longer in force.'
    : willCancel
      ? 'The subscription will be cancelled now and access ends.'
      : 'The subscription keeps running.';

  return (
    <Modal
      isOpen
      onClose={submitting ? undefined : onClose}
      title="Refund a payment"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          {canRefund && (
            <Button variant="danger" onClick={submit} loading={submitting} disabled={submitting || (touched && !ready)}>
              Refund {formatCurrency(Number(value) || 0, currency)}
            </Button>
          )}
        </>
      }
    >
      {detail.isLoading && !payment ? (
        <Loader message="Loading the payment…" />
      ) : detail.error ? (
        <ErrorState error={detail.error} variant="compact" onRetry={() => detail.run(paymentId).catch(() => {})} />
      ) : payment ? (
        <div className="ab-refund">
          {error && <Alert variant="error">{error}</Alert>}

          <div className="ab-refund__grid">
            <Section title="Who">
              <Rows
                rows={[
                  ['Parent', formatName(payment.parent)],
                  ['Email', payment.parent?.email],
                  ['Plan', payment.planName ?? '—'],
                  ['Billing', payment.planBillingCycle ? titleCase(payment.planBillingCycle) : null],
                ]}
              />
            </Section>

            <Section title="Original payment">
              <Rows
                rows={[
                  ['Date', formatDate(payment.createdAt)],
                  ['Transaction', <TransactionId key="t" id={payment.stripePaymentIntentId} showLink={false} />],
                  ['Coupon discount', payment.discountApplied > 0 ? `−${formatCurrency(payment.discountApplied, currency)}` : null],
                  ['Before tax', payment.taxLines?.length ? formatCurrency(payment.preTaxAmount, currency) : null],
                  ['Tax', payment.taxLines?.length ? `${taxText(payment.taxLines, currency)}${payment.taxRegion ? ` · ${payment.taxRegion}` : ''}` : 'None'],
                  ['Amount paid', formatCurrency(payment.amount, currency), true],
                ]}
              />
            </Section>

            <Section title="Card">
              {card ? (
                <Rows
                  rows={[
                    ['Card', cardLabel(card, { expiry: false })],
                    ['Expires', card.expiryLabel ?? 'Not recorded'],
                  ]}
                />
              ) : (
                <p className="ui-hint" style={{ margin: 0 }}>No card is recorded on this payment.</p>
              )}
            </Section>

            <Section title="Refunded so far">
              <Rows
                rows={[
                  ['Already refunded', formatCurrency(payment.refundAmount ?? 0, currency)],
                  ['Still refundable', formatCurrency(refundable, currency), true],
                ]}
              />
              {payment.refunds?.length > 0 && (
                <ul className="ab-history" aria-label="Refunds made">
                  {payment.refunds.map((r) => (
                    <li key={r.id}>
                      <span>
                        {formatCurrency(r.amount, currency)}{' '}
                        <StatusBadge status={r.status === 'refunded' ? 'refunded' : r.status} label={paymentStatusLabel(r)} />
                      </span>
                      <span className="ab-history__meta">
                        {formatDate(r.createdAt)}
                        {r.refundReasonCode ? ` · ${refundReasonLabel(r.refundReasonCode)}` : ''}
                        {r.refundedByUser ? ` · by ${formatName(r.refundedByUser)}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          {!canRefund ? (
            <Alert variant="info">
              {payment.transactionType !== 'payment'
                ? 'Only a payment can be refunded.'
                : !payment.stripePaymentIntentId
                  ? 'This payment has no Stripe reference, so it cannot be refunded here.'
                  : 'Nothing is left to refund on this payment.'}
            </Alert>
          ) : (
            <>
              <div className="ab-refund__grid">
                <Input
                  label="Refund amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  max={refundable}
                  value={value}
                  onChange={(e) => setAmount(e.target.value)}
                  hint={`Up to ${formatCurrency(refundable, currency)}`}
                  error={touched || amount !== null ? amountProblem : null}
                  required
                />
                <Select
                  label="Reason"
                  options={REFUND_REASON_OPTIONS}
                  placeholder="Choose a reason"
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  error={touched && !reasonCode ? 'Choose a reason for this refund.' : null}
                  required
                />
              </div>
              <Textarea
                label="Note"
                optional
                rows={2}
                maxLength={500}
                placeholder="Anything the next person should know"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              <Section title="Where the money goes">
                <p className="ab-refund__money">
                  {card
                    ? `Back to ${cardLabel(card, { expiry: false })}. It can take about 5 to 10 business days to show on the parent’s statement.`
                    : 'Back to the card that paid. It can take about 5 to 10 business days to show on the parent’s statement.'}
                </p>
                <Rows
                  rows={[
                    ['Plan price', formatCurrency(split.preTax, currency)],
                    ['Tax', split.lines.length ? taxText(split.lines, currency) : payment.taxLines?.length ? formatCurrency(0, currency) : 'No tax on this payment'],
                    ['Refund', formatCurrency(Number(value) || 0, currency), true],
                  ]}
                />
              </Section>

              {full && subscriptionInForce && (
                <Checkbox
                  name="cancelSubscription"
                  label="Also cancel the subscription now"
                  description="Untick to refund as goodwill and keep the family subscribed."
                  checked={cancelSubscription}
                  onChange={(e) => setCancelSubscription(e.target.checked)}
                />
              )}

              {full && (
                <Input
                  label={`Type ${CONFIRM_WORD} or the amount to confirm a full refund`}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoComplete="off"
                  error={touched && !confirmed ? `Type ${CONFIRM_WORD} or ${amountText(value)} to confirm.` : null}
                />
              )}

              <Alert variant={willCancel ? 'warning' : 'info'} title={full ? 'Full refund' : 'Partial refund'}>
                <span className="ab-refund__effect">{effect}</span>
              </Alert>
            </>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
