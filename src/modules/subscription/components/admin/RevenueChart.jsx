import { useState } from 'react';
import { formatDateKey, addDaysToKey } from '../../../../utils/date';
import { formatCurrency } from '../../../../utils/format';
import './adminBilling.css';

const W = 720;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 56 };

/** "Oct 1", "Oct 12 – 18" (a week), "Oct 2026" (a month). */
function bucketLabel(key, granularity, { long = false } = {}) {
  if (granularity === 'month') return formatDateKey(`${key}-01`, { month: long ? 'long' : 'short', year: long ? 'numeric' : '2-digit', day: undefined });
  if (granularity === 'week') {
    const start = formatDateKey(key, { month: 'short', day: 'numeric', year: undefined });
    return long ? `Week of ${start} – ${formatDateKey(addDaysToKey(key, 6), { month: 'short', day: 'numeric' })}` : start;
  }
  return formatDateKey(key, { month: 'short', day: 'numeric', ...(long ? { weekday: 'short' } : { year: undefined }) });
}

/**
 * Revenue over time as bars: net (accent) with the refunded part on top, so
 * the whole bar is gross. Each bar can be focused or hovered for its figures;
 * a hidden table carries the same numbers for screen readers. Colours are
 * tokens (adminBilling.css), so dark mode and accents follow.
 */
export default function RevenueChart({ series, currency }) {
  const points = series?.points ?? [];
  const [active, setActive] = useState(null);
  if (!points.length) return <p className="ui-hint">No charges in this period.</p>;

  const max = Math.max(...points.map((p) => p.gross), 0) || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / points.length;
  const barW = Math.max(2, Math.min(36, slot * 0.7));
  const y = (value) => PAD.top + innerH - (value / max) * innerH;
  const every = Math.ceil(points.length / 8); // at most ~8 labels
  const shown = active != null ? points[active] : null;
  const describe = (p) =>
    `${bucketLabel(p.key, series.granularity, { long: true })}: ${formatCurrency(p.gross, currency)} charged, ${formatCurrency(p.refunded, currency)} refunded, ${formatCurrency(p.net, currency)} net`;

  return (
    <div className="ab-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Revenue over time">
        <line className="ab-chart__axis" x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} />
        <text className="ab-chart__label" x={PAD.left - 6} y={y(max) + 4} textAnchor="end">
          {formatCurrency(max, currency)}
        </text>
        <text className="ab-chart__label" x={PAD.left - 6} y={y(0) + 4} textAnchor="end">
          {formatCurrency(0, currency)}
        </text>
        {points.map((p, i) => {
          const x = PAD.left + slot * i + (slot - barW) / 2;
          const netTop = y(Math.max(0, p.net));
          return (
            <g key={p.key}>
              {p.refunded > 0 && <rect className="ab-chart__bar--refund" x={x} y={y(p.gross)} width={barW} height={Math.max(0, netTop - y(p.gross))} />}
              <rect
                className="ab-chart__bar ab-chart__bar--net"
                x={x}
                y={netTop}
                width={barW}
                height={Math.max(p.gross > 0 ? 1 : 0, y(0) - netTop)}
                tabIndex={0}
                aria-label={describe(p)}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onBlur={() => setActive(null)}
              />
              {/* A wider invisible target so thin bars are easy to hover. */}
              <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={innerH} fill="transparent" onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} aria-hidden="true" />
              {i % every === 0 && (
                <text className="ab-chart__label" x={x + barW / 2} y={H - 8} textAnchor="middle">
                  {bucketLabel(p.key, series.granularity)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="ab-chart__tip" aria-live="polite">
        {shown ? describe(shown) : 'Hover or tab to a bar for its figures.'}
      </p>
      <p className="ab-legend">
        <span>
          <span className="ab-legend__swatch" />
          Net (kept)
        </span>
        <span>
          <span className="ab-legend__swatch ab-legend__swatch--refund" />
          Refunded
        </span>
        <span>Bars are {series.granularity === 'day' ? 'days' : series.granularity === 'week' ? 'weeks (Mon – Sun)' : 'months'}; a refund counts against the charge it returns.</span>
      </p>
      <table className="ui-sr-only">
        <caption>Revenue by {series.granularity}</caption>
        <thead>
          <tr>
            <th>Period</th>
            <th>Charged</th>
            <th>Refunded</th>
            <th>Net</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <td>{bucketLabel(p.key, series.granularity, { long: true })}</td>
              <td>{formatCurrency(p.gross, currency)}</td>
              <td>{formatCurrency(p.refunded, currency)}</td>
              <td>{formatCurrency(p.net, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
