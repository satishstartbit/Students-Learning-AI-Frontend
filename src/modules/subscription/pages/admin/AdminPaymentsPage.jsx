import { useCallback, useEffect, useState } from 'react';
import {
  LuCircleCheck,
  LuCircleX,
  LuDownload,
  LuEllipsis,
  LuEye,
  LuFilterX,
  LuUndo2,
  LuWallet,
} from 'react-icons/lu';
import {
  PageHeader,
  Button,
  FilterBar,
  DataTable,
  Select,
  SearchInput,
  StatCard,
  StatusBadge,
  Badge,
  Drawer,
  Dropdown,
  IconButton,
  Input,
  Alert,
  Loader,
  ErrorState,
  Toast,
} from '../../../../components/common';
import { Tooltip } from '../../../../components/ui/tooltip';
import { useApi } from '../../../../hooks/useApi';
import { usePagination } from '../../../../hooks/usePagination';
import { useDebounce } from '../../../../hooks/useDebounce';
import { toast } from '../../../../hooks/useToast';
import { formatDate, formatDateTime } from '../../../../utils/date';
import { dateRangeLimits, dateRangeProblem } from '../../../../utils/dateRange';
import { formatCurrency, formatName, formatNumber, titleCase } from '../../../../utils/format';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { downloadTextFile } from '../../../../utils/file';
import subscriptionService from '../../services/subscription.service';
import RefundDialog from '../../components/admin/RefundDialog';
import TransactionId from '../../components/admin/TransactionId';
import {
  cardLabel,
  paymentStatusLabel,
  paymentStatusTone,
  refundReasonLabel,
  trendOf,
} from '../../components/admin/adminBilling';
import '../../components/admin/adminBilling.css';

const STATUS_OPTIONS = [
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'failed', label: 'Failed (payment or refund)' },
  { value: 'pending', label: 'Refund pending' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'partially_refunded', label: 'Partially refunded' },
];

const TYPE_OPTIONS = [
  { value: 'payment', label: 'Payment' },
  { value: 'refund', label: 'Refund' },
  { value: 'failed_payment', label: 'Failed payment' },
];

function Field({ label, children }) {
  return (
    <div>
      <p className="ui-hint" style={{ margin: '0 0 4px' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

/**
 * View Details: the row the list loaded, then the full record (card expiry,
 * every refund with who made it and why) once it arrives.
 */
function PaymentDetails({ row, onRefund, canRefund }) {
  const detail = useApi(subscriptionService.adminGetPayment, { immediate: true, args: [row.id] });
  const p = detail.data ?? row;
  const card = p.card ?? (p.cardLast4 ? { brand: p.cardBrand, last4: p.cardLast4 } : null);

  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
      <Field label="Status">
        <StatusBadge status={paymentStatusTone(p)} label={paymentStatusLabel(p) ?? undefined} />
      </Field>

      <Field label="Amount">
        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
          {formatCurrency(p.amount, p.currency)}{' '}
          <span className="ui-hint" style={{ fontWeight: 400, fontSize: 'var(--font-size-sm)' }}>
            {p.currency}
          </span>
        </p>
        {p.discountApplied > 0 && (
          <p className="ui-hint" style={{ margin: '4px 0 0' }}>
            −{formatCurrency(p.discountApplied, p.currency)} coupon applied
          </p>
        )}
        {p.taxLines?.length > 0 && (
          <p className="ui-hint" style={{ margin: '4px 0 0' }}>
            {formatCurrency(p.preTaxAmount, p.currency)} before tax ·{' '}
            {p.taxLines.map((line) => `${line.name} ${formatCurrency(line.amount, p.currency)}`).join(' · ')}
            {p.taxRegion ? ` (${p.taxRegion})` : ''}
          </p>
        )}
      </Field>

      <Field label="Customer">
        <p style={{ margin: 0, fontWeight: 600 }}>{formatName(p.parent)}</p>
        <p className="ui-hint" style={{ margin: 0 }}>
          {p.parent?.email}
        </p>
      </Field>

      <Field label="Plan">
        <p style={{ margin: 0 }}>
          {p.planName ?? '—'}
          {p.planBillingCycle ? ` · ${titleCase(p.planBillingCycle)}` : ''}
        </p>
      </Field>

      <Field label="Type">
        <Badge variant={p.transactionType === 'refund' ? 'warning' : 'neutral'}>{titleCase(p.transactionType)}</Badge>
      </Field>

      <Field label="Transaction ID">
        <TransactionId id={p.stripePaymentIntentId} full />
      </Field>

      <Field label="Date">
        <p style={{ margin: 0 }}>{formatDateTime(p.createdAt)}</p>
      </Field>

      {card && (
        <Field label="Payment method">
          <p style={{ margin: 0 }}>{cardLabel(card)}</p>
        </Field>
      )}

      {p.transactionType === 'refund' ? (
        <Field label="Refund">
          <p style={{ margin: 0 }}>
            {p.refundReasonCode ? refundReasonLabel(p.refundReasonCode) : 'No reason recorded'}
            {p.refundReason ? ` - ${p.refundReason}` : ''}
          </p>
          <p className="ui-hint" style={{ margin: '4px 0 0' }}>
            {p.refundedByUser ? `By ${formatName(p.refundedByUser)} (${p.refundedByUser.email})` : 'Who made it was not recorded'}
          </p>
        </Field>
      ) : (
        <Field label="Refunds">
          <p style={{ margin: 0 }}>
            {formatCurrency(p.refundAmount ?? 0, p.currency)} refunded
            {p.refundable != null ? ` · ${formatCurrency(p.refundable, p.currency)} still refundable` : ''}
          </p>
          {detail.isLoading && !detail.data ? (
            <Loader size="sm" message="Loading refunds…" />
          ) : detail.error ? (
            <ErrorState error={detail.error} variant="compact" onRetry={() => detail.run(row.id).catch(() => {})} />
          ) : (
            p.refunds?.length > 0 && (
              <ul className="ab-history" aria-label="Refunds made">
                {p.refunds.map((r) => (
                  <li key={r.id}>
                    <span>
                      {formatCurrency(r.amount, p.currency)}{' '}
                      <StatusBadge status={paymentStatusTone(r)} label={paymentStatusLabel(r)} />
                    </span>
                    <span className="ab-history__meta">
                      {formatDate(r.createdAt)}
                      {r.refundReasonCode ? ` · ${refundReasonLabel(r.refundReasonCode)}` : ''}
                      {r.refundReason ? ` · "${r.refundReason}"` : ''}
                      {r.refundedByUser ? ` · by ${formatName(r.refundedByUser)}` : ''}
                      {r.failureReason ? ` · ${r.failureReason}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )
          )}
        </Field>
      )}

      {p.failureReason && <Alert variant="error">{p.failureReason}</Alert>}

      {canRefund(p) && (
        <Button variant="danger" onClick={() => onRefund(p)} startIcon={<LuUndo2 aria-hidden="true" />}>
          Refund payment
        </Button>
      )}
    </div>
  );
}

/**
 * /admin/subscriptions/payments - the billing ledger, and where refunds are
 * issued (RefundDialog: the whole picture of the payment, a required reason,
 * one refund per click, typed confirmation and a keep-subscribed choice for a
 * full refund). Pending and failed refunds show as such.
 */
export default function AdminPaymentsPage() {
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  // { id, opening } - `opening` remounts the dialog so each opening gets a fresh request key.
  const [refundTarget, setRefundTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [exporting, setExporting] = useState(false);

  const { data, meta, error, isLoading, run } = useApi(subscriptionService.adminListPayments);
  // The 4 KPI tiles track the date range only (not status/type/search) - see
  // services/subscription.service.js#getPaymentStats for why.
  const stats = useApi(subscriptionService.adminGetPaymentStats, { immediate: true });

  // A To date before the From date is refused (QA 2026-10-12): said under To,
  // and nothing is fetched or exported until it's fixed.
  const rangeProblem = dateRangeProblem(from, to);
  const { fromMax, toMin } = dateRangeLimits(from, to);

  const load = useCallback(
    () => (rangeProblem ? Promise.resolve() : run({ page, limit, status, transactionType, from, to, search: debouncedSearch })),
    [run, page, limit, status, transactionType, from, to, debouncedSearch, rangeProblem]
  );

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  useEffect(() => {
    if (!rangeProblem) stats.run({ from, to }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, rangeProblem]);

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

  const remaining = (row) => Number(row.amount) - Number(row.refundAmount ?? 0);
  const canRefund = (row) =>
    row.transactionType === 'payment' && row.status !== 'refunded' && remaining(row) > 0.004 && Boolean(row.stripePaymentIntentId);

  const openRefund = (row) => {
    setDetailsTarget(null); // only one panel on screen at a time
    setRefundTarget({ id: row.id, opening: Date.now() });
  };

  const afterRefund = () => {
    setRefundTarget(null);
    load().catch(() => {});
    stats.run({ from, to }).catch(() => {});
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
      className: 'hidden lg:table-cell',
      render: (row) => row.planName ?? '—',
    },
    {
      key: 'transaction',
      header: 'Transaction',
      className: 'hidden lg:table-cell',
      render: (row) => <TransactionId id={row.stripePaymentIntentId} showLink={false} />,
    },
    {
      key: 'transactionType',
      header: 'Type',
      render: (row) => <Badge variant={row.transactionType === 'refund' ? 'warning' : 'neutral'}>{titleCase(row.transactionType)}</Badge>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <div>
          <strong>{formatCurrency(row.amount, row.currency)}</strong>
          {row.discountApplied > 0 && <div className="ui-hint">−{formatCurrency(row.discountApplied, row.currency)} coupon</div>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div>
          <StatusBadge status={paymentStatusTone(row)} label={paymentStatusLabel(row) ?? undefined} />
          {row.transactionType === 'payment' && row.refundAmount > 0 && (
            <div className="ui-hint">{formatCurrency(row.refundAmount, row.currency)} refunded</div>
          )}
          {row.transactionType === 'refund' && row.refundReasonCode && <div className="ui-hint">{refundReasonLabel(row.refundReasonCode)}</div>}
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
              ? [{ key: 'refund', label: 'Refund Payment', icon: <LuUndo2 aria-hidden="true" />, onClick: () => openRefund(row), danger: true }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="td-page">
      <PageHeader
        title="Payments & Refunds"
        description="Monitor and manage platform payments, refunds, and billing activity."
        breadcrumbs={[{ label: 'Payments' }]}
        actions={
          <Button variant="secondary" onClick={handleExport} loading={exporting} disabled={Boolean(rangeProblem)} startIcon={<LuDownload aria-hidden="true" />}>
            Export
          </Button>
        }
      />

      <div className="ab-statgrid">
        <StatCard
          label="Total Revenue"
          icon={<LuWallet aria-hidden="true" />}
          loading={stats.isLoading && !stats.data}
          value={formatCurrency(stats.data?.totalRevenue.value ?? 0)}
          trend={trendOf(stats.data?.totalRevenue.changePercent)}
          hint={`vs previous ${stats.data?.spanDays ?? 30} days`}
        />
        <StatCard
          label="Successful Payments"
          icon={<LuCircleCheck aria-hidden="true" />}
          loading={stats.isLoading && !stats.data}
          value={formatNumber(stats.data?.successfulPayments.value ?? 0)}
          trend={trendOf(stats.data?.successfulPayments.changePercent)}
          hint={`vs previous ${stats.data?.spanDays ?? 30} days`}
        />
        <StatCard
          label="Refunded Amount"
          icon={<LuUndo2 aria-hidden="true" />}
          loading={stats.isLoading && !stats.data}
          value={formatCurrency(stats.data?.refundedAmount.value ?? 0)}
          trend={trendOf(stats.data?.refundedAmount.changePercent)}
          hint={`Including pending · vs previous ${stats.data?.spanDays ?? 30} days`}
        />
        <StatCard
          label="Failed Payments"
          icon={<LuCircleX aria-hidden="true" />}
          loading={stats.isLoading && !stats.data}
          value={formatNumber(stats.data?.failedPayments.value ?? 0)}
          trend={trendOf(stats.data?.failedPayments.changePercent)}
          hint={`vs previous ${stats.data?.spanDays ?? 30} days`}
        />
      </div>

      <FilterBar>
        <SearchInput
          fieldClassName="ui-filterbar__search ui-field--compact"
          value={search}
          onChange={(e) => resetTo(setSearch)(e.target.value)}
          onClear={() => resetTo(setSearch)('')}
          placeholder="Search parent, email, transaction ID…"
          aria-label="Search payments"
        />
        <Select
          fieldClassName="ui-field--compact"
          label="Status"
          options={STATUS_OPTIONS}
          placeholder="All statuses"
          value={status}
          onChange={(e) => resetTo(setStatus)(e.target.value)}
        />
        <Select
          fieldClassName="ui-field--compact"
          label="Type"
          options={TYPE_OPTIONS}
          placeholder="All types"
          value={transactionType}
          onChange={(e) => resetTo(setTransactionType)(e.target.value)}
        />
        <Input fieldClassName="ui-field--compact-labeled" label="From" type="date" value={from} max={fromMax} onChange={(e) => resetTo(setFrom)(e.target.value)} />
        <Input
          fieldClassName="ui-field--compact-labeled"
          label="To"
          type="date"
          value={to}
          min={toMin}
          error={rangeProblem}
          onChange={(e) => resetTo(setTo)(e.target.value)}
        />

        <Tooltip label="Clear filters" side="top">
          <IconButton icon={<LuFilterX aria-hidden="true" />} label="Clear filters" size="sm" onClick={resetFilters} disabled={!hasFilters} />
        </Tooltip>
      </FilterBar>
      {/* The compact date fields keep no message line of their own, so the range problem is said here. */}
      {rangeProblem && (
        <p className="ui-helper__message ui-helper__message--error ab-range-error" role="alert">
          {rangeProblem}
        </p>
      )}

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={hasFilters ? 'No payments match those filters' : 'No payments yet'}
        emptyDescription={hasFilters ? 'There are no transactions matching your current filters.' : 'Charges appear here as parents subscribe and renew.'}
        emptyAction={
          hasFilters ? (
            <Button variant="secondary" onClick={resetFilters}>
              Clear Filters
            </Button>
          ) : undefined
        }
        caption="Payments"
      />

      {refundTarget && (
        <RefundDialog
          key={`${refundTarget.id}-${refundTarget.opening}`}
          paymentId={refundTarget.id}
          onClose={() => setRefundTarget(null)}
          onDone={afterRefund}
        />
      )}

      <Drawer isOpen={Boolean(detailsTarget)} onClose={() => setDetailsTarget(null)} title="Payment Details">
        {detailsTarget && <PaymentDetails key={detailsTarget.id} row={detailsTarget} canRefund={canRefund} onRefund={openRefund} />}
      </Drawer>

      <Toast />
    </div>
  );
}
