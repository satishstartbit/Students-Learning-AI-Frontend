import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuFilterX, LuPencil, LuToggleLeft, LuToggleRight, LuTrash2 } from 'react-icons/lu';
import { PageHeader, Button, IconButton, FilterBar, DataTable, SearchInput, Select, StatusBadge, Badge, ConfirmationModal, Toast } from '../../../../components/common';
import { Tooltip } from '../../../../components/ui/tooltip';
import { useApi } from '../../../../hooks/useApi';
import { useListQuery } from '../../../../hooks/useListQuery';
import { useAddressText } from '../../../../hooks/useAddressText';
import { useDebounce } from '../../../../hooks/useDebounce';
import { toast } from '../../../../hooks/useToast';
import { formatCurrency } from '../../../../utils/format';
import billingService from '../../services/billing.service';
import MasterGuideButton from '../../components/guide/MasterGuideButton';
import MasterBackButton from '../../components/MasterBackButton';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const ACTION_COPY = {
  activate: { title: 'Activate plan?', confirmLabel: 'Activate', successMessage: 'Subscription plan activated' },
  deactivate: { title: 'Deactivate plan?', confirmLabel: 'Deactivate', successMessage: 'Subscription plan deactivated' },
  delete: { title: 'Delete plan?', confirmLabel: 'Delete', successMessage: 'Subscription plan permanently deleted' },
};

export default function SubscriptionPlansListPage() {
  const navigate = useNavigate();
  // Filters, sort and page live in the address, so Back from a plan returns here as left (2026-10-20).
  const { query, setQuery, pagination } = useListQuery({ search: '', status: '', sortBy: 'display_order', sortOrder: 'asc' });
  const { search, status, sortBy, sortOrder } = query;

  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const { data, meta, error, isLoading, run } = useApi(billingService.listPlans);
  const { page, limit, applyMeta, goToPage } = pagination;

  const load = useCallback(
    () => run({ page, limit, search: debouncedSearch, status, sortBy, sortOrder }),
    [run, page, limit, debouncedSearch, status, sortBy, sortOrder]
  );

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const filterBy = (key) => (value) => setQuery({ [key]: value, page: 1 });
  const [searchText, typeSearch] = useAddressText(search, filterBy('search'));

  const runAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === 'activate') await billingService.activatePlan(confirm.item.id);
      else if (confirm.type === 'deactivate') await billingService.deactivatePlan(confirm.item.id);
      else await billingService.deletePlan(confirm.item.id);
      toast.success(ACTION_COPY[confirm.type].successMessage);
      setConfirm(null);
      load().catch(() => {});
    } catch (err) {
      toast.error(err?.message ?? 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Plan', sortable: true, render: (row) => <strong>{row.name}</strong> },
    { key: 'planType', header: 'Type', render: (row) => row.planType },
    { key: 'billingCycle', header: 'Billing', render: (row) => row.billingCycle },
    {
      key: 'price',
      header: 'Price',
      render: (row) => (
        <div>
          <Badge variant="primary">{formatCurrency(row.price, row.currency)}</Badge>
          {/* The least a family pays, whatever discount code is used (2026-10-20). */}
          {Number(row.minimumAmount) > 0 && (
            <div className="ui-hint" style={{ margin: '2px 0 0' }}>
              Minimum {formatCurrency(row.minimumAmount, row.currency)}
            </div>
          )}
        </div>
      ),
    },
    { key: 'is_active', header: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
          <Tooltip label="Edit" side="top">
            <IconButton icon={<LuPencil aria-hidden="true" />} label="Edit" variant="primary" size="sm" onClick={() => navigate(`/admin/masters/subscription-plans/${row.id}/edit`)} />
          </Tooltip>
          {row.isActive ? (
            <Tooltip label="Deactivate" side="top">
              <IconButton icon={<LuToggleLeft aria-hidden="true" />} label="Deactivate" variant="warning" size="sm" onClick={() => setConfirm({ type: 'deactivate', item: row })} />
            </Tooltip>
          ) : (
            <Tooltip label="Activate" side="top">
              <IconButton icon={<LuToggleRight aria-hidden="true" />} label="Activate" variant="success" size="sm" onClick={() => setConfirm({ type: 'activate', item: row })} />
            </Tooltip>
          )}
          <Tooltip label="Delete" side="top">
            <IconButton icon={<LuTrash2 aria-hidden="true" />} label="Delete" variant="danger" size="sm" onClick={() => setConfirm({ type: 'delete', item: row })} />
          </Tooltip>
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(search || status);
  const clearFilters = () => setQuery({ search: '', status: '', page: 1 });

  return (
    <div className="td-page">
      <MasterBackButton />
      <PageHeader
        title="Subscription Plans"
        description="Billing plans available to parents."
        breadcrumbs={[{ label: 'Master Management', to: '/admin/masters' }, { label: 'Subscription Plans' }]}
        actions={
          <>
            <MasterGuideButton title="Subscription Plans" />
            <Button as={Link} to="/admin/masters/subscription-plans/create">Add plan</Button>
          </>
        }
      />

      <FilterBar>
        <SearchInput fieldClassName="ui-filterbar__search ui-field--compact" placeholder="Plan name" value={searchText} onChange={(e) => typeSearch(e.target.value)} onClear={() => typeSearch('')} />
        <Select fieldClassName="ui-field--compact" label="Status" options={STATUS_OPTIONS} placeholder="All statuses" value={status} onChange={(e) => filterBy('status')(e.target.value)} />
        <Tooltip label="Clear filters" side="top">
          <IconButton icon={<LuFilterX aria-hidden="true" />} label="Clear filters" size="sm" onClick={clearFilters} disabled={!hasFilters} />
        </Tooltip>
      </FilterBar>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(by, order) => setQuery({ sortBy: by, sortOrder: order, page: 1 })}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={hasFilters ? 'No plans match those filters' : 'No subscription plans yet'}
        emptyDescription={hasFilters ? 'Try clearing the search or changing the filters.' : 'Add the first plan.'}
        caption="Subscription plans"
      />

      <ConfirmationModal
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={runAction}
        loading={actionLoading}
        variant={confirm?.type === 'delete' ? 'danger' : 'primary'}
        title={confirm ? ACTION_COPY[confirm.type].title : ''}
        confirmLabel={confirm ? ACTION_COPY[confirm.type].confirmLabel : ''}
        message={
          confirm?.type === 'delete'
            ? `Delete "${confirm?.item?.name}"? This cannot be undone. If it is currently in use, deletion is blocked and you'll be asked to deactivate it instead.`
            : `${ACTION_COPY[confirm?.type]?.confirmLabel} "${confirm?.item?.name}"?`
        }
      />

      <Toast />
    </div>
  );
}
