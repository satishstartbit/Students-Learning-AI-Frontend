import './adminBilling.css';

/** Label · value rows (empty values left out); `[label, value, total]` - total rows are bold. */
export function Rows({ rows }) {
  const shown = rows.filter(([, value]) => value !== null && value !== undefined && value !== '' && value !== false);
  return (
    <dl className="ab-rows">
      {shown.map(([label, value, total]) => (
        <div key={label} className={total ? 'ab-rows__total' : undefined}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A titled box of rows - the refund and payment-details dialogs. */
export function Section({ title, children }) {
  return (
    <section className="ab-section" aria-label={title}>
      <h3 className="ab-section__title">{title}</h3>
      {children}
    </section>
  );
}
