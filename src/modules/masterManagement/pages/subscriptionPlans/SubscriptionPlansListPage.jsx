import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader, Button, Card, DataTable, SearchInput, Select, StatusBadge, Badge, ConfirmationModal, Toast } from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { usePagination } from '../../../../hooks/usePagination';
import { useDebounce } from '../../../../hooks/useDebounce';
import { toast } from '../../../../hooks/useToast';
import billingService from '../../services/billing.service';

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
  const pagination = usePagination();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ by: 'display_order', order: 'asc' });
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const { data, meta, error, isLoading, run } = useApi(billingService.listPlans);
  const { page, limit, applyMeta, goToPage } = pagination;

  const load = useCallback(
    () => run({ page, limit, search: debouncedSearch, status, sortBy: sort.by, sortOrder: sort.order }),
    [run, page, limit, debouncedSearch, status, sort]
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
    { key: 'price', header: 'Price', render: (row) => <Badge variant="primary">{row.currency} {row.price}</Badge> },
    { key: 'is_active', header: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/masters/subscription-plans/${row.id}/edit`)}>Edit</Button>
          {row.isActive ? (
            <Button size="sm" variant="secondary" onClick={() => setConfirm({ type: 'deactivate', item: row })}>Deactivate</Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setConfirm({ type: 'activate', item: row })}>Activate</Button>
          )}
          <Button size="sm" variant="danger" onClick={() => setConfirm({ type: 'delete', item: row })}>Delete</Button>
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(search || status);

  return (
    <>
      <PageHeader
        title="Subscription Plans"
        description="Billing plans available to parents."
        breadcrumbs={[{ label: 'Master Management', to: '/admin/masters' }, { label: 'Subscription Plans' }]}
        actions={<Button as={Link} to="/admin/masters/subscription-plans/create">Add plan</Button>}
      />

      <Card flat className="ui-field">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-md)' }}>
          <SearchInput label="Search" placeholder="Plan name" value={search} onChange={(e) => resetTo(setSearch)(e.target.value)} onClear={() => resetTo(setSearch)('')} />
          <Select label="Status" options={STATUS_OPTIONS} placeholder="All statuses" value={status} onChange={(e) => resetTo(setStatus)(e.target.value)} />
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        sortBy={sort.by}
        sortOrder={sort.order}
        onSort={(by, order) => setSort({ by, order })}
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
    </>
  );
}
