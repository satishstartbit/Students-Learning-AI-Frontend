/**
 * Pure helpers for the Super Admin dashboard (`GET /admin/dashboard`), kept
 * free of imports so `npm test` can run them (dashboardData.test.js).
 */

export const PERIOD_OPTIONS = Object.freeze([
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
]);

/** "the last 30 days" / "the last 12 months" for sentences. */
export function periodPhrase(days) {
  return Number(days) === 365 ? 'the last 12 months' : `the last ${Number(days)} days`;
}

/** The account series on the charts, in stacking order. */
export const ROLE_SERIES = Object.freeze([
  { key: 'student', label: 'Students', one: 'student', className: 'ad-series--student' },
  { key: 'parent', label: 'Parents', one: 'parent', className: 'ad-series--parent' },
  { key: 'teacher', label: 'Teachers', one: 'teacher', className: 'ad-series--teacher' },
]);

/** Subscription statuses in the order a manager reads them. */
export const SUBSCRIPTION_ROWS = Object.freeze([
  { key: 'trialing', label: 'Free trial', className: 'ad-series--trial', always: true },
  { key: 'active', label: 'Active', className: 'ad-series--active', always: true },
  { key: 'past_due', label: 'Past due', className: 'ad-series--pastdue', always: true },
  { key: 'cancelled', label: 'Cancelled', className: 'ad-series--ended' },
  { key: 'expired', label: 'Expired', className: 'ad-series--ended' },
  { key: 'incomplete', label: 'Incomplete', className: 'ad-series--ended' },
]);

/** A round axis top at or above `value`: 1, 2, 5 × 10ⁿ (never 0). */
export function niceCeil(value) {
  const v = Number(value);
  if (!(v > 0)) return 1;
  const power = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 5, 10].find((m) => m * power >= v);
  return step * power;
}

/** Largest bar of a series: the stack of `keys` per point, or the biggest single value when grouped. */
export function seriesMax(points = [], keys = [], { stacked = true } = {}) {
  let max = 0;
  for (const p of points) {
    const values = keys.map((k) => Number(p?.[k] ?? 0));
    max = Math.max(max, stacked ? values.reduce((a, b) => a + b, 0) : Math.max(0, ...values));
  }
  return max;
}

/** Donut arcs: [{ ...segment, fraction, start }] where start/fraction are 0..1 of the ring. */
export function donutArcs(segments = []) {
  const total = segments.reduce((a, s) => a + Math.max(0, Number(s.value) || 0), 0);
  let start = 0;
  return segments.map((s) => {
    const fraction = total ? Math.max(0, Number(s.value) || 0) / total : 0;
    const arc = { ...s, fraction, start };
    start += fraction;
    return arc;
  });
}

/** 0.4567 -> "46%", a sliver above 0 -> "<1%". */
export function percentLabel(fraction) {
  if (!(fraction > 0)) return '0%';
  const pct = Math.round(fraction * 100);
  return pct === 0 ? '<1%' : `${pct}%`;
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * What needs the Super Admin's attention, most serious first:
 * [{ id, tone: 'danger' | 'warning' | 'info' | 'success', title, text, to?, cta? }].
 * One "All clear" item when there is nothing.
 */
export function attentionItems(data) {
  if (!data) return [];
  const items = [];
  const system = data.system;
  if (system && !system.ready) {
    items.push({ id: 'database', tone: 'danger', title: 'The database is not answering', text: 'Sign-ins and saving may fail.', to: '/admin/system', cta: 'System status' });
  }
  if (system && system.emailConfigured === false) {
    items.push({ id: 'email', tone: 'danger', title: "Email isn't set up", text: 'Sign-up codes, set-password links and receipts can’t be sent.', to: '/admin/system', cta: 'System status' });
  }
  if (system?.failingSweeps) {
    items.push({ id: 'sweeps', tone: 'danger', title: `${plural(system.failingSweeps, 'scheduled job')} failing`, text: 'Renewals or reminders may not be running.', to: '/admin/system', cta: 'System status' });
  }
  const safety = data.safety?.total ?? 0;
  if (safety) {
    items.push({ id: 'safety', tone: 'danger', title: `${plural(safety, 'safety concern')} flagged`, text: "Raised from students' writing in this period. Their parents were alerted." });
  }
  const pastDue = data.subscriptions?.pastDue ?? 0;
  if (pastDue) {
    items.push({ id: 'pastDue', tone: 'warning', title: `${plural(pastDue, 'payment')} past due`, text: 'Families in grace while their card is retried.', to: '/admin/subscriptions', cta: 'Subscriptions' });
  }
  const late = (system?.lateSweeps ?? 0) + (system?.lateWorkers ?? 0);
  if (late) {
    items.push({ id: 'late', tone: 'warning', title: `${plural(late, 'background job')} running late`, text: 'Check the workers and sweeps.', to: '/admin/system', cta: 'System status' });
  }
  const ending = data.subscriptions?.endingAtPeriodEnd ?? 0;
  if (ending) {
    items.push({ id: 'ending', tone: 'info', title: `${plural(ending, 'subscription')} set to end`, text: 'Auto-renewal is off; access stops at the end of the paid period.', to: '/admin/subscriptions', cta: 'Subscriptions' });
  }
  const unverified = data.accounts?.unverifiedEmails ?? 0;
  if (unverified) {
    items.push({ id: 'unverified', tone: 'info', title: `${plural(unverified, 'email')} not verified`, text: "Parents or teachers who haven't confirmed their address yet.", to: '/admin/users/parents', cta: 'Parents' });
  }
  const suspended = data.accounts?.suspended ?? {};
  const suspendedAll = data.accounts?.suspendedAll ?? 0;
  if (suspendedAll) {
    const role = Object.entries(suspended).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'student';
    items.push({ id: 'suspended', tone: 'info', title: `${plural(suspendedAll, 'account')} suspended`, text: "They can't sign in until reactivated.", to: `/admin/users/${role}s`, cta: 'Users' });
  }
  if (!items.length) items.push({ id: 'clear', tone: 'success', title: 'All clear', text: 'Nothing needs your attention right now.' });
  return items;
}
