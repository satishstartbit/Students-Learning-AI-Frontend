/**
 * The Master Management dashboard's sort, per section (2026-10-20, user
 * request: "sort should work individually, section by section"), kept in the
 * address with the search and area so Back returns to it unchanged.
 *
 *   ?sort=academic:totalRecords:desc,subscriptions:label:asc
 *
 * A section not listed sorts by name, A-Z.
 */
export const DEFAULT_SORT = Object.freeze({ by: 'label', order: 'asc' });
const SORTABLE = ['label', 'totalRecords', 'activeRecords', 'inactiveRecords', 'lastUpdated'];

/** "Curriculum & Task Setup" → "curriculum-task-setup" */
export const sectionKey = (category) =>
  String(category ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** "a:b:c,…" → { [section]: { by, order } }, ignoring anything malformed. */
export function parseSorts(value) {
  const out = {};
  for (const part of String(value ?? '').split(',')) {
    const [section, by, order] = part.split(':');
    if (section && SORTABLE.includes(by) && (order === 'asc' || order === 'desc')) out[section] = { by, order };
  }
  return out;
}

/** The inverse; sections on the default sort are left out ('' when all are). */
export function formatSorts(sorts) {
  return Object.entries(sorts ?? {})
    .filter(([, s]) => s && !(s.by === DEFAULT_SORT.by && s.order === DEFAULT_SORT.order))
    .map(([section, s]) => `${section}:${s.by}:${s.order}`)
    .join(',');
}

export const sortFor = (sorts, category) => sorts[sectionKey(category)] ?? DEFAULT_SORT;

/** One section's rows in its own order. Numbers compare as numbers, everything else as text. */
export function sortRows(rows, { by, order }) {
  const dir = order === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = a[by] ?? '';
    const bv = b[by] ?? '';
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}
