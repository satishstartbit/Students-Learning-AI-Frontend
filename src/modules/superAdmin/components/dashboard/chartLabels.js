import { addDaysToKey, formatDateKey } from '../../../../utils/date';

/** A chart bucket's label: "Oct 1" (day), "Oct 12" / "Week of Oct 12 – 18" (week), "Oct 26" / "October 2026" (month). */
export function bucketLabel(key, granularity, { long = false } = {}) {
  if (granularity === 'month') return formatDateKey(`${key}-01`, { month: long ? 'long' : 'short', year: long ? 'numeric' : '2-digit', day: undefined });
  if (granularity === 'week') {
    const start = formatDateKey(key, { month: 'short', day: 'numeric', year: undefined });
    return long ? `Week of ${start} – ${formatDateKey(addDaysToKey(key, 6), { month: 'short', day: 'numeric' })}` : start;
  }
  return formatDateKey(key, { month: 'short', day: 'numeric', ...(long ? { weekday: 'short' } : { year: undefined }) });
}

/** "Bars are days" / "weeks (Mon – Sun)" / "months". */
export function granularityText(granularity) {
  if (granularity === 'week') return 'weeks (Mon – Sun)';
  if (granularity === 'month') return 'months';
  return 'days';
}
