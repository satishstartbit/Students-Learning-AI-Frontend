/**
 * PriceSummary rows for sales tax (the server's `tax` on a quote, checkout or
 * plan change - setting "Sales tax (GST/HST)"), laid out like the CRA GST/HST
 * calculator:
 *
 *   Province or territory      Yukon
 *   Amount before taxes        $12.00
 *   + GST (5%)                 $0.60
 *   + PST (0%)                 $0.00
 *   = Total after taxes        $12.60     (the caller's total row: totalLabel)
 *
 * When plan prices already include tax (`tax.included`, setting "Plan prices
 * already include tax") the rows follow the CRA reverse calculator instead,
 * and the caller's total row keeps its plain label:
 *
 *   Total after taxes          $12.00
 *   − GST (5%)                 $0.57
 *   − PST (0%)                 $0.00
 *   = Amount before taxes      $11.43
 *
 * HST provinces show one "+ HST (13%)" line; Quebec "+ GST (5%)" and
 * "+ QST (9.975%)". Empty when no tax applies (switched off, nothing to pay,
 * outside Canada) - so callers can spread it unconditionally.
 */
export function taxRows(tax, { showBefore = true } = {}) {
  const lines = tax?.lines ?? [];
  if (!lines.length) return [];
  const sign = tax.included ? '−' : '+';
  const rows = lines.map((line) => ({ label: `${sign} ${line.name} (${formatRate(line.rate)}%)`, value: line.amount }));
  // GST-only provinces and territories: the calculator still shows PST at 0%.
  if (lines.length === 1 && String(lines[0].name).toUpperCase() === 'GST') rows.push({ label: `${sign} PST (0%)`, value: 0 });
  if (tax.included) {
    return [{ label: 'Total after taxes', value: Number(tax.total) }, ...rows, { label: '= Amount before taxes', value: beforeTax(tax) }];
  }
  return [showBefore && { label: 'Amount before taxes', value: beforeTax(tax) }, ...rows].filter(Boolean);
}

/** The first summary row: "Province or territory  Yukon" (null without tax). */
export function provinceRow(tax) {
  const where = hasTax(tax) ? tax.regionName ?? tax.region : null;
  return where ? { label: 'Province or territory', text: where } : null;
}

/**
 * The price row's label. With tax and nothing taken off, the price IS the
 * amount before taxes, so it carries that name and taxRows skips its own.
 */
export function priceLabel(tax, adjusted, plain) {
  return hasTax(tax) && !tax.included && !adjusted ? 'Amount before taxes' : plain;
}

/** False when the price row would only repeat "Total after taxes" (prices include tax, nothing taken off). */
export function showPriceRow(tax, adjusted) {
  return !(hasTax(tax) && tax.included && !adjusted);
}

/** The taxed amount without its tax (to the cent). */
export function beforeTax(tax) {
  return Math.round((Number(tax?.total ?? 0) - Number(tax?.amount ?? 0)) * 100) / 100;
}

/** The total row's label: "= Total after taxes" when tax is added on top, else `plain`. */
export function totalLabel(tax, plain) {
  return hasTax(tax) && !tax.included ? '= Total after taxes' : plain;
}

/** 13 -> "13", 9.975 -> "9.975". */
export function formatRate(rate) {
  return String(Number(rate));
}

/**
 * Where the province comes from: the parent's address (CRA place-of-supply
 * rule). Null when no tax applies.
 */
export function taxNote(tax) {
  if (!tax?.lines?.length) return null;
  return 'Taxes follow the province in your address on My Profile.';
}

/** True when the quote carries sales tax. */
export const hasTax = (tax) => Boolean(tax?.lines?.length);
