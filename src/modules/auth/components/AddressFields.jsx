import { useEffect, useRef, useState } from 'react';
import { Input, Select, Textarea } from '../../../components/common';
import { useDebounce } from '../../../hooks/useDebounce';
import { CANADIAN_PROVINCES } from '../../../utils/locale';
import { formatCanadianPostalCode } from '../../../utils/postalCode';
import postalLookupService from '../services/postalLookup.service';

/**
 * The address field group shared by every self-profile form (Teacher, Parent)
 * and the parent's child-edit form - one copy instead of three, following the
 * same address/city/state/country/postalCode shape and Canada-conditional
 * province/postal-code behavior already established in
 * modules/masterManagement/pages/schools/SchoolFormPage.jsx.
 *
 * `values`/`getProps`/`setFieldValue` are `useForm`'s own return values -
 * this component owns no state of its own beyond the postal-code lookup.
 */
const isCanada = (country) =>
  !country || ['CA', 'CAN', 'CANADA'].includes(String(country).trim().toUpperCase());

const PROVINCE_OPTIONS = CANADIAN_PROVINCES.map((p) => ({ value: p.code, label: `${p.name} (${p.code})` }));

/** Country picker for the profile layout: the platform is Canadian, with the US as the one other common case. */
const COUNTRY_OPTIONS = [
  { value: 'Canada', label: 'Canada' },
  { value: 'United States', label: 'United States' },
];

/**
 * `layout="profile"` is the My Profile pages' arrangement (street address,
 * then postal code + city, then province + country, two to a row, with a
 * short "fills in from this" hint); the default stacked layout is unchanged
 * for the other forms that use this component.
 */
export default function AddressFields({ values, getProps, setFieldValue, layout = 'stacked' }) {
  const canadian = isCanada(values.country);

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
        if (data.city && !values.city) setFieldValue('city', data.city);
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

  const postalCodeProps = {
    ...getProps('postalCode'),
    onChange: (e) => {
      const raw = e.target.value;
      setFieldValue('postalCode', canadian ? formatCanadianPostalCode(raw) : raw);
    },
  };

  if (layout === 'profile') {
    const countryOptions = values.country && !COUNTRY_OPTIONS.some((o) => o.value === values.country)
      ? [{ value: values.country, label: values.country }, ...COUNTRY_OPTIONS]
      : COUNTRY_OPTIONS;
    return (
      <div className="pf-grid">
        <div className="pf-span-2">
          <Input label="Street address" autoComplete="street-address" {...getProps('address')} />
        </div>
        <Input
          label="Postal code"
          placeholder={canadian ? 'A1A 1A1' : undefined}
          autoComplete="postal-code"
          hint={canadian ? (filled ? 'City and province filled in from this - edit them if not quite right.' : 'City and province fill in from this.') : undefined}
          {...postalCodeProps}
        />
        <Input label="City" autoComplete="address-level2" {...getProps('city')} />
        {canadian ? (
          <Select
            label="Province / territory"
            options={PROVINCE_OPTIONS}
            placeholder="Select a province or territory"
            {...getProps('state')}
          />
        ) : (
          <Input label="State / province" {...getProps('state')} />
        )}
        <Select label="Country" options={countryOptions} placeholder="Select a country" {...getProps('country')} />
      </div>
    );
  }

  return (
    <>
      <Textarea label="Address" rows={2} {...getProps('address')} />
      <Input label="City" {...getProps('city')} />
      <Input label="Country" {...getProps('country')} />

      {canadian ? (
        <Select
          label="Province / Territory"
          options={PROVINCE_OPTIONS}
          placeholder="Select a province or territory"
          {...getProps('state')}
        />
      ) : (
        <Input label="State / Province" {...getProps('state')} />
      )}

      <Input
        label="Postal code"
        placeholder={canadian ? 'A1A 1A1' : undefined}
        hint={canadian && filled ? 'City/province filled in from your postal code - edit them if not quite right.' : undefined}
        {...postalCodeProps}
      />
    </>
  );
}
