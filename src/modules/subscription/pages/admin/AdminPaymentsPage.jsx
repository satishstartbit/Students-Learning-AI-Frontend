import { useCallback, useEffect, useState } from 'react';
import {
  PageHeader,
  Button,
  Card,
  DataTable,
  Select,
  StatusBadge,
  Badge,
  Modal,
  Textarea,
  Input,
  Alert,
  Toast,
} from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { usePagination } from '../../../../hooks/usePagination';
import { toast } from '../../../../hooks/useToast';
import { formatDate } from '../../../../utils/date';
import { formatCurrency, formatName } from '../../../../utils/format';
import { getErrorMessage } from '../../../../utils/errorHandler';
import subscriptionService from '../../services/subscription.service';

const STATUS_OPTIONS = [
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'partially_refunded', label: 'Partially refunded' },
];

const TYPE_OPTIONS = [
  { value: 'payment', label: 'Payment' },
  { value: 'refund', label: 'Refund' },
  { value: 'failed_payment', label: 'Failed payment' },
];

/**
 * /admin/payments - the billing ledger, and where refunds are issued.
 *
 * A refund calls Stripe against the original PaymentIntent and is recorded
 * against the payment. Refunding the FULL remaining amount also cancels the
 * subscription; a partial refund leaves it running - the modal says so
 * explicitly, since that is easy to trigger by accident otherwise.
 */
export default function AdminPaymentsPage() {
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  const [status, setStatus] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [refundTarget, setRefundTarget] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState(null);
  const [refunding, setRefunding] = useState(false);

  const { data, meta, error, isLoading, run } = useApi(subscriptionService.adminListPayments);

  const load = useCallback(
    () => run({ page, limit, status, transactionType, from, to }),
    [run, page, limit, status, transactionType, from, to]
  );

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const resetTo = (setter) => (value) => {
    setter(value);
    goToPage(1);
  };

  const refundableAmount = (row) => Number(row.amount) - Number(row.refundAmount ?? 0);

  const canRefund = (row) =>
    row.transactionType === 'payment' &&
    row.status !== 'refunded' &&
    refundableAmount(row) > 0 &&
    Boolean(row.stripePaymentIntentId);

  const openRefund = (row) => {
    setRefundTarget(row);
    // Defaults to the whole remaining amount - the common case.
    setRefundAmount(String(refundableAmount(row).toFixed(2)));
    setRefundReason('');
    setRefundError(null);
  };

  const submitRefund = async () => {
    const amount = Number(refundAmount);
    const max = refundableAmount(refundTarget);

    if (!(amount > 0)) return setRefundError('Enter a refund amount greater than zero');
    if (amount > max) return setRefundError(`That is more than the ${max.toFixed(2)} still refundable`);

    setRefunding(true);
    setRefundError(null);
    try {
      await subscriptionService.adminRefundPayment(refundTarget.id, {
        amount,
        reason: refundReason.trim() || null,
      });
      toast.success('Refund issued');
      setRefundTarget(null);
      load().catch(() => {});
    } catch (err) {
      setRefundError(getErrorMessage(err));
    } finally {
      setRefunding(false);
    }
  };

  const columns = [
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'parent',
      header: 'Parent',
      render: (row) => (
        <div>
          {formatName(row.parent)}
          <div className="ui-hint">{row.parent?.email}</div>
        </div>
      ),
    },
    { key: 'planName', header: 'Plan', render: (row) => row.planName ?? '—' },
    {
      key: 'transactionType',
      header: 'Type',
      render: (row) => (
        <Badge variant={row.transactionType === 'refund' ? 'warning' : 'neutral'}>
          {row.transactionType.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <div>
          <strong>{formatCurrency(row.amount, row.currency)}</strong>
          {row.discountApplied > 0 && (
            <div className="ui-hint">−{formatCurrency(row.discountApplied, row.currency)} coupon</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status} />
          {row.refundAmount > 0 && (
            <div className="ui-hint">{formatCurrency(row.refundAmount, row.currency)} refunded</div>
          )}
          {row.failureReason && <div className="ui-hint">{row.failureReason}</div>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) =>
        canRefund(row) ? (
          <Button size="sm" variant="secondary" onClick={() => openRefund(row)}>
            Refund
          </Button>
        ) : (
          <span className="ui-hint">—</span>
        ),
    },
  ];

  const hasFilters = Boolean(status || transactionType || from || to);
  const isFullRefund =
    refundTarget && Number(refundAmount) >= refundableAmount(refundTarget) - 0.001;

  return (
    <>
      <PageHeader
        title="Payments & Refunds"
        description="Every charge, failure and refund across the platform."
        breadcrumbs={[{ label: 'Payments' }]}
      />

      <Card flat className="ui-field">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={status}
            onChange={(e) => resetTo(setStatus)(e.target.value)}
          />
          <Select
            label="Type"
            options={TYPE_OPTIONS}
            placeholder="All types"
            value={transactionType}
            onChange={(e) => resetTo(setTransactionType)(e.target.value)}
          />
          <Input label="From" type="date" value={from} onChange={(e) => resetTo(setFrom)(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => resetTo(setTo)(e.target.value)} />
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={hasFilters ? 'No payments match those filters' : 'No payments yet'}
        emptyDescription={
          hasFilters
            ? 'Try changing the filters.'
            : 'Charges appear here as parents subscribe and renew.'
        }
        caption="Payments"
      />

      <Modal
        isOpen={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        title="Issue a refund"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRefundTarget(null)} disabled={refunding}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submitRefund} loading={refunding}>
              Refund {refundAmount ? formatCurrency(refundAmount, refundTarget?.currency) : ''}
            </Button>
          </>
        }
      >
        {refundError && (
          <Alert variant="error" className="ui-field">
            {refundError}
          </Alert>
        )}

        <p>
          Refunding {formatName(refundTarget?.parent)}&apos;s payment of{' '}
          <strong>{formatCurrency(refundTarget?.amount, refundTarget?.currency)}</strong>
          {refundTarget?.refundAmount > 0 && (
            <>
              {' '}
              ({formatCurrency(refundTarget.refundAmount, refundTarget.currency)} already refunded,{' '}
              {formatCurrency(refundableAmount(refundTarget), refundTarget.currency)} remaining)
            </>
          )}
          .
        </p>

        <Input
          label="Refund amount"
          type="number"
          step="0.01"
          min="0"
          max={refundTarget ? refundableAmount(refundTarget) : undefined}
          value={refundAmount}
          onChange={(e) => setRefundAmount(e.target.value)}
        />

        <Textarea
          label="Reason"
          rows={2}
          placeholder="Recorded against the payment"
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
        />

        <Alert variant={isFullRefund ? 'warning' : 'info'}>
          {isFullRefund
            ? 'This refunds the full remaining amount, which will also cancel the parent’s subscription.'
            : 'This is a partial refund. The subscription stays active.'}
        </Alert>
      </Modal>

      <Toast />
    </>
  );
}
