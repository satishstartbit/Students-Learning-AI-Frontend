/**
 * A list page's state in its address (?search=…&status=…&page=2&limit=20) -
 * 2026-10-20, user request: filters, sort and page survive a refresh, the
 * browser's Back, and a "Back" button from a page inside the list. Pure
 * helpers for hooks/useListQuery.js.
 *
 * Values are strings in the URL; a value equal to its default (or empty) is
 * left out, so the plain address is the default view.
 */

/** { key: value } for every key in `defaults`, from URLSearchParams (missing → default). */
export function readQuery(params, defaults = {}) {
  const out = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    const value = params.get(key);
    out[key] = value === null ? fallback : value;
  }
  return out;
}

/** New URLSearchParams with `patch` applied; keys not in `defaults` are kept as they are. */
export function patchQuery(params, patch = {}, defaults = {}) {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(patch)) {
    const isDefault = key in defaults && String(value ?? '') === String(defaults[key] ?? '');
    if (value === '' || value == null || isDefault) next.delete(key);
    else next.set(key, String(value));
  }
  return next;
}

/** A whole number from the URL, clamped; anything else → `fallback`. */
export function intParam(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/** The numbers a pagination bar shows. */
export function pageNumbers({ page, limit, total }) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
    from: total === 0 ? 0 : Math.min((page - 1) * limit + 1, total),
    to: Math.min(page * limit, total),
  };
}

/**
 * hooks/useAddressText's bookkeeping. `state` = { text, seen, pending }: the box's
 * text, the address value last seen, and values the box wrote that haven't come
 * back yet. The address now shows `value`: one of ours coming back changes nothing
 * on screen; anything else (Clear filters, a link to the plain list) replaces the text.
 */
export function followAddress(state, value) {
  if (value === state.seen) return state;
  const mine = state.pending.indexOf(value);
  if (mine >= 0) return { ...state, seen: value, pending: state.pending.slice(mine + 1) };
  return { text: value, seen: value, pending: [] };
}

// Where each list was last left (path → "?…"), for Back buttons on pages inside it.
const KEY = 'eflp.listQuery';

export function rememberListSearch(pathname, search, storage = globalThis.sessionStorage) {
  try {
    const all = JSON.parse(storage?.getItem(KEY) || '{}');
    if (search) all[pathname] = search;
    else delete all[pathname];
    storage?.setItem(KEY, JSON.stringify(all));
  } catch {
    // Private mode or blocked storage: Back just goes to the plain list.
  }
}

/** `pathname` plus the query it was last left with ("" when unknown). */
export function listAddress(pathname, storage = globalThis.sessionStorage) {
  try {
    const all = JSON.parse(storage?.getItem(KEY) || '{}');
    return `${pathname}${all[pathname] ?? ''}`;
  } catch {
    return pathname;
  }
}
