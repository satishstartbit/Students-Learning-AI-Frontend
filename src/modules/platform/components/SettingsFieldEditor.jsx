import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { Button, Checkbox, Input, MultiSelect, Select, Textarea } from '../../../components/common';

/**
 * Renders a platform setting from the SAME field list the server validates
 * with (backend config/settings/fieldSchema.js), so nothing about a
 * setting's shape is hardcoded here. Recursive for `object` and `list`.
 *
 *   fields  the definition's field descriptors
 *   value   the current object
 *   errors  { 'dotted.path': message } from the server
 *   onChange(nextValue)
 */
export default function SettingsFieldEditor({ fields = [], value = {}, errors = {}, onChange, path = '', disabled = false }) {
  const setKey = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="ps-fields">
      {fields.map((field) => (
        <Field
          key={field.key}
          field={field}
          value={value?.[field.key]}
          errors={errors}
          path={path ? `${path}.${field.key}` : field.key}
          onChange={(next) => setKey(field.key, next)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

const numberOrEmpty = (raw, integer) => {
  if (raw === '' || raw === '-') return raw;
  const n = integer ? Number.parseInt(raw, 10) : Number(raw);
  return Number.isFinite(n) ? n : raw;
};

function Field({ field, value, errors, path, onChange, disabled }) {
  const label = field.label ?? field.key;
  const error = errors[path] ?? null;
  const hint = field.help ?? undefined;

  switch (field.type) {
    case 'boolean':
      return (
        <div className="ps-field ps-field--inline">
          <Checkbox
            name={path}
            label={label}
            description={hint}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="ps-field ps-field--wide">
          <Textarea
            name={path}
            label={label}
            hint={hint}
            rows={Math.min(8, Math.max(3, String(value ?? '').split('\n').length + 1))}
            maxLength={field.maxLength}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'integer':
    case 'number':
      return (
        <div className="ps-field">
          <Input
            name={path}
            label={label}
            hint={hint ?? rangeHint(field)}
            type="number"
            step={field.type === 'integer' ? 1 : field.step ?? 'any'}
            min={field.min}
            max={field.max}
            value={value ?? ''}
            onChange={(e) => onChange(numberOrEmpty(e.target.value, field.type === 'integer'))}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'select':
      return (
        <div className="ps-field">
          <Select
            name={path}
            label={label}
            hint={hint}
            options={field.options}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'multiselect':
      return (
        <div className="ps-field ps-field--wide">
          <MultiSelect
            name={path}
            label={label}
            hint={hint}
            options={field.options}
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        </div>
      );

    case 'tags':
    case 'integerList':
      return (
        <div className="ps-field ps-field--wide">
          <Input
            name={path}
            label={label}
            hint={hint ?? 'Separate with commas'}
            value={Array.isArray(value) ? value.join(', ') : value ?? ''}
            onChange={(e) => {
              const parts = e.target.value.split(',').map((p) => p.trim());
              const cleaned = parts.filter((p, i) => p !== '' || i === parts.length - 1);
              onChange(
                field.type === 'integerList'
                  ? cleaned.filter((p) => p !== '').map((p) => (Number.isFinite(Number(p)) ? Number(p) : p))
                  : cleaned.filter((p) => p !== '')
              );
            }}
            error={error ?? firstChildError(errors, path)}
            disabled={disabled}
          />
        </div>
      );

    case 'object':
      return (
        <fieldset className="ps-group ps-field--wide">
          <legend className="ps-group__title">{label}</legend>
          {hint && <p className="ps-group__hint">{hint}</p>}
          {error && <p className="ps-error">{error}</p>}
          <SettingsFieldEditor fields={field.fields} value={value ?? {}} errors={errors} onChange={onChange} path={path} disabled={disabled} />
        </fieldset>
      );

    case 'list':
      return <ListField field={field} value={value} errors={errors} path={path} onChange={onChange} disabled={disabled} />;

    case 'text':
    default:
      return (
        <div className="ps-field">
          <Input
            name={path}
            label={label}
            hint={hint}
            maxLength={field.maxLength}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            disabled={disabled}
          />
        </div>
      );
  }
}

function ListField({ field, value, errors, path, onChange, disabled }) {
  const items = Array.isArray(value) ? value : [];
  const canAdd = !disabled && (field.maxItems == null || items.length < field.maxItems);
  const canRemove = !disabled && (field.minItems == null || items.length > field.minItems);
  const blank = () => Object.fromEntries((field.fields ?? []).map((f) => [f.key, emptyFor(f)]));

  return (
    <fieldset className="ps-group ps-field--wide">
      <legend className="ps-group__title">{field.label ?? field.key}</legend>
      {field.help && <p className="ps-group__hint">{field.help}</p>}
      {errors[path] && <p className="ps-error">{errors[path]}</p>}
      {items.length === 0 && <p className="ps-group__hint">Nothing added yet.</p>}
      {items.map((item, index) => (
        // Position is the identity here: list items have no id of their own.
        <div key={index} className="ps-list-item">
          <div className="ps-list-item__head">
            <span className="ps-list-item__title">
              {field.itemLabel ?? 'Item'} {index + 1}
            </span>
            {canRemove && (
              <Button
                size="sm"
                variant="ghost"
                startIcon={<LuTrash2 aria-hidden="true" />}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            )}
          </div>
          <SettingsFieldEditor
            fields={field.fields}
            value={item}
            errors={errors}
            path={`${path}.${index}`}
            onChange={(next) => onChange(items.map((it, i) => (i === index ? next : it)))}
            disabled={disabled}
          />
        </div>
      ))}
      {canAdd && (
        <Button size="sm" variant="secondary" startIcon={<LuPlus aria-hidden="true" />} onClick={() => onChange([...items, blank()])}>
          Add {String(field.itemLabel ?? 'item').toLowerCase()}
        </Button>
      )}
    </fieldset>
  );
}

function emptyFor(field) {
  switch (field.type) {
    case 'boolean':
      return false;
    case 'integer':
    case 'number':
      return field.min ?? 0;
    case 'select':
      return field.options?.[0]?.value ?? '';
    case 'multiselect':
    case 'tags':
    case 'integerList':
    case 'list':
      return [];
    case 'object':
      return Object.fromEntries((field.fields ?? []).map((f) => [f.key, emptyFor(f)]));
    default:
      return '';
  }
}

function rangeHint(field) {
  if (field.min != null && field.max != null) return `${field.min} to ${field.max}`;
  if (field.min != null) return `At least ${field.min}`;
  if (field.max != null) return `At most ${field.max}`;
  return undefined;
}

function firstChildError(errors, path) {
  const prefix = `${path}.`;
  const key = Object.keys(errors).find((k) => k.startsWith(prefix));
  return key ? errors[key] : null;
}
