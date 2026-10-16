import { formatNumber } from '../../../../utils/format';
import { donutArcs, percentLabel } from './dashboardData';

const SIZE = 160;
const R = 62;
const STROKE = 22;
const C = 2 * Math.PI * R;

/**
 * A ring of shares (accounts by role) with the total in the middle and a
 * legend that repeats every figure as text - the ring itself is decorative
 * for screen readers. `segments`: [{ key, label, value, className }].
 */
export default function DonutChart({ segments, centerLabel, label }) {
  const arcs = donutArcs(segments);
  const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0);

  return (
    <div className="ad-donut">
      <svg className="ad-donut__ring" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${label}: ${segments.map((s) => `${formatNumber(s.value)} ${s.label.toLowerCase()}`).join(', ')}`}>
        <circle className="ad-donut__track" cx={SIZE / 2} cy={SIZE / 2} r={R} strokeWidth={STROKE} fill="none" />
        {arcs
          .filter((a) => a.fraction > 0)
          .map((a) => (
            <circle
              key={a.key}
              className={`ad-donut__arc ${a.className}`}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              strokeWidth={STROKE}
              strokeDasharray={`${Math.max(0, a.fraction * C - (arcs.length > 1 && a.fraction < 1 ? 2 : 0))} ${C}`}
              strokeDashoffset={-a.start * C}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          ))}
        <text className="ad-donut__total" x="50%" y="48%" textAnchor="middle" dominantBaseline="middle">
          {formatNumber(total)}
        </text>
        <text className="ad-donut__caption" x="50%" y="63%" textAnchor="middle" dominantBaseline="middle">
          {centerLabel}
        </text>
      </svg>
      <ul className="ad-donut__legend">
        {arcs.map((a) => (
          <li key={a.key}>
            <span className={`ad-legend__swatch ${a.className}`} aria-hidden="true" />
            <span className="ad-donut__name">{a.label}</span>
            <span className="ad-donut__value">{formatNumber(a.value)}</span>
            <span className="ad-donut__pct">{percentLabel(a.fraction)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
