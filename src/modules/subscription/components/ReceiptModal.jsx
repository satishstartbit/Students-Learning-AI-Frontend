import { useEffect } from 'react';
import { Button, Modal } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { APP_NAME } from '../../../utils/constants';
import { formatDate, formatDateTime } from '../../../utils/date';
import { formatCurrency, formatName } from '../../../utils/format';
import { describeCard } from '../stripe';
import PaymentStatusBadge from './PaymentStatusBadge';
import { paymentStatusLabel } from './paymentStatus';
import { formatRate } from './taxRows';

/**
 * A receipt for one billing-history row, from the payment the page already
 * has (`/subscriptions/me/payments`) - nothing extra is fetched. Print prints
 * just this dialog (subscription.css `body.sub-printing`).
 */
export default function ReceiptModal({ payment, onClose }) {
  const { user } = useAuth();

  // Drop the print class however printing ends (Print → dialog → Cancel too).
  useEffect(() => {
    const done = () => document.body.classList.remove('sub-printing');
    window.addEventListener('afterprint', done);
    return () => {
      window.removeEventListener('afterprint', done);
      done();
    };
  }, []);

  if (!payment) return null;

  const currency = payment.currency;
  const discount = payment.discountApplied > 0 ? payment.discountApplied : 0;
  // Sales tax (when this charge had any): the price before tax, then each tax.
  const taxLines = payment.taxLines ?? [];
  const beforeTax = payment.preTaxAmount ?? payment.amount;
  // CRA receipt details: the seller's name and its GST/HST (and QST/PST) numbers.
  const taxNumbers = payment.taxNumbers ?? (payment.taxNumber ? [{ label: 'GST/HST number', number: payment.taxNumber }] : []);
  const charged = payment.status !== 'failed' && payment.status !== 'pending';
  const card = payment.cardLast4 ? describeCard({ brand: payment.cardBrand, last4: payment.cardLast4 }) : null;
  const billedTo = [formatName(user), user?.email].filter(Boolean).join(' · ');

  const print = () => {
    document.body.classList.add('sub-printing');
    window.print();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Receipt"
      description={`${payment.planName ?? 'Subscription'} · ${formatDate(payment.processedAt ?? payment.createdAt)}`}
      size="sm"
      className="sub-receipt"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={print}>Print</Button>
        </>
      }
    >
      <div className="sub-receipt__head">
        <div>
          <p className="sub-receipt__brand">{payment.seller || APP_NAME}</p>
          {billedTo && <span className="sub-sub">Billed to {billedTo}</span>}
        </div>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <dl className="sub-receipt__rows">
        <div className="sub-receipt__row">
          <dt>Plan</dt>
          <dd>{payment.planName ?? '—'}</dd>
        </div>
        <div className="sub-receipt__row">
          <dt>Date</dt>
          <dd>{formatDateTime(payment.processedAt ?? payment.createdAt)}</dd>
        </div>
        {card && (
          <div className="sub-receipt__row">
            <dt>Paid with</dt>
            <dd>{card}</dd>
          </div>
        )}
        {discount > 0 && (
          <>
            <div className="sub-receipt__row">
              <dt>Price</dt>
              <dd>{formatCurrency(beforeTax + discount, currency)}</dd>
            </div>
            <div className="sub-receipt__row">
              <dt>Discount</dt>
              <dd>−{formatCurrency(discount, currency)}</dd>
            </div>
          </>
        )}
        {taxLines.length > 0 && (
          <>
            <div className="sub-receipt__row">
              <dt>Before tax</dt>
              <dd>{formatCurrency(beforeTax, currency)}</dd>
            </div>
            {taxLines.map((line) => (
              <div key={line.name} className="sub-receipt__row">
                <dt>{`${line.name} (${formatRate(line.rate)}%)`}</dt>
                <dd>{formatCurrency(line.amount, currency)}</dd>
              </div>
            ))}
          </>
        )}
        <div className="sub-receipt__row sub-receipt__total">
          <dt>{charged ? 'Total paid' : 'Amount'}</dt>
          <dd>{formatCurrency(payment.amount, currency)}</dd>
        </div>
        {payment.refundAmount > 0 && (
          <div className="sub-receipt__row">
            <dt>Refunded</dt>
            <dd>−{formatCurrency(payment.refundAmount, currency)}</dd>
          </div>
        )}
        {!charged && (
          <div className="sub-receipt__row">
            <dt>Status</dt>
            <dd>
              {paymentStatusLabel(payment.status)}
              {payment.failureReason ? ` - ${payment.failureReason}` : ''}.{' '}
              {payment.status === 'failed' ? 'Nothing was charged.' : 'Not charged yet.'}
            </dd>
          </div>
        )}
        {taxLines.length > 0 &&
          taxNumbers.map((t) => (
            <div key={t.label} className="sub-receipt__row">
              <dt>{t.label}</dt>
              <dd>{t.number}</dd>
            </div>
          ))}
        <div className="sub-receipt__row">
          <dt>Reference</dt>
          <dd>{payment.id}</dd>
        </div>
      </dl>
    </Modal>
  );
}
