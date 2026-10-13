import { useRef, useState } from 'react';
import { Pagination } from '../../../components/common';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { formatDate } from '../../../utils/date';
import { formatCurrency } from '../../../utils/format';
import PaymentStatusBadge from './PaymentStatusBadge';
import ReceiptModal from './ReceiptModal';


const discountText = (p) => (p.discountApplied > 0 ? `−${formatCurrency(p.discountApplied, p.currency)} discount` : null);
const refundText = (p) => (p.refundAmount > 0 ? `${formatCurrency(p.refundAmount, p.currency)} refunded` : null);

/**
 * Billing history, to its mockups: a table on wide screens (Receipt on each
 * row) and, on phones, one tappable row per payment that opens its receipt.
 *
 * Paged on the server (GET /subscriptions/me/payments?page=&limit=): `payments`
 * is the current page, `meta` its { page, totalPages, total, limit }, and
 * `onPageChange(page)` asks the parent page for another one.
 */
export default function BillingHistory({ payments = [], meta = null, loading = false, onPageChange }) {
  const [receipt, setReceipt] = useState(null);
  const isPhone = useIsMobile(640);
  const top = useRef(null);

  const visible = payments;
  const page = meta?.page ?? 1;
  const limit = meta?.limit ?? (payments.length || 1);
  const total = meta?.total ?? payments.length;
  const totalPages = meta?.totalPages ?? 1;
  const goTo = (next) => {
    onPageChange?.(Math.min(Math.max(1, next), Math.max(1, totalPages)));
    top.current?.scrollIntoView({ block: 'nearest' });
  };

  return (
    <section ref={top} className="sub-card sub-history" aria-labelledby="sub-history-title" aria-busy={loading || undefined}>
      <h2 id="sub-history-title" className="sub-card__title sub-history__title">
        Billing history
      </h2>

      {total === 0 ? (
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

      <Pagination
        className="sub-history__pages"
        page={page}
        totalPages={totalPages}
        total={total}
        from={(page - 1) * limit + 1}
        to={(page - 1) * limit + payments.length}
        onPageChange={goTo}
      />

      {receipt && <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />}
    </section>
  );
}
