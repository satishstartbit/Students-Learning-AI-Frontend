import { Checkbox } from '../../../components/common';

/**
 * Several ticks from one fixed list, stored as an array of option values.
 * Built on the shared Checkbox so rows keep its 48px hit target.
 */
export function CheckboxGroup({ name, label, hint, options, value = [], onChange, error, columns = 2 }) {
  const toggle = (optionValue) =>
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);

  return (
    <fieldset
      className="ui-field"
      aria-invalid={Boolean(error)}
      style={{ border: 0, padding: 0, margin: '0 0 var(--spacing-lg)' }}
    >
      {label && <legend className="ui-label">{label}</legend>}
      {hint && <p className="ui-hint" style={{ margin: '0 0 var(--spacing-xs)' }}>{hint}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${columns === 1 ? 260 : 220}px, 1fr))`, columnGap: 'var(--spacing-md)' }}>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            name={`${name}-${option.value}`}
            label={option.emoji ? `${option.emoji}  ${option.label}` : option.label}
            checked={value.includes(option.value)}
            onChange={() => toggle(option.value)}
          />
        ))}
      </div>
      {error && (
        <p className="ui-field-error" role="alert" style={{ color: 'var(--color-danger-fg)', margin: 'var(--spacing-xs) 0 0' }}>
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default CheckboxGroup;
