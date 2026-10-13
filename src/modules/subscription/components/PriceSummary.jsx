import { formatCurrency } from '../../../utils/format';

/**
 * Price lines for checkout, a free trial and a plan change, as a <dl>.
 * Each row: `{ label, value }` (an amount), or `text` instead of an amount;
 * `saving` (shown as "−amount" in the success colour) and `total` (the bold
 * last line). Falsy rows are skipped, so callers can write `cond && {...}`.
 */
export default function PriceSummary({ rows, currency }) {
  return (
    <dl className="sub-summary">
      {rows.filter(Boolean).map((row) => (
        <div
          key={row.label}
          className={['sub-summary__row', row.saving && 'sub-summary__row--saving', row.total && 'sub-summary__total']
            .filter(Boolean)
            .join(' ')}
        >
          <dt>{row.label}</dt>
          <dd>{row.text ?? `${row.saving ? '−' : ''}${formatCurrency(row.value, currency)}`}</dd>
        </div>
      ))}
    </dl>
  );
}
