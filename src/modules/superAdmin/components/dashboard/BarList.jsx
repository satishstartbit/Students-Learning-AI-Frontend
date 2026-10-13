import { formatNumber } from '../../../../utils/format';

/**
 * Horizontal bars for a few categories (subscriptions by status): label,
 * count and a bar scaled to the largest row. `rows`: [{ key, label, value,
 * className }].
 */
export default function BarList({ rows, label }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.value) || 0));
  return (
    <ul className="ad-barlist" aria-label={label}>
      {rows.map((r) => (
        <li key={r.key} className="ad-barlist__row">
          <span className="ad-barlist__label">{r.label}</span>
          <span className="ad-barlist__track" aria-hidden="true">
            <span className={`ad-barlist__fill ${r.className}`} style={{ width: `${((Number(r.value) || 0) / max) * 100}%` }} />
          </span>
          <span className="ad-barlist__value">{formatNumber(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}
