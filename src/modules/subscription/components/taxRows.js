/**
 * PriceSummary rows for sales tax (the server's `tax` on a quote, checkout or
 * plan change - setting "Sales tax (GST/HST)"): one line per tax, e.g.
 * "HST (13%)". Empty when no tax applies (switched off, nothing to pay,
 * outside Canada) - so callers can spread it unconditionally.
 */
export function taxRows(tax) {
  return (tax?.lines ?? []).map((line) => ({ label: `${line.name} (${formatRate(line.rate)}%)`, value: line.amount }));
}

/** 13 -> "13", 9.975 -> "9.975". */
export function formatRate(rate) {
  return String(Number(rate));
}

/** True when the quote carries sales tax. */
export const hasTax = (tax) => Boolean(tax?.lines?.length);
