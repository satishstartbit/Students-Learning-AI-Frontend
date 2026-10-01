import { formatStatus } from '../../../utils/format';

/**
 * A payment's status in the words a family uses ("Paid", not "Succeeded"),
 * as the billing-history mockup shows it. Anything else falls back to the
 * shared status wording.
 */
export const PAYMENT_STATUS = {
  succeeded: { label: 'Paid', variant: 'success' },
  refunded: { label: 'Refunded', variant: 'neutral' },
  partially_refunded: { label: 'Partly refunded', variant: 'warning' },
  failed: { label: 'Failed', variant: 'danger' },
  pending: { label: 'Pending', variant: 'neutral' },
};

export const paymentStatusLabel = (status) => PAYMENT_STATUS[status]?.label ?? formatStatus(status);
