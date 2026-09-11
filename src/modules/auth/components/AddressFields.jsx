import { Input, Select, Textarea } from '../../../components/common';
import { CANADIAN_PROVINCES } from '../../../utils/locale';
import { formatCanadianPostalCode } from '../../../utils/postalCode';

/**
 * The address field group shared by every self-profile form (Teacher, Parent)
 * and the parent's child-edit form - one copy instead of three, following the
 * same address/city/state/country/postalCode shape and Canada-conditional
 * province/postal-code behavior already established in
 * modules/masterManagement/pages/schools/SchoolFormPage.jsx.
 *
 * `values`/`getProps`/`setFieldValue` are `useForm`'s own return values -
 * this component owns no state of its own.
 */
const isCanada = (country) =>
  !country || ['CA', 'CAN', 'CANADA'].includes(String(country).trim().toUpperCase());

const PROVINCE_OPTIONS = CANADIAN_PROVINCES.map((p) => ({ value: p.code, label: `${p.name} (${p.code})` }));

export default function AddressFields({ values, getProps, setFieldValue }) {
  const canadian = isCanada(values.country);

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
        {...getProps('postalCode')}
        onChange={(e) => {
          const raw = e.target.value;
          setFieldValue('postalCode', canadian ? formatCanadianPostalCode(raw) : raw);
        }}
      />
    </>
  );
}
