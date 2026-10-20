/**
 * The Order a master form sends: a whole number, or undefined when the field
 * is blank (the server then puts the item at the end of its list - or, on an
 * edit, leaves its Order as it is).
 */
export function orderPayload(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}
