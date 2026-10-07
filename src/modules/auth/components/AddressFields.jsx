import { useEffect, useId, useRef, useState } from 'react';
import { Input, Select } from '../../../components/common';
import { useDebounce } from '../../../hooks/useDebounce';
import { CANADIAN_PROVINCES } from '../../../utils/locale';
import { formatCanadianPostalCode } from '../../../utils/postalCode';
import { formatMailingAddress, isCanadianCountry, normalizeAddressText, normalizeStreetLine } from '../../../utils/address';
import postalLookupService from '../services/postalLookup.service';
import './AddressFields.css';

/**
 * The address field group shared by every self-profile form (Teacher, Parent),
 * the parent's child-edit form and the school master form.
 *
 * Fields follow the Canada Post address lines (see utils/address.js):
 * department/floor/suite, street (unit hyphenated first: 309-11211 85 ST NW),
 * city + province + postal code, then country. For a Canadian address the
 * text fields show in capitals while typing and take the full Canada Post
 * form (no punctuation, "STREET" -> "ST") when they lose focus - the backend
 * applies the same rules on save. Other countries keep free text.
 *
 * `values`/`getProps`/`setFieldValue` are `useForm`'s own return values -
 * this component owns no state of its own beyond the postal-code lookup.
 * `recipient` (optional) is the name printed on the first line of the
 * "As it prints on mail" preview.
 */
const PROVINCE_OPTIONS = CANADIAN_PROVINCES.map((p) => ({ value: p.code, label: `${p.name} (${p.code})` }));

/** Country picker for the profile layout: the platform is Canadian, with the US as the one other common case. */
const COUNTRY_OPTIONS = [
  { value: 'Canada', label: 'Canada' },
  { value: 'United States', label: 'United States' },
];

const CAPITALS = { textTransform: 'uppercase' };

/** Older street values may span lines; a one-line input would glue their words together. */
const oneLine = (value) => String(value ?? '').replace(/\s*\r?\n\s*/g, ' ');

/**
 * `layout="profile"` is the My Profile pages' two-column arrangement; the
 * default stacked layout is for the other forms that use this component.
 */
export default function AddressFields({ values, getProps, setFieldValue, layout = 'stacked', recipient }) {
  const canadian = isCanadianCountry(values.country);
  const previewLabelId = useId();

  // The first 3 characters of the postal code (the FSA) are enough to look
  // up an approximate city/province - see services/postalLookup.service.js
  // (backend) for why this is FSA-level, not an exact-address lookup.
  const fsa = String(values.postalCode ?? '')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase();
  const debouncedFsa = useDebounce(fsa, 400);
  const [filled, setFilled] = useState(false);
  const lastLookedUp = useRef(null);

  useEffect(() => {
    if (!canadian || debouncedFsa.length !== 3 || debouncedFsa === lastLookedUp.current) return undefined;

    let cancelled = false;
    lastLookedUp.current = debouncedFsa;

    postalLookupService
      .lookupPostalCode(debouncedFsa)
      .then(({ data }) => {
        if (cancelled || !data) return;
        // Only fill blanks - never overwrite something the student already typed.
        if (data.city && !values.city) setFieldValue('city', normalizeAddressText(data.city));
        if (data.province && !values.state) setFieldValue('state', data.province);
        if (data.city || data.province) setFilled(true);
      })
      .catch(() => {
        // A missed lookup just means no autofill this time - city/province stay editable either way.
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFsa, canadian]);

  /** Canadian text fields: capitals while typing, Canada Post form on blur. */
  const canadaPostProps = (name, normalize, overrides = {}) => {
    const props = { ...getProps(name), ...overrides };
    if (!canadian) return props;
    return {
      ...props,
      style: CAPITALS,
      onBlur: (event) => {
        const next = normalize(event.target.value);
        if (next !== values[name]) setFieldValue(name, next);
        props.onBlur?.(event);
      },
    };
  };

  const postalCodeProps = {
    ...getProps('postalCode'),
    onChange: (e) => {
      const raw = e.target.value;
      setFieldValue('postalCode', canadian ? formatCanadianPostalCode(raw) : raw);
    },
  };

  const profile = layout === 'profile';

  const line2Field = (
    <Input
      label="Department, floor or suite"
      autoComplete="address-line2"
      hint="Only if mail needs it - it prints above the street line."
      {...canadaPostProps('addressLine2', normalizeAddressText)}
    />
  );

  const streetField = (
    <Input
      label="Street address"
      autoComplete="address-line1"
      placeholder={canadian ? '123 MAIN ST W' : undefined}
      hint={canadian ? 'Unit number first, then a hyphen: 309-11211 85 ST NW' : undefined}
      {...canadaPostProps('address', normalizeStreetLine, { value: oneLine(values.address) })}
    />
  );

  const cityField = <Input label="City" autoComplete="address-level2" {...canadaPostProps('city', normalizeAddressText)} />;

  const provinceField = canadian ? (
    <Select
      label="Province / territory"
      options={PROVINCE_OPTIONS}
      placeholder="Select a province or territory"
      {...getProps('state')}
    />
  ) : (
    <Input label="State / province" autoComplete="address-level1" {...getProps('state')} />
  );

  const postalHint = canadian
    ? filled
      ? 'City and province filled in from this - edit them if not quite right.'
      : profile
        ? 'Fills in a blank city and province.'
        : undefined
    : undefined;

  const postalField = (
    <Input
      label="Postal code"
      placeholder={canadian ? 'A1A 1A1' : undefined}
      autoComplete="postal-code"
      hint={postalHint}
      {...postalCodeProps}
    />
  );

  const countryOptions = values.country && !COUNTRY_OPTIONS.some((o) => o.value === values.country)
    ? [{ value: values.country, label: values.country }, ...COUNTRY_OPTIONS]
    : COUNTRY_OPTIONS;
  const countryField = profile ? (
    <Select label="Country" options={countryOptions} placeholder="Select a country" {...getProps('country')} />
  ) : (
    <Input label="Country" autoComplete="country-name" {...getProps('country')} />
  );

  const lines = formatMailingAddress(values, { recipient });
  const preview = lines.length ? (
    <div className="addr-preview">
      <p className="addr-preview__label" id={previewLabelId}>As it prints on mail (Canada Post format)</p>
      <pre className="addr-preview__lines" aria-labelledby={previewLabelId}>{lines.join('\n')}</pre>
    </div>
  ) : null;

  if (profile) {
    return (
      <div className="pf-grid">
        <div className="pf-span-2">{line2Field}</div>
        <div className="pf-span-2">{streetField}</div>
        {cityField}
        {provinceField}
        {postalField}
        {countryField}
        {preview && <div className="pf-span-2">{preview}</div>}
      </div>
    );
  }

  return (
    <>
      {line2Field}
      {streetField}
      {cityField}
      {provinceField}
      {postalField}
      {countryField}
      {preview}
    </>
  );
}
