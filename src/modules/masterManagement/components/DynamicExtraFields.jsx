import { Input, TimePicker, Checkbox } from '../../../components/common';

/**
 * Renders the extra scalar fields a master_types.field_schema declares
 * (e.g. duration_minutes for Focus Duration, start_time/end_time for Study
 * Time). Nothing here is hardcoded per master - the field list always comes
 * from the API.
 */
export default function DynamicExtraFields({ fields = [], values = {}, errors = {}, onChange }) {
  if (!fields.length) return null;

  return (
    <>
      {fields.map((field) => {
        const label = field.label ?? field.key;
        const value = values[field.key] ?? '';
        const error = errors[field.key] ?? null;

        if (field.type === 'boolean') {
          return (
            <Checkbox
              key={field.key}
              name={field.key}
              label={label}
              checked={Boolean(value)}
              onChange={(e) => onChange(field.key, e.target.checked)}
              error={error}
            />
          );
        }

        if (field.type === 'time') {
          return (
            <TimePicker
              key={field.key}
              name={field.key}
              label={label}
              required={field.required}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              error={error}
            />
          );
        }

        if (field.type === 'integer' || field.type === 'decimal') {
          return (
            <Input
              key={field.key}
              name={field.key}
              label={label}
              type="number"
              step={field.type === 'decimal' ? 'any' : 1}
              required={field.required}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              error={error}
            />
          );
        }

        return (
          <Input
            key={field.key}
            name={field.key}
            label={label}
            required={field.required}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            error={error}
          />
        );
      })}
    </>
  );
}
