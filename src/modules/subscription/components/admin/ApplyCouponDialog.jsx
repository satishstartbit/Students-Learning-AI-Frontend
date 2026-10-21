import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, ErrorState, Loader, Modal, Select, Textarea } from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { formatDate } from '../../../../utils/date';
import { formatCurrency, formatName } from '../../../../utils/format';
import { getErrorMessage } from '../../../../utils/errorHandler';
import subscriptionService from '../../services/subscription.service';
import './adminBilling.css';

/**
 * Super Admin "Apply discount code" on a family's subscription (QA 2026-10-12).
 * The dropdown lists every active code: the ones this family can use, and
 * the others greyed out with the reason (expired, another plan, used up…).
 * Apply turns on once a usable code is picked; the code applies from the
 * next payment (backend services/adminCoupon.service.js). A refusal says why.
 *
 *   row        the subscription row (id, parent, plan)
 *   onClose()
 *   onApplied(result)
 */
const optionLabel = (o) => [o.code, o.label, o.name && o.name !== o.code ? o.name : null].filter(Boolean).join(' · ');

export default function ApplyCouponDialog({ row, onClose, onApplied }) {
  const options = useApi(subscriptionService.adminGetCouponOptions);
  const { run } = options;
  const [codeId, setCodeId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);

  useEffect(() => {
    if (row?.id) run(row.id).catch(() => {});
  }, [row?.id, run]);

  const data = options.data;
  const list = data?.options ?? [];
  const usable = list.filter((o) => o.available);
  const chosen = list.find((o) => o.id === codeId && o.available) ?? null;
  const now = data?.subscription?.nextPayment;
  const currency = data?.subscription?.plan?.currency ?? row?.plan?.currency;

  const apply = async () => {
    if (!chosen) return;
    setBusy(true);
    setProblem(null);
    try {
      const { data: result } = await subscriptionService.adminApplyCoupon(row.id, { discountCodeId: chosen.id, note });
      const when = result.nextPayment?.date ? ` from the next payment on ${formatDate(result.nextPayment.date)}` : '';
      toast.success(`${result.discountCode.code} applies${when}.`, { title: 'Discount code applied' });
      onApplied?.(result);
    } catch (err) {
      // The server says exactly why (expired, already used…) - never a generic error.
      setProblem(getErrorMessage(err));
      run(row.id).catch(() => {}); // the list may have changed (someone used the last place)
    } finally {
      setBusy(false);
    }
  };

  const parentName = row?.parent ? formatName(row.parent) : 'this family';

  let body;
  if (options.error && !data) body = <ErrorState error={options.error} variant="compact" onRetry={() => run(row.id).catch(() => {})} />;
  else if (!data) body = <Loader message="Loading discount codes…" />;
  else
    body = (
      <div className="ab-coupon">
        <dl className="ab-coupon__facts">
          <div>
            <dt>Family</dt>
            <dd>{parentName}</dd>
          </div>
          <div>
            <dt>Plan</dt>
            <dd>{data.subscription.plan?.name ?? '—'}</dd>
          </div>
          <div>
            <dt>Discount now</dt>
            <dd>{data.subscription.currentCode ? `${data.subscription.currentCode.code} · ${data.subscription.currentCode.label}` : 'None'}</dd>
          </div>
          <div>
            <dt>Next payment</dt>
            <dd>{now ? `${formatCurrency(now.total, currency)}${now.date ? ` on ${formatDate(now.date)}` : ''}` : '—'}</dd>
          </div>
        </dl>

        {list.length === 0 ? (
          <Alert variant="info" title="No active discount codes">
            Create one in <Link to="/admin/masters/discount-codes">Discount codes</Link> first.
          </Alert>
        ) : (
          <>
            <Select
              label="Discount code"
              name="discountCodeId"
              placeholder="Choose a code"
              value={codeId}
              onChange={(e) => {
                setCodeId(e.target.value);
                setProblem(null);
              }}
              options={list.map((o) => ({
                value: o.id,
                label: o.available ? optionLabel(o) : `${optionLabel(o)} - ${o.reason}`,
                disabled: !o.available,
                title: o.reason ?? undefined,
              }))}
              hint={`${usable.length} of ${list.length} active ${list.length === 1 ? 'code' : 'codes'} can be used for this family. The others show why not.`}
            />
            {usable.length === 0 && (
              <Alert variant="info">None of the active codes can be used for this family right now - each one in the list says why.</Alert>
            )}
          </>
        )}

        {chosen && (
          <p className="ab-coupon__preview" aria-live="polite">
            From the next payment{chosen.nextPayment?.date ? ` on ${formatDate(chosen.nextPayment.date)}` : ''}:{' '}
            {now && now.total !== chosen.nextPayment.total && <s>{formatCurrency(now.total, currency)}</s>}{' '}
            <strong>{formatCurrency(chosen.nextPayment.total, currency)}</strong> (before tax)
            {chosen.nextPayment.minimumApplied ? ` - the plan's minimum payment of ${formatCurrency(chosen.nextPayment.minimumAmount, currency)}` : ''}. A
            payment already taken is not changed.
          </p>
        )}

        {problem && (
          <Alert variant="error" title="The code wasn't applied">
            {problem}
          </Alert>
        )}

        <Textarea label="Note (optional, for the change log)" value={note} maxLength={500} rows={2} onChange={(e) => setNote(e.target.value)} />
      </div>
    );

  return (
    <Modal
      isOpen={Boolean(row)}
      onClose={busy ? undefined : onClose}
      title="Apply discount code"
      description={`For ${parentName}'s subscription. It counts as one use of the code.`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={apply} loading={busy} disabled={!chosen || busy}>
            Apply
          </Button>
        </>
      }
    >
      {body}
    </Modal>
  );
}
