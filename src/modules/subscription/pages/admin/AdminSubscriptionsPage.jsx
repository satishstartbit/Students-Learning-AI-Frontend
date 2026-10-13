import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuBan, LuDownload, LuFilterX, LuMail, LuRefreshCw, LuTicketPercent } from 'react-icons/lu';
import {
  PageHeader,
  Button,
  IconButton,
  FilterBar,
  DataTable,
  SearchInput,
  Select,
  StatusBadge,
  Badge,
  Modal,
  ConfirmationModal,
  Textarea,
  Checkbox,
  Alert,
  Input,
  Toast,
  LuMail
} from '../../../../components/common';
import { Tooltip } from '../../../../components/ui/tooltip';
import { useApi } from '../../../../hooks/useApi';
import { usePagination } from '../../../../hooks/usePagination';
import { useDebounce } from '../../../../hooks/useDebounce';
import { toast } from '../../../../hooks/useToast';
import { formatDate } from '../../../../utils/date';
import { dateRangeLimits, dateRangeProblem } from '../../../../utils/dateRange';
import { formatCurrency, formatName } from '../../../../utils/format';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { downloadTextFile } from '../../../../utils/file';
import subscriptionService from '../../services/subscription.service';
import billingService from '../../../masterManagement/services/billing.service';
import RefundDialog from '../../components/admin/RefundDialog';
import ApplyCouponDialog from '../../components/admin/ApplyCouponDialog';
import { cardLabel, newRequestKey } from '../../components/admin/adminBilling';
import '../../components/admin/adminBilling.css';

const STATUS_OPTIONS = [
  { value: 'trialing', label: 'Trialing' },
  { value: 'active', label: 'Active' },
  { value: 'past_due', label: 'Past due' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

const isLive = (row) => ['trialing', 'active', 'past_due'].includes(row.status);

/** Past due: each retry (done ones struck through, the next one highlighted), grace end, last decline. */
function PastDueDetails({ pastDue }) {
  const next = pastDue.attempts?.find((a) => !a.done);
  return (
    <div className="ab-pastdue">
      <span className="ab-pastdue__retries" aria-label="Payment retries">
        Retries:
        {pastDue.attempts?.map((a) => (
          <span key={a.day} className="ab-retry" data-done={a.done || undefined} data-next={a === next || undefined} title={a.done ? 'Already tried' : 'Scheduled'}>
            {formatDate(a.at, { year: undefined })}
          </span>
        ))}
      </span>
      <span>Grace ends {formatDate(pastDue.graceEndsAt)}</span>
      {pastDue.lastFailureReason && <span>Last decline: {pastDue.lastFailureReason}</span>}
    </div>
  );
}

/**
 * /admin/subscriptions - every parent's subscription: cancel on a parent's
 * behalf (with "Refund unused time?" after cancelling now), and for past-due
 * rows the retry schedule, grace end, "Retry now" and "Email parent to update
 * card". A card that expires within the warning window is flagged. Export
 * downloads the filtered list as CSV.
 *
 * Plans and coupons themselves are edited in Master Management.
 */
export default function AdminSubscriptionsPage() {
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [planId, setPlanId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // After "Cancel immediately": the unused time the server worked out, then the refund dialog.
  const [offer, setOffer] = useState(null);
  const [refund, setRefund] = useState(null);

  // { row, key } - one request key per confirmation, so a double click charges once.
  const [retryTarget, setRetryTarget] = useState(null);
  const [couponTarget, setCouponTarget] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [reminding, setReminding] = useState(null);

  const debouncedSearch = useDebounce(search, 350);
  const { data, meta, error, isLoading, run } = useApi(subscriptionService.adminListSubscriptions);
  const { data: plans } = useApi(billingService.listPlans, { immediate: true, args: [{ limit: 100 }] });

  // A To date before the From date is refused (QA 2026-10-12): said under To,
  // and nothing is fetched or exported until it's fixed.
  const rangeProblem = dateRangeProblem(from, to);
  const { fromMax, toMin } = dateRangeLimits(from, to);

  const filters = { search: debouncedSearch, status, planId, from, to };
  const load = useCallback(
    () => (rangeProblem ? Promise.resolve() : run({ page, limit, search: debouncedSearch, status, planId, from, to })),
    [run, page, limit, debouncedSearch, status, planId, from, to, rangeProblem]
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

  const openCancel = (row) => {
    setCancelTarget(row);
    setCancelReason('');
    setCancelImmediate(false);
    setCancelError(null);
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Give a reason for cancelling this subscription');
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      const { data: result } = await subscriptionService.adminCancelSubscription(cancelTarget.id, {
        reason: cancelReason.trim(),
        immediate: cancelImmediate,
      });
      toast.success('Subscription cancelled');
      if (result?.refundOffer) setOffer({ ...result.refundOffer, parent: cancelTarget.parent, planName: cancelTarget.plan?.name });
      setCancelTarget(null);
      load().catch(() => {});
    } catch (err) {
      setCancelError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const confirmRetry = async () => {
    if (!retryTarget || retrying) return;
    setRetrying(true);
    try {
      const { data: result, message } = await subscriptionService.adminRetryPayment(retryTarget.row.id, retryTarget.key);
      if (result?.outcome === 'renewed') toast.success(message || 'Payment taken');
      else toast.error(result?.failureReason || message || 'The card was declined again', { title: 'Payment declined' });
      setRetryTarget(null);
      load().catch(() => {});
    } catch (err) {
      toast.error(getErrorMessage(err));
      setRetryTarget(null);
      load().catch(() => {});
    } finally {
      setRetrying(false);
    }
  };

  const remind = async (row) => {
    setReminding(row.id);
    try {
      const { message } = await subscriptionService.adminRemindCard(row.id);
      toast.success(message || 'Reminder sent', { title: `Emailed ${row.parent?.email ?? 'the parent'}` });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReminding(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: csv } = await subscriptionService.adminExportSubscriptions(filters);
      downloadTextFile(`subscriptions-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const planOptions = (plans ?? []).map((p) => ({ value: p.id, label: p.name }));

  const columns = [
    {
      key: 'parent',
      header: 'Parent',
      render: (row) => (
        <div>
          <strong>{formatName(row.parent)}</strong>
          <div className="ui-hint">{row.parent?.email}</div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (row) => (
        <div>
          {row.plan?.name ?? '—'}
          <div className="ui-hint">
            {row.plan?.billingCycle} · {formatCurrency(row.plan?.price ?? 0, row.plan?.currency)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="ab-status">
          <span className="ab-status__line">
            <StatusBadge status={row.status} />
            {row.cancelAtPeriodEnd && row.status !== 'cancelled' && row.status !== 'expired' && <Badge variant="warning">Ends at period</Badge>}
            {isLive(row) && row.card?.expired && (
              <Badge variant="danger" title={`${cardLabel(row.card)} has expired`}>
                Card expired
              </Badge>
            )}
            {isLive(row) && row.card?.expiresSoon && (
              <Badge variant="warning" title={`${cardLabel(row.card)} - the parent was emailed`}>
                Card expires {row.card.expiryLabel}
              </Badge>
            )}
          </span>
          {row.status === 'past_due' && row.pastDue && <PastDueDetails pastDue={row.pastDue} />}
        </div>
      ),
    },
    {
      key: 'currentPeriodEnd',
      header: 'Renews',
      sortable: true,
      render: (row) => (row.currentPeriodEnd ? formatDate(row.currentPeriodEnd) : '—'),
    },
    {
      key: 'discountCode',
      header: 'Coupon',
      render: (row) => (row.discountCode ? <Badge variant="primary">{row.discountCode.code}</Badge> : '—'),
    },
    { key: 'childrenCount', header: 'Children', align: 'right', render: (row) => row.childrenCount ?? 0 },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) =>
        isLive(row) ? (
          <span className="ab-actions">
            {row.status === 'past_due' && (
              <>
                <Tooltip label="Retry payment now" side="top">
                  <IconButton
                    icon={<LuRefreshCw aria-hidden="true" />}
                    label="Retry payment now"
                    size="sm"
                    onClick={() => setRetryTarget({ row, key: newRequestKey() })}
                  />
                </Tooltip>
                <Tooltip label="Email parent to update card" side="top">
                  <IconButton
                    icon={<LuMail aria-hidden="true" />}
                    label="Email parent to update card"
                    size="sm"
                    loading={reminding === row.id}
                    disabled={reminding === row.id}
                    onClick={() => remind(row)}
                  />
                </Tooltip>
              </>
            )}
            {!row.cancelAtPeriodEnd && (
              <Tooltip label="Apply discount code" side="top">
                <IconButton
                  icon={<LuTicketPercent aria-hidden="true" />}
                  label="Apply discount code"
                  size="sm"
                  onClick={() => setCouponTarget(row)}
                />
              </Tooltip>
            )}
            <Tooltip label="Cancel subscription" side="top">
              <IconButton icon={<LuBan aria-hidden="true" />} label="Cancel subscription" variant="danger" size="sm" onClick={() => openCancel(row)} />
            </Tooltip>
          </span>
        ) : (
          <span className="ui-hint">—</span>
        ),
    },
  ];

  const hasFilters = Boolean(search || status || planId || from || to);
  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPlanId('');
    setFrom('');
    setTo('');
    goToPage(1);
  };

  return (
    <div className="td-page">
      <PageHeader
        title="Subscriptions"
        description="Every parent subscription across the platform."
        breadcrumbs={[{ label: 'Subscriptions' }]}
        actions={
          <>
            <Button variant="secondary" onClick={handleExport} loading={exporting} disabled={Boolean(rangeProblem)} startIcon={<LuDownload aria-hidden="true" />}>
              Export
            </Button>
            <Button as={Link} to="/admin/masters/discount-codes" variant="secondary">
              Discount codes
            </Button>
            <Button as={Link} to="/admin/masters/subscription-plans" variant="secondary">
              Manage plans
            </Button>
          </>
        }
      />

      <FilterBar>
        <SearchInput
          fieldClassName="ui-filterbar__search ui-field--compact"
          placeholder="Name or email"
          value={search}
          onChange={(e) => resetTo(setSearch)(e.target.value)}
          onClear={() => resetTo(setSearch)('')}
        />
        <Select fieldClassName="ui-field--compact" label="Status" options={STATUS_OPTIONS} placeholder="All statuses" value={status} onChange={(e) => resetTo(setStatus)(e.target.value)} />
        <Select fieldClassName="ui-field--compact" label="Plan" options={planOptions} placeholder="All plans" value={planId} onChange={(e) => resetTo(setPlanId)(e.target.value)} />
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
          <IconButton icon={<LuFilterX aria-hidden="true" />} label="Clear filters" size="sm" onClick={clearFilters} disabled={!hasFilters} />
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
        emptyTitle={hasFilters ? 'No subscriptions match those filters' : 'No subscriptions yet'}
        emptyDescription={hasFilters ? 'Try clearing the search or changing the filters.' : 'Subscriptions appear here once a parent checks out.'}
        caption="Subscriptions"
      />

      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel this subscription?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelTarget(null)} disabled={cancelling}>
              Keep it
            </Button>
            <Button variant="danger" onClick={submitCancel} loading={cancelling}>
              Cancel subscription
            </Button>
          </>
        }
      >
        {cancelError && (
          <Alert variant="error" className="ui-field">
            {cancelError}
          </Alert>
        )}

        <p>
          {formatName(cancelTarget?.parent)}&apos;s <strong>{cancelTarget?.plan?.name}</strong> subscription.
        </p>

        <Textarea label="Reason" required rows={3} placeholder="Why is this being cancelled?" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />

        <Checkbox
          name="immediate"
          label="Cancel immediately instead of at the end of the paid period"
          description="Leave unticked to let the parent keep access until they have used the period they paid for."
          checked={cancelImmediate}
          onChange={(e) => setCancelImmediate(e.target.checked)}
        />
        <p className="ui-hint" style={{ margin: 'var(--spacing-xs) 0 0' }}>
          Cancelling returns no money. After cancelling immediately you can refund the unused time.
        </p>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(offer)}
        onClose={() => setOffer(null)}
        onConfirm={() => {
          setRefund({ paymentId: offer.paymentId, amount: offer.amount, opening: Date.now() });
          setOffer(null);
        }}
        title="Refund unused time?"
        confirmLabel={`Review a ${offer ? formatCurrency(offer.amount, offer.currency) : ''} refund`}
        cancelLabel="No refund"
      >
        {offer && (
          <p style={{ margin: 0 }}>
            {formatName(offer.parent)} had {offer.unusedDays} of {offer.periodDays} days of {offer.planName ?? 'the plan'} left. That part of
            their last payment is <strong>{formatCurrency(offer.amount, offer.currency)}</strong> (tax included). You can check the details and change the
            amount before refunding.
          </p>
        )}
      </ConfirmationModal>

      {couponTarget && (
        <ApplyCouponDialog
          key={couponTarget.id}
          row={couponTarget}
          onClose={() => setCouponTarget(null)}
          onApplied={() => {
            setCouponTarget(null);
            load().catch(() => {});
          }}
        />
      )}

      {refund && (
        <RefundDialog
          key={`${refund.paymentId}-${refund.opening}`}
          paymentId={refund.paymentId}
          initialAmount={refund.amount}
          onClose={() => setRefund(null)}
          onDone={() => setRefund(null)}
        />
      )}

      <ConfirmationModal
        isOpen={Boolean(retryTarget)}
        onClose={() => (retrying ? null : setRetryTarget(null))}
        onConfirm={confirmRetry}
        loading={retrying}
        title="Retry the payment now?"
        confirmLabel="Charge the card now"
      >
        {retryTarget && (
          <p style={{ margin: 0 }}>
            This charges {retryTarget.row.card ? cardLabel(retryTarget.row.card, { expiry: false }) : 'the saved card'} for{' '}
            {formatName(retryTarget.row.parent)}&apos;s overdue {retryTarget.row.plan?.name} renewal. If it goes through, the subscription is active
            again; if it is declined, the scheduled retries carry on.
          </p>
        )}
      </ConfirmationModal>

      <Toast />
    </div>
  );
}
