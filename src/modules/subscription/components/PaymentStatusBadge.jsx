import { Badge } from '../../../components/common';
import { PAYMENT_STATUS, paymentStatusLabel } from './paymentStatus';

/** A payment's status pill ("Paid", "Refunded", "Partly refunded", ...). */
export default function PaymentStatusBadge({ status }) {
  if (!status) return null;
  return (
    <Badge variant={PAYMENT_STATUS[status]?.variant ?? 'neutral'} className="sub-badge">
      {paymentStatusLabel(status)}
    </Badge>
  );
}
