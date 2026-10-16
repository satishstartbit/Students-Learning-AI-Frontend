/**
 * Pure helpers for "Break into steps" (components/BreakIntoSteps.jsx): the
 * AI's suggestion as an editable list, and what is sent back when the
 * student keeps it. Each row keeps the suggestion's `key` so dependencies
 * survive renames; a new row gets a fresh key.
 */

export const MAX_STEP_MINUTES = 240;
const MAX_TITLE = 200;

let counter = 0;
const newKey = () => `new-${Date.now().toString(36)}-${(counter += 1)}`;

/** The suggestion's steps as editable rows. */
export function toRows(steps = []) {
  return steps.map((s) => ({
    key: s.key,
    title: s.title ?? '',
    minutes: s.minutes == null ? '' : String(s.minutes),
    dependsOn: s.dependsOn ?? [],
    checkpointId: s.checkpointId ?? null,
  }));
}

export const addRow = (rows) => [...rows, { key: newKey(), title: '', minutes: '', dependsOn: [], checkpointId: null }];

export const updateRow = (rows, key, patch) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r));

/** Removing a step also removes every link to it. */
export const removeRow = (rows, key) =>
  rows.filter((r) => r.key !== key).map((r) => ({ ...r, dependsOn: r.dependsOn.filter((k) => k !== key) }));

export function moveRow(rows, key, delta) {
  const i = rows.findIndex((r) => r.key === key);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= rows.length) return rows;
  const next = rows.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

const minutesOf = (row) => (row.minutes === '' ? null : Number(row.minutes));

/** Per-row problems ({ [key]: { title?, minutes? } }); empty when the list can be kept. */
export function rowProblems(rows) {
  const out = {};
  for (const r of rows) {
    const p = {};
    if (!r.title.trim()) p.title = 'Give this step a name';
    else if (r.title.trim().length > MAX_TITLE) p.title = `At most ${MAX_TITLE} characters`;
    const m = minutesOf(r);
    if (m !== null && !(Number.isInteger(m) && m >= 1 && m <= MAX_STEP_MINUTES)) p.minutes = `1 to ${MAX_STEP_MINUTES}`;
    if (Object.keys(p).length) out[r.key] = p;
  }
  return out;
}

export const totalMinutes = (rows) => rows.reduce((sum, r) => sum + (minutesOf(r) ?? 0), 0);

/** The body for keepSteps: in the student's order, links only to steps above. */
export function toPayload(proposalId, rows) {
  const seen = new Set();
  const steps = rows.map((r) => {
    const step = {
      key: r.key,
      title: r.title.trim(),
      minutes: minutesOf(r),
      dependsOn: r.dependsOn.filter((k) => seen.has(k)),
      checkpointId: r.checkpointId ?? null,
    };
    seen.add(r.key);
    return step;
  });
  return { proposalId, steps };
}

/** "1 h 15 min" / "40 min". */
export function durationText(minutes) {
  const m = Math.max(0, Math.round(minutes ?? 0));
  const h = Math.floor(m / 60);
  if (!h) return `${m} min`;
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

/** The workload facts shown above the steps, in plain words (kid wording when `kid`). */
export function workloadFacts(w, { kid = false } = {}) {
  if (!w) return [];
  const facts = [];
  if (w.daysUntilDue == null) facts.push(kid ? 'No due date' : 'No due date - planned over about a week');
  else if (w.daysUntilDue === 0) facts.push('Due today');
  else facts.push(`Due in ${w.daysUntilDue} ${w.daysUntilDue === 1 ? 'day' : 'days'}`);
  facts.push(`${durationText(w.freeMinutes)} free ${kid ? 'to work' : 'before then'}`);
  if (w.otherCount) {
    facts.push(
      kid
        ? `${w.otherCount} other ${w.otherCount === 1 ? 'thing' : 'things'} due first`
        : `${w.otherCount} other ${w.otherCount === 1 ? 'piece' : 'pieces'} of work due first · ${durationText(w.otherMinutes)}`
    );
  } else {
    facts.push('Nothing else due first');
  }
  facts.push(`Steps up to ${durationText(w.sessionMinutes)}`);
  return facts;
}
