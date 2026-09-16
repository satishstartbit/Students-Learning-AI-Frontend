import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuPencil, LuToggleLeft, LuToggleRight, LuTrash2 } from 'react-icons/lu';
import { PageHeader, Button, IconButton, Card, DataTable, SearchInput, Select, StatusBadge, Badge, ConfirmationModal, Toast } from '../../../../components/common';
import { Tooltip } from '../../../../components/ui/tooltip';
import { useApi } from '../../../../hooks/useApi';
import { usePagination } from '../../../../hooks/usePagination';
import { useDebounce } from '../../../../hooks/useDebounce';
import { formatDate } from '../../../../utils/date';
import { formatCurrency } from '../../../../utils/format';
import { toast } from '../../../../hooks/useToast';
import billingService from '../../services/billing.service';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const ACTION_COPY = {
  activate: { title: 'Activate code?', confirmLabel: 'Activate', successMessage: 'Discount code activated' },
  deactivate: { title: 'Deactivate code?', confirmLabel: 'Deactivate', successMessage: 'Discount code deactivated' },
  delete: { title: 'Delete code?', confirmLabel: 'Delete', successMessage: 'Discount code permanently deleted' },
};

export default function DiscountCodesListPage() {
  const navigate = useNavigate();
  const pagination = usePagination();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ by: 'display_order', order: 'asc' });
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const { data, meta, error, isLoading, run } = useApi(billingService.listDiscountCodes);
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
      if (confirm.type === 'activate') await billingService.activateDiscountCode(confirm.item.id);
      else if (confirm.type === 'deactivate') await billingService.deactivateDiscountCode(confirm.item.id);
      else await billingService.deleteDiscountCode(confirm.item.id);
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
    { key: 'code', header: 'Code', sortable: false, render: (row) => <code>{row.code}</code> },
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'discountValue',
      header: 'Discount',
      render: (row) => (
        <Badge variant="primary">
          {row.discountType === 'percentage' ? `${row.discountValue}%` : formatCurrency(row.discountValue)}
        </Badge>
      ),
    },
    { key: 'expiresAt', header: 'Expires', render: (row) => (row.expiresAt ? formatDate(row.expiresAt) : 'No expiry') },
    {
      key: 'redemptionCount',
      header: 'Used',
      // Links through to which parents actually redeemed the code.
      render: (row) => (
        <Link to={`/admin/masters/discount-codes/${row.id}/redemptions`} title="See who used this code">
          {`${row.redemptionCount}${row.maxRedemptions ? ` / ${row.maxRedemptions}` : ''}`}
        </Link>
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
            <IconButton icon={<LuPencil aria-hidden="true" />} label="Edit" size="sm" onClick={() => navigate(`/admin/masters/discount-codes/${row.id}/edit`)} />
          </Tooltip>
          {row.isActive ? (
            <Tooltip label="Deactivate" side="top">
              <IconButton icon={<LuToggleLeft aria-hidden="true" />} label="Deactivate" size="sm" onClick={() => setConfirm({ type: 'deactivate', item: row })} />
            </Tooltip>
          ) : (
            <Tooltip label="Activate" side="top">
              <IconButton icon={<LuToggleRight aria-hidden="true" />} label="Activate" size="sm" onClick={() => setConfirm({ type: 'activate', item: row })} />
            </Tooltip>
          )}
          <Tooltip label="Delete" side="top">
            <IconButton icon={<LuTrash2 aria-hidden="true" />} label="Delete" size="sm" onClick={() => setConfirm({ type: 'delete', item: row })} />
          </Tooltip>
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(search || status);

  return (
    <>
      <PageHeader
        title="Discount Codes"
        description="Promotional codes applicable to subscription plans."
        breadcrumbs={[{ label: 'Master Management', to: '/admin/masters' }, { label: 'Discount Codes' }]}
        actions={<Button as={Link} to="/admin/masters/discount-codes/create">Add code</Button>}
      />

      <Card flat className="ui-field">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-md)' }}>
          <SearchInput label="Search" placeholder="Code or name" value={search} onChange={(e) => resetTo(setSearch)(e.target.value)} onClear={() => resetTo(setSearch)('')} />
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
        emptyTitle={hasFilters ? 'No codes match those filters' : 'No discount codes yet'}
        emptyDescription={hasFilters ? 'Try clearing the search or changing the filters.' : 'Add the first discount code.'}
        caption="Discount codes"
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
            ? `Delete "${confirm?.item?.code}"? This cannot be undone. If it has already been redeemed, deletion is blocked and you'll be asked to deactivate it instead.`
            : `${ACTION_COPY[confirm?.type]?.confirmLabel} "${confirm?.item?.code}"?`
        }
      />

      <Toast />
    </>
  );
}
