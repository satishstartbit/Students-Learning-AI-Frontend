import { useCallback, useEffect, useState } from 'react';
import {
  LuCircleCheck,
  LuCircleX,
  LuDownload,
  LuEllipsis,
  LuEye,
  LuRotateCcw,
  LuUndo2,
  LuWallet,
} from 'react-icons/lu';
import {
  PageHeader,
  Button,
  Card,
  DataTable,
  Select,
  SearchInput,
  StatCard,
  StatusBadge,
  Badge,
  Modal,
  Drawer,
  Dropdown,
  IconButton,
  Textarea,
  Input,
  Alert,
  Toast,
} from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { usePagination } from '../../../../hooks/usePagination';
import { useDebounce } from '../../../../hooks/useDebounce';
import { toast } from '../../../../hooks/useToast';
import { PAGINATION } from '../../../../utils/constants';
import { formatDate } from '../../../../utils/date';
import { formatCurrency, formatName, formatNumber, titleCase } from '../../../../utils/format';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { downloadTextFile } from '../../../../utils/file';
import { describeCard } from '../../stripe';
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

const ROWS_PER_PAGE_OPTIONS = PAGINATION.PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }));

/** "pi_3Oa...b7f2" - short enough for a table cell; the full id is still in the title attribute and the details drawer. */
const shortId = (id) => (id ? `${id.slice(0, 10)}…${id.slice(-4)}` : null);

/** { direction, value } for StatCard, or undefined when there's nothing in the prior period to compare against. */
function statTrend(changePercent) {
  if (changePercent === null || changePercent === undefined) return undefined;
  const rounded = Math.round(changePercent * 10) / 10;
  return { direction: rounded >= 0 ? 'up' : 'down', value: `${rounded >= 0 ? '+' : ''}${rounded}%` };
}

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
  const { page, limit, applyMeta, goToPage, setLimit } = pagination;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const [refundTarget, setRefundTarget] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState(null);
  const [refunding, setRefunding] = useState(false);

  // Read-only detail view, sourced entirely from the row the list already
  // loaded - no separate "get one payment" endpoint exists, so this opens no
  // extra request.
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [exporting, setExporting] = useState(false);

  const { data, meta, error, isLoading, run } = useApi(subscriptionService.adminListPayments);
  // The 4 KPI tiles track the date range only (not status/type/search) - see
  // services/subscription.service.js#getPaymentStats for why: narrowing the
  // *table* to "refunded" shouldn't also zero out "Successful Payments" above it.
  const stats = useApi(subscriptionService.adminGetPaymentStats, { immediate: true });

  const load = useCallback(
    () => run({ page, limit, status, transactionType, from, to, search: debouncedSearch }),
    [run, page, limit, status, transactionType, from, to, debouncedSearch]
  );

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  useEffect(() => {
    stats.run({ from, to }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const resetTo = (setter) => (value) => {
    setter(value);
    goToPage(1);
  };

  const hasFilters = Boolean(search || status || transactionType || from || to);

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setTransactionType('');
    setFrom('');
    setTo('');
    goToPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: csv } = await subscriptionService.adminExportPayments({ status, transactionType, from, to, search: debouncedSearch });
      downloadTextFile(`payments-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
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

  /** Opened from the details drawer: close it first so only one panel is ever on screen. */
  const openRefundFromDetails = (row) => {
    setDetailsTarget(null);
    openRefund(row);
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
          <div style={{ fontWeight: 600 }}>{formatName(row.parent)}</div>
          <div className="ui-hint">{row.parent?.email}</div>
        </div>
      ),
    },
    {
      key: 'planName',
      header: 'Plan',
      // Lower-priority on a narrow screen - still one tap away in "View Details".
      className: 'hidden lg:table-cell',
      render: (row) => row.planName ?? '—',
    },
    {
      key: 'transaction',
      header: 'Transaction',
      className: 'hidden lg:table-cell',
      render: (row) =>
        row.stripePaymentIntentId ? (
          <span
            title={row.stripePaymentIntentId}
            style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-sm)' }}
          >
            {shortId(row.stripePaymentIntentId)}
          </span>
        ) : (
          <span className="ui-hint">—</span>
        ),
    },
    {
      key: 'transactionType',
      header: 'Type',
      render: (row) => (
        <Badge variant={row.transactionType === 'refund' ? 'warning' : 'neutral'}>
          {titleCase(row.transactionType)}
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
      render: (row) => (
        <Dropdown
          align="end"
          trigger={<IconButton icon={<LuEllipsis aria-hidden="true" />} label={`Actions for this ${row.transactionType}`} size="sm" />}
          items={[
            { key: 'view', label: 'View Details', icon: <LuEye aria-hidden="true" />, onClick: () => setDetailsTarget(row) },
            ...(canRefund(row)
              ? [{ key: 'refund', label: 'Refund Payment', icon: <LuUndo2 aria-hidden="true" />, onClick: () => openRefund(row) }]
              : []),
          ]}
        />
      ),
    },
  ];

  const isFullRefund =
    refundTarget && Number(refundAmount) >= refundableAmount(refundTarget) - 0.001;

  return (
    <>
      <PageHeader
        title="Payments & Refunds"
        description="Monitor and manage platform payments, refunds, and billing activity."
        breadcrumbs={[{ label: 'Payments' }]}
        actions={
          <Button variant="secondary" onClick={handleExport} loading={exporting} startIcon={<LuDownload aria-hidden="true" />}>
            Export
          </Button>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <StatCard
          label="Total Revenue"
          icon={<LuWallet aria-hidden="true" />}
          loading={stats.isLoading && !stats.data}
          value={formatCurrency(stats.data?.totalRevenue.value ?? 0)}
          trend={statTrend(stats.data?.totalRevenue.changePercent)}
          hint={`vs previous ${stats.data?.spanDays ?? 30} days`}
        />
        <StatCard
          label="Successful Payments"
          icon={<LuCircleCheck aria-hidden="true" />}
          loading={stats.isLoading && !stats.data}
          value={formatNumber(stats.data?.successfulPayments.value ?? 0)}
          trend={statTrend(stats.data?.successfulPayments.changePercent)}
          hint={`vs previous ${stats.data?.spanDays ?? 30} days`}
        />
        <StatCard
          label="Refunded Amount"
          icon={<LuUndo2 aria-hidden="true" />}
          loading={stats.isLoading && !stats.data}
          value={formatCurrency(stats.data?.refundedAmount.value ?? 0)}
          trend={statTrend(stats.data?.refundedAmount.changePercent)}
          hint={`vs previous ${stats.data?.spanDays ?? 30} days`}
        />
        <StatCard
          label="Failed Payments"
          icon={<LuCircleX aria-hidden="true" />}
          loading={stats.isLoading && !stats.data}
          value={formatNumber(stats.data?.failedPayments.value ?? 0)}
          trend={statTrend(stats.data?.failedPayments.changePercent)}
          hint={`vs previous ${stats.data?.spanDays ?? 30} days`}
        />
      </div>

      <Card flat className="ui-field">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 220px', minWidth: 220 }}>
            <SearchInput
              value={search}
              onChange={(e) => resetTo(setSearch)(e.target.value)}
              onClear={() => resetTo(setSearch)('')}
              placeholder="Search parent, email, transaction ID…"
              aria-label="Search payments"
            />
          </div>
          <div
            style={{
              flex: '2 1 480px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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

          <Button
            variant="secondary"
            onClick={resetFilters}
            disabled={!hasFilters}
            startIcon={<LuRotateCcw aria-hidden="true" />}
          >
            Reset
          </Button>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-sm)' }}>
        <div style={{ width: 140 }}>
          <Select
            label="Rows per page"
            options={ROWS_PER_PAGE_OPTIONS}
            value={String(limit)}
            onChange={(e) => setLimit(Number(e.target.value))}
            reserveHelper={false}
          />
        </div>
      </div>

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
            ? 'There are no transactions matching your current filters.'
            : 'Charges appear here as parents subscribe and renew.'
        }
        emptyAction={
          hasFilters ? (
            <Button variant="secondary" onClick={resetFilters}>
              Clear Filters
            </Button>
          ) : undefined
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

      <Drawer
        isOpen={Boolean(detailsTarget)}
        onClose={() => setDetailsTarget(null)}
        title="Payment Details"
        footer={
          detailsTarget && canRefund(detailsTarget) ? (
            <Button variant="danger" onClick={() => openRefundFromDetails(detailsTarget)}>
              Refund Payment
            </Button>
          ) : undefined
        }
      >
        {detailsTarget && (
          <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
            <div>
              <p className="ui-hint" style={{ margin: '0 0 4px' }}>
                Status
              </p>
              <StatusBadge status={detailsTarget.status} />
            </div>

            <div>
              <p className="ui-hint" style={{ margin: '0 0 4px' }}>
                Amount
              </p>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {formatCurrency(detailsTarget.amount, detailsTarget.currency)}{' '}
                <span className="ui-hint" style={{ fontWeight: 400, fontSize: 'var(--font-size-sm)' }}>
                  {detailsTarget.currency}
                </span>
              </p>
              {detailsTarget.discountApplied > 0 && (
                <p className="ui-hint" style={{ margin: '4px 0 0' }}>
                  −{formatCurrency(detailsTarget.discountApplied, detailsTarget.currency)} coupon applied
                </p>
              )}
            </div>

            <div>
              <p className="ui-hint" style={{ margin: '0 0 4px' }}>
                Customer
              </p>
              <p style={{ margin: 0, fontWeight: 600 }}>{formatName(detailsTarget.parent)}</p>
              <p className="ui-hint" style={{ margin: 0 }}>
                {detailsTarget.parent?.email}
              </p>
            </div>

            <div>
              <p className="ui-hint" style={{ margin: '0 0 4px' }}>
                Plan
              </p>
              <p style={{ margin: 0 }}>{detailsTarget.planName ?? '—'}</p>
            </div>

            <div>
              <p className="ui-hint" style={{ margin: '0 0 4px' }}>
                Type
              </p>
              <Badge variant={detailsTarget.transactionType === 'refund' ? 'warning' : 'neutral'}>
                {titleCase(detailsTarget.transactionType)}
              </Badge>
            </div>

            <div>
              <p className="ui-hint" style={{ margin: '0 0 4px' }}>
                Transaction ID
              </p>
              <p style={{ margin: 0, fontFamily: 'var(--font-family-mono)', wordBreak: 'break-all' }}>
                {detailsTarget.stripePaymentIntentId ?? 'Not available'}
              </p>
            </div>

            <div>
              <p className="ui-hint" style={{ margin: '0 0 4px' }}>
                Payment Date
              </p>
              <p style={{ margin: 0 }}>{formatDate(detailsTarget.createdAt)}</p>
            </div>

            {detailsTarget.cardLast4 && (
              <div>
                <p className="ui-hint" style={{ margin: '0 0 4px' }}>
                  Payment Method
                </p>
                <p style={{ margin: 0 }}>{describeCard({ brand: detailsTarget.cardBrand, last4: detailsTarget.cardLast4 })}</p>
              </div>
            )}

            <div>
              <p className="ui-hint" style={{ margin: '0 0 4px' }}>
                Refund
              </p>
              <p style={{ margin: 0 }}>{formatCurrency(detailsTarget.refundAmount ?? 0, detailsTarget.currency)}</p>
              {detailsTarget.refundReason && (
                <p className="ui-hint" style={{ margin: '4px 0 0' }}>
                  Reason: {detailsTarget.refundReason}
                </p>
              )}
            </div>

            {detailsTarget.failureReason && <Alert variant="error">{detailsTarget.failureReason}</Alert>}
          </div>
        )}
      </Drawer>

      <Toast />
    </>
  );
}
