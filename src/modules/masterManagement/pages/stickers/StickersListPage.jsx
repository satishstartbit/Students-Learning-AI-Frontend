import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader, Button, Card, DataTable, SearchInput, Select, StatusBadge, Avatar, ConfirmationModal, Toast } from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { usePagination } from '../../../../hooks/usePagination';
import { useDebounce } from '../../../../hooks/useDebounce';
import { toast } from '../../../../hooks/useToast';
import appearanceService from '../../services/appearance.service';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const ACTION_COPY = {
  activate: { title: 'Activate sticker?', confirmLabel: 'Activate', successMessage: 'Sticker activated' },
  deactivate: { title: 'Deactivate sticker?', confirmLabel: 'Deactivate', successMessage: 'Sticker deactivated' },
  delete: { title: 'Delete sticker?', confirmLabel: 'Delete', successMessage: 'Sticker permanently deleted' },
};

export default function StickersListPage() {
  const navigate = useNavigate();
  const pagination = usePagination();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ by: 'display_order', order: 'asc' });
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const { data, meta, error, isLoading, run } = useApi(appearanceService.stickers.list);
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
      if (confirm.type === 'activate') await appearanceService.stickers.activate(confirm.item.id);
      else if (confirm.type === 'deactivate') await appearanceService.stickers.deactivate(confirm.item.id);
      else await appearanceService.stickers.remove(confirm.item.id);
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
    {
      key: 'name',
      header: 'Sticker',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <Avatar src={row.imageUrl} name={row.name} size="sm" />
          <strong>{row.name}</strong>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (row) => row.category ?? '—' },
    { key: 'is_active', header: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/masters/stickers/${row.id}/edit`)}>Edit</Button>
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
        title="Stickers"
        description="Decorative stickers students can add to their dashboard."
        breadcrumbs={[{ label: 'Master Management', to: '/admin/masters' }, { label: 'Stickers' }]}
        actions={<Button as={Link} to="/admin/masters/stickers/create">Add sticker</Button>}
      />

      <Card flat className="ui-field">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-md)' }}>
          <SearchInput label="Search" placeholder="Sticker name or category" value={search} onChange={(e) => resetTo(setSearch)(e.target.value)} onClear={() => resetTo(setSearch)('')} />
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
        emptyTitle={hasFilters ? 'No stickers match those filters' : 'No stickers yet'}
        emptyDescription={hasFilters ? 'Try clearing the search or changing the filters.' : 'Add the first sticker.'}
        caption="Stickers"
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
            ? `Delete "${confirm?.item?.name}"? This cannot be undone.`
            : `${ACTION_COPY[confirm?.type]?.confirmLabel} "${confirm?.item?.name}"?`
        }
      />

      <Toast />
    </>
  );
}
