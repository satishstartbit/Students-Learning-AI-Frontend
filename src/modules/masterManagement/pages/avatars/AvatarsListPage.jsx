import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuFilterX, LuPencil, LuToggleLeft, LuToggleRight, LuTrash2 } from 'react-icons/lu';
import { PageHeader, Button, IconButton, FilterBar, DataTable, SearchInput, Select, StatusBadge, Avatar, ConfirmationModal, Toast } from '../../../../components/common';
import { Tooltip } from '../../../../components/ui/tooltip';
import { useApi } from '../../../../hooks/useApi';
import { usePagination } from '../../../../hooks/usePagination';
import { useDebounce } from '../../../../hooks/useDebounce';
import { toast } from '../../../../hooks/useToast';
import { AvatarPicture } from '../../../student/components/personalize/AvatarPicture';
import appearanceService from '../../services/appearance.service';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const ACTION_COPY = {
  activate: { title: 'Activate avatar?', confirmLabel: 'Activate', successMessage: 'Avatar activated' },
  deactivate: { title: 'Deactivate avatar?', confirmLabel: 'Deactivate', successMessage: 'Avatar deactivated' },
  delete: { title: 'Delete avatar?', confirmLabel: 'Delete', successMessage: 'Avatar permanently deleted' },
};

export default function AvatarsListPage() {
  const navigate = useNavigate();
  const pagination = usePagination();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ by: 'display_order', order: 'asc' });
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const { data, meta, error, isLoading, run } = useApi(appearanceService.avatars.list);
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
      if (confirm.type === 'activate') await appearanceService.avatars.activate(confirm.item.id);
      else if (confirm.type === 'deactivate') await appearanceService.avatars.deactivate(confirm.item.id);
      else await appearanceService.avatars.remove(confirm.item.id);
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
      header: 'Avatar',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          {/* Built-in "avatar:<slug>" art draws itself; uploads and links fall back to the image/initials avatar. */}
          <AvatarPicture imageUrl={row.imageUrl} size={28}>
            <Avatar src={row.imageUrl} name={row.name} size="sm" />
          </AvatarPicture>
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
          <Tooltip label="Edit" side="top">
            <IconButton icon={<LuPencil aria-hidden="true" />} label="Edit" variant="primary" size="sm" onClick={() => navigate(`/admin/masters/avatars/${row.id}/edit`)} />
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
          {/* Built-in rows (the master data the platform ships with) can't be deleted. */}
          {!row.isSystem && (
            <Tooltip label="Delete" side="top">
              <IconButton icon={<LuTrash2 aria-hidden="true" />} label="Delete" variant="danger" size="sm" onClick={() => setConfirm({ type: 'delete', item: row })} />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(search || status);
  const clearFilters = () => {
    setSearch('');
    setStatus('');
    goToPage(1);
  };

  return (
    <div className="td-page">
      <PageHeader
        title="Avatars"
        description="Avatar images students can choose from."
        breadcrumbs={[{ label: 'Master Management', to: '/admin/masters' }, { label: 'Avatars' }]}
        actions={<Button as={Link} to="/admin/masters/avatars/create">Add avatar</Button>}
      />

      <FilterBar>
        <SearchInput fieldClassName="ui-filterbar__search ui-field--compact" placeholder="Avatar name or category" value={search} onChange={(e) => resetTo(setSearch)(e.target.value)} onClear={() => resetTo(setSearch)('')} />
        <Select fieldClassName="ui-field--compact" label="Status" options={STATUS_OPTIONS} placeholder="All statuses" value={status} onChange={(e) => resetTo(setStatus)(e.target.value)} />
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
        sortBy={sort.by}
        sortOrder={sort.order}
        onSort={(by, order) => setSort({ by, order })}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={hasFilters ? 'No avatars match those filters' : 'No avatars yet'}
        emptyDescription={hasFilters ? 'Try clearing the search or changing the filters.' : 'Add the first avatar.'}
        caption="Avatars"
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
