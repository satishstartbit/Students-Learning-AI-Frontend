import { LuCopy, LuExternalLink } from 'react-icons/lu';
import { IconButton } from '../../../../components/common';
import { Tooltip } from '../../../../components/ui/tooltip';
import { toast } from '../../../../hooks/useToast';
import { stripeDashboardUrl } from './adminBilling';
import './adminBilling.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

/** "pi_3Oa...b7f2" - short enough for a table cell; the full id is in the title and the copy. */
const shortId = (id) => (id && id.length > 16 ? `${id.slice(0, 10)}…${id.slice(-4)}` : id);

/**
 * A Stripe payment reference: the id (short in tables, full in details), a
 * copy button and "Open in Stripe" (the dashboard page - a link, not an API
 * call; test keys open the test dashboard).
 */
export default function TransactionId({ id, full = false, showLink = true }) {
  if (!id) return <span className="ui-hint">—</span>;
  const url = showLink ? stripeDashboardUrl(id, PUBLISHABLE_KEY) : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success('Transaction ID copied');
    } catch {
      toast.error('Could not copy - select the ID and copy it instead');
    }
  };

  return (
    <span className="ab-txn">
      <span className="ab-txn__id" title={id}>
        {full ? id : shortId(id)}
      </span>
      <Tooltip label="Copy transaction ID" side="top">
        <IconButton icon={<LuCopy aria-hidden="true" />} label="Copy transaction ID" size="sm" onClick={copy} />
      </Tooltip>
      {url && (
        <a className="ab-txn__link" href={url} target="_blank" rel="noopener noreferrer">
          Open in Stripe <LuExternalLink aria-hidden="true" />
          <span className="ui-sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </span>
  );
}
