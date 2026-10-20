/**
 * The subscription plan form's field rules (the server checks the same:
 * validators/masterBilling.validator.js + masterBilling.service.js).
 * 2026-10-20 (user request): Trial days, Number of students, Number of parents
 * and Minimum amount are required; students and parents are at least 1.
 */
const MIN_CARD_CHARGE = 0.5;

/** 0 is a free plan; a paid plan must be a charge a card can take. */
export function priceProblem(value, currency = 'CAD') {
  if (value === '' || value == null) return null;
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) return 'Enter a price of 0 or more';
  return price > 0 && price < MIN_CARD_CHARGE ? `A paid plan must cost at least 0.50 ${currency}. Use 0 for a free plan.` : null;
}

export function trialProblem(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 365 ? null : 'Enter a whole number of days from 0 to 365 (0 = no free trial)';
}

/** Number of students / parents: a whole number from 1 to 100. */
export function familySizeProblem(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 100 ? null : 'Enter a whole number of 1 or more';
}

/**
 * The least a family pays for the plan, whatever discount code they use:
 * 0 (no minimum) or a chargeable amount, never more than the price.
 */
export function minimumProblem(value, values = {}, currency = 'CAD') {
  if (value === '' || value == null) return null;
  const minimum = Number(value);
  if (!Number.isFinite(minimum) || minimum < 0) return 'Enter an amount of 0 or more';
  if (minimum > 0 && minimum < MIN_CARD_CHARGE) return `Use 0 (no minimum) or at least 0.50 ${currency}, the smallest card payment`;
  const price = Number(values.price);
  if (values.price !== '' && values.price != null && Number.isFinite(price) && minimum > price) return "The minimum can't be more than the price";
  return null;
}

/** The form values as the API takes them. */
export function planPayload(values) {
  return {
    price: Number(values.price) || 0,
    minimumAmount: Number(values.minimumAmount) || 0,
    trialDays: Number(values.trialDays),
    maxStudents: Number(values.maxStudents),
    maxParents: Number(values.maxParents),
  };
}
