import { useState } from 'react';
import { formatNumber } from '../../../../utils/format';
import { bucketLabel, granularityText } from './chartLabels';
import { niceCeil, seriesMax } from './dashboardData';
import { useElementWidth } from './useElementWidth';

const PAD = { top: 12, right: 8, bottom: 28, left: 40 };

/**
 * Counts over time as bars - stacked (sign-ups by role) or side by side
 * (check-ins and focus sessions). `series` is the server's
 * { granularity, points: [{ key, ...values }] }; `keys` are
 * [{ key, label, className }] (the class colours the bar from tokens in
 * adminDashboard.css). Hover or tab to a bar for its figures; a hidden table
 * carries the same numbers for screen readers. Drawn at its real width, so
 * the labels stay readable on a phone.
 */
export default function BarChart({ series, keys, label, stacked = true, emptyText = 'Nothing in this period.' }) {
  const points = series?.points ?? [];
  const [active, setActive] = useState(null);
  const [boxRef, measured] = useElementWidth();
  const total = points.reduce((sum, p) => sum + keys.reduce((s, k) => s + Number(p[k.key] ?? 0), 0), 0);
  if (!points.length || !total) {
    return (
      <div className="ad-chart" ref={boxRef}>
        <p className="ad-empty">{emptyText}</p>
      </div>
    );
  }

  const W = Math.max(280, measured);
  const H = W < 520 ? 180 : 220;

  const max = niceCeil(seriesMax(points, keys.map((k) => k.key), { stacked }));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / points.length;
  const groupW = Math.max(3, Math.min(40, slot * 0.72));
  const y = (value) => PAD.top + innerH - (value / max) * innerH;
  const every = Math.ceil(points.length / Math.max(3, Math.min(8, Math.floor(innerW / 72))));
  const describe = (p) =>
    `${bucketLabel(p.key, series.granularity, { long: true })}: ${keys.map((k) => `${formatNumber(p[k.key] ?? 0)} ${k.label.toLowerCase()}`).join(', ')}`;
  const shown = active != null ? points[active] : null;

  return (
    <div className="ad-chart" ref={boxRef}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label}>
        {(Number.isInteger(max / 2) ? [0, 0.5, 1] : [0, 1]).map((f) => (
          <g key={f}>
            <line className={f === 0 ? 'ad-chart__axis' : 'ad-chart__grid'} x1={PAD.left} x2={W - PAD.right} y1={y(max * f)} y2={y(max * f)} />
            <text className="ad-chart__label" x={PAD.left - 6} y={y(max * f) + 4} textAnchor="end">
              {formatNumber(max * f)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const x0 = PAD.left + slot * i + (slot - groupW) / 2;
          let base = 0;
          const barW = stacked ? groupW : groupW / keys.length;
          return (
            <g key={p.key} className={active === i ? 'ad-chart__slot is-active' : 'ad-chart__slot'}>
              {keys.map((k, ki) => {
                const value = Number(p[k.key] ?? 0);
                const top = stacked ? y(base + value) : y(value);
                const bottom = stacked ? y(base) : y(0);
                const x = stacked ? x0 : x0 + barW * ki;
                if (stacked) base += value;
                if (!value) return null;
                return <rect key={k.key} className={`ad-chart__bar ${k.className}`} x={x} y={top} width={Math.max(1, barW - (stacked ? 0 : 1))} height={Math.max(1, bottom - top)} rx={stacked ? 0 : 1} />;
              })}
              <rect
                className="ad-chart__hit"
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={innerH}
                tabIndex={0}
                aria-label={describe(p)}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onBlur={() => setActive(null)}
              />
              {i % every === 0 && (
                <text className="ad-chart__label" x={x0 + groupW / 2} y={H - 8} textAnchor="middle">
                  {bucketLabel(p.key, series.granularity)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="ad-chart__tip" aria-live="polite">
        {shown ? describe(shown) : 'Hover or tab to a bar for its figures.'}
      </p>
      <p className="ad-legend">
        {keys.map((k) => (
          <span key={k.key}>
            <span className={`ad-legend__swatch ${k.className}`} aria-hidden="true" />
            {k.label}
          </span>
        ))}
        <span className="ad-legend__note">Bars are {granularityText(series.granularity)}.</span>
      </p>
      <table className="ui-sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Period</th>
            {keys.map((k) => (
              <th key={k.key}>{k.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <td>{bucketLabel(p.key, series.granularity, { long: true })}</td>
              {keys.map((k) => (
                <td key={k.key}>{formatNumber(p[k.key] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
