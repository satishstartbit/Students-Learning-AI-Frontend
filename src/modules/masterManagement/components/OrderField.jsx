import { Input } from '../../../components/common';

/**
 * The Order field every master form shares. Orders are unique within a list
 * (backend services/masterOrder.service.js): a number another item already
 * has comes back as an error under this field. Blank on a new item = the next
 * free number, at the end of the list. Send it with `orderPayload`.
 */
export default function OrderField({ isEdit = false, hint, ...fieldProps }) {
  const rule = isEdit
    ? 'Each item has its own number - two items in this list can’t share one.'
    : 'Each item has its own number. Leave blank to put it at the end of the list.';
  return (
    <Input
      label="Order"
      type="number"
      min="0"
      step="1"
      inputMode="numeric"
      placeholder={isEdit ? undefined : 'Next free number'}
      hint={hint ? `${hint} ${rule}` : rule}
      {...fieldProps}
    />
  );
}
