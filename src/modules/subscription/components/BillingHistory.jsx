import { useState } from 'react';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { formatDate } from '../../../utils/date';
import { formatCurrency } from '../../../utils/format';
import PaymentStatusBadge from './PaymentStatusBadge';
import ReceiptModal from './ReceiptModal';

/** Newest first; the rest one "Show older payments" at a time. */
const PAGE_SIZE = 7;

const discountText = (p) => (p.discountApplied > 0 ? `−${formatCurrency(p.discountApplied, p.currency)} discount` : null);
const refundText = (p) => (p.refundAmount > 0 ? `${formatCurrency(p.refundAmount, p.currency)} refunded` : null);

/**
 * Billing history, to its mockups: a table on wide screens (Receipt on each
 * row) and, on phones, one tappable row per payment that opens its receipt.
 */
export default function BillingHistory({ payments = [] }) {
  const [shown, setShown] = useState(PAGE_SIZE);
  const [receipt, setReceipt] = useState(null);
  const isPhone = useIsMobile(640);

  const visible = payments.slice(0, shown);
  const hasOlder = payments.length > shown;

  return (
    <section className="sub-card sub-history" aria-labelledby="sub-history-title">
      <h2 id="sub-history-title" className="sub-card__title sub-history__title">
        Billing history
      </h2>

      {payments.length === 0 ? (
        <p className="sub-note">No payments yet.</p>
      ) : isPhone ? (
        <ul className="sub-paylist">
          {visible.map((p) => {
            const extra = [discountText(p), refundText(p)].filter(Boolean).join(' · ');
            return (
              <li key={p.id} className="sub-paylist__item">
                <button
                  type="button"
                  className="sub-payrow"
                  aria-label={`Receipt: ${p.planName ?? 'Payment'}, ${formatDate(p.createdAt)}, ${formatCurrency(p.amount, p.currency)}`}
                  onClick={() => setReceipt(p)}
                >
                  <span className="sub-payrow__main">
                    <span className="sub-payrow__plan">{p.planName ?? '—'}</span>
                    <span className="sub-sub">{formatDate(p.createdAt)}</span>
                    {extra && <span className="sub-sub">{extra}</span>}
                  </span>
                  <span className="sub-payrow__side">
                    <span className="sub-payrow__amount">{formatCurrency(p.amount, p.currency)}</span>
                    <PaymentStatusBadge status={p.status} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <table className="sub-table">
          <caption className="sr-only">Billing history</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Plan</th>
              <th scope="col" className="sub-num">
                Amount
              </th>
              <th scope="col">Status</th>
              <th scope="col" className="sub-end">
                <span className="sr-only">Receipt</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id}>
                <td>{formatDate(p.createdAt)}</td>
                <td>{p.planName ?? '—'}</td>
                <td className="sub-num">
                  {formatCurrency(p.amount, p.currency)}
                  {discountText(p) && <span className="sub-sub">{discountText(p)}</span>}
                </td>
                <td>
                  <PaymentStatusBadge status={p.status} />
                  {refundText(p) && <span className="sub-sub">{refundText(p)}</span>}
                </td>
                <td className="sub-end">
                  <button
                    type="button"
                    className="sub-linkbtn"
                    aria-label={`Receipt for ${p.planName ?? 'payment'}, ${formatDate(p.createdAt)}`}
                    onClick={() => setReceipt(p)}
                  >
                    Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {hasOlder && (
        <div className="sub-more">
          <button type="button" className="sub-linkbtn" onClick={() => setShown((n) => n + PAGE_SIZE)}>
            Show older payments
          </button>
        </div>
      )}

      {receipt && <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />}
    </section>
  );
}
