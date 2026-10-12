/**
 * From / To day filters (`YYYY-MM-DD` day keys, compared as text - never
 * through new Date(), see utils/date.js). Used by the admin billing lists.
 */
export const DATE_RANGE_MESSAGE = "To date can't be before the From date.";

/** The problem with a From / To pair, or null when it's fine (either side may be empty). */
export function dateRangeProblem(from, to) {
  if (from && to && String(to) < String(from)) return DATE_RANGE_MESSAGE;
  return null;
}

/** min / max for the two date inputs, so the picker never offers an impossible range. */
export function dateRangeLimits(from, to) {
  return { fromMax: to || undefined, toMin: from || undefined };
}
