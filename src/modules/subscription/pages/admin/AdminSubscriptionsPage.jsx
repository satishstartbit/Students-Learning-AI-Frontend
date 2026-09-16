import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuBan, LuFilterX } from 'react-icons/lu';
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
  Textarea,
  Checkbox,
  Alert,
  Input,
  Toast,
} from '../../../../components/common';
import { Tooltip } from '../../../../components/ui/tooltip';
import { useApi } from '../../../../hooks/useApi';
import { usePagination } from '../../../../hooks/usePagination';
import { useDebounce } from '../../../../hooks/useDebounce';
import { toast } from '../../../../hooks/useToast';
import { formatDate } from '../../../../utils/date';
import { formatName } from '../../../../utils/format';
import { getErrorMessage } from '../../../../utils/errorHandler';
import subscriptionService from '../../services/subscription.service';
import billingService from '../../../masterManagement/services/billing.service';

const STATUS_OPTIONS = [
  { value: 'trialing', label: 'Trialing' },
  { value: 'active', label: 'Active' },
  { value: 'past_due', label: 'Past due' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

/**
 * /admin/subscriptions - every parent's subscription, with cancel-on-behalf.
 *
 * Plans and coupons themselves are not edited here: those already live in
 * Master Management, and this console links across to them rather than
 * duplicating their CRUD.
 */
export default function AdminSubscriptionsPage() {
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [planId, setPlanId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const { data, meta, error, isLoading, run } = useApi(subscriptionService.adminListSubscriptions);
  const { data: plans } = useApi(billingService.listPlans, {
    immediate: true,
    args: [{ limit: 100 }],
  });

  const load = useCallback(
    () => run({ page, limit, search: debouncedSearch, status, planId, from, to }),
    [run, page, limit, debouncedSearch, status, planId, from, to]
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
      await subscriptionService.adminCancelSubscription(cancelTarget.id, {
        reason: cancelReason.trim(),
        immediate: cancelImmediate,
      });
      toast.success('Subscription cancelled');
      setCancelTarget(null);
      load().catch(() => {});
    } catch (err) {
      setCancelError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const planOptions = (plans ?? []).map((p) => ({ value: p.id, label: p.name }));
  const isLive = (row) => ['trialing', 'active', 'past_due'].includes(row.status);

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
            {row.plan?.billingCycle} · {row.plan?.currency} {row.plan?.price}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <StatusBadge status={row.status} />
          {row.cancelAtPeriodEnd && row.status !== 'cancelled' && (
            <Badge variant="warning">Ends at period</Badge>
          )}
        </span>
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
          <Tooltip label="Cancel subscription" side="top">
            <IconButton icon={<LuBan aria-hidden="true" />} label="Cancel subscription" size="sm" onClick={() => openCancel(row)} />
          </Tooltip>
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
    <>
      <PageHeader
        title="Subscriptions"
        description="Every parent subscription across the platform."
        breadcrumbs={[{ label: 'Subscriptions' }]}
        actions={
          <>
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
          label="Plan"
          options={planOptions}
          placeholder="All plans"
          value={planId}
          onChange={(e) => resetTo(setPlanId)(e.target.value)}
        />
        <Input
          fieldClassName="ui-field--compact-labeled"
          label="From"
          type="date"
          value={from}
          onChange={(e) => resetTo(setFrom)(e.target.value)}
        />
        <Input fieldClassName="ui-field--compact-labeled" label="To" type="date" value={to} onChange={(e) => resetTo(setTo)(e.target.value)} />
        <Tooltip label="Clear filters" side="top">
          <IconButton
            icon={<LuFilterX aria-hidden="true" />}
            label="Clear filters"
            size="sm"
            onClick={clearFilters}
            disabled={!hasFilters}
          />
        </Tooltip>
      </FilterBar>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={hasFilters ? 'No subscriptions match those filters' : 'No subscriptions yet'}
        emptyDescription={
          hasFilters
            ? 'Try clearing the search or changing the filters.'
            : 'Subscriptions appear here once a parent checks out.'
        }
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
          {formatName(cancelTarget?.parent)}&apos;s <strong>{cancelTarget?.plan?.name}</strong>{' '}
          subscription.
        </p>

        <Textarea
          label="Reason"
          required
          rows={3}
          placeholder="Why is this being cancelled?"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />

        <Checkbox
          name="immediate"
          label="Cancel immediately instead of at the end of the paid period"
          description="Leave unticked to let the parent keep access until they have used the period they paid for."
          checked={cancelImmediate}
          onChange={(e) => setCancelImmediate(e.target.checked)}
        />
      </Modal>

      <Toast />
    </>
  );
}
