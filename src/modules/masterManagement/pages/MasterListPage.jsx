import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LuFilterX, LuPencil, LuToggleLeft, LuToggleRight, LuTrash2 } from 'react-icons/lu';
import {
  PageHeader,
  Button,
  IconButton,
  FilterBar,
  DataTable,
  SearchInput,
  Select,
  StatusBadge,
  ConfirmationModal,
  Toast,
} from '../../../components/common';
import { Tooltip } from '../../../components/ui/tooltip';
import { useApi } from '../../../hooks/useApi';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatDateTime } from '../../../utils/date';
import { toast } from '../../../hooks/useToast';
import masterGenericService from '../services/masterGeneric.service';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const ACTION_COPY = {
  activate: { title: 'Activate record?', confirmLabel: 'Activate', successMessage: 'Record activated' },
  deactivate: { title: 'Deactivate record?', confirmLabel: 'Deactivate', successMessage: 'Record deactivated' },
  delete: { title: 'Delete record?', confirmLabel: 'Delete', successMessage: 'Record permanently deleted' },
};

/**
 * Generic master list - one screen shared by every simple lookup master.
 * The columns, labels and validation are all driven by the master_types row
 * for :masterType, fetched alongside the item list.
 */
export default function MasterListPage() {
  const { masterType } = useParams();
  const navigate = useNavigate();
  const pagination = usePagination();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ by: 'display_order', order: 'asc' });
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const { data: types } = useApi(masterGenericService.listTypes, { immediate: true });
  const typeRow = (types ?? []).find((t) => t.code === masterType) ?? null;

  const { data, meta, error, isLoading, run } = useApi(masterGenericService.listItems);
  const { page, limit, applyMeta, goToPage } = pagination;

  const load = useCallback(
    () =>
      run(masterType, {
        page,
        limit,
        search: debouncedSearch,
        status,
        sortBy: sort.by,
        sortOrder: sort.order,
      }),
    [run, masterType, page, limit, debouncedSearch, status, sort]
  );

  // Switching master type starts again from page one.
  useEffect(() => {
    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterType]);

  useEffect(() => {
    load().catch(() => {
      /* surfaced through `error` */
    });
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const resetTo = (setter) => (value) => {
    setter(value);
    goToPage(1);
  };

  const extraColumns = (typeRow?.fieldSchema?.fields ?? []).map((field) => ({
    key: `extra_${field.key}`,
    header: field.label ?? field.key,
    render: (row) => (row.extra?.[field.key] !== undefined && row.extra?.[field.key] !== null ? String(row.extra[field.key]) : '—'),
  }));

  const columns = [
    { key: 'name', header: 'Name', sortable: true, render: (row) => <strong>{row.name}</strong> },
    { key: 'code', header: 'Code', render: (row) => row.code ?? '—' },
    ...extraColumns,
    { key: 'display_order', header: 'Order', sortable: true, render: (row) => row.displayOrder },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      render: (row) => (row.updatedAt ? formatDateTime(row.updatedAt) : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: 120,
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
          <Tooltip label="Edit" side="top">
            <IconButton
              icon={<LuPencil aria-hidden="true" />}
              label="Edit"
              variant="primary"
              size="sm"
              onClick={() => navigate(`/admin/masters/${masterType}/${row.id}/edit`)}
            />
          </Tooltip>
          {row.isActive ? (
            <Tooltip label="Deactivate" side="top">
              <IconButton
                icon={<LuToggleLeft aria-hidden="true" />}
                label="Deactivate"
                variant="warning"
                size="sm"
                onClick={() => setConfirm({ type: 'deactivate', item: row })}
              />
            </Tooltip>
          ) : (
            <Tooltip label="Activate" side="top">
              <IconButton
                icon={<LuToggleRight aria-hidden="true" />}
                label="Activate"
                variant="success"
                size="sm"
                onClick={() => setConfirm({ type: 'activate', item: row })}
              />
            </Tooltip>
          )}
          <Tooltip label="Delete" side="top">
            <IconButton
              icon={<LuTrash2 aria-hidden="true" />}
              label="Delete"
              variant="danger"
              size="sm"
              onClick={() => setConfirm({ type: 'delete', item: row })}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const runAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === 'activate') await masterGenericService.activateItem(masterType, confirm.item.id);
      else if (confirm.type === 'deactivate') await masterGenericService.deactivateItem(masterType, confirm.item.id);
      else await masterGenericService.deleteItem(masterType, confirm.item.id);

      toast.success(ACTION_COPY[confirm.type].successMessage);
      setConfirm(null);
      load().catch(() => {});
    } catch (err) {
      toast.error(err?.message ?? 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const hasFilters = Boolean(search || status);
  const clearFilters = () => {
    setSearch('');
    setStatus('');
    goToPage(1);
  };

  return (
    <>
      <PageHeader
        title={typeRow?.label ?? 'Master data'}
        description={typeRow?.description}
        breadcrumbs={[{ label: 'Master Management', to: '/admin/masters' }, { label: typeRow?.label ?? masterType }]}
        actions={
          <Button as={Link} to={`/admin/masters/${masterType}/create`}>
            Add record
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          fieldClassName="ui-filterbar__search ui-field--compact"
          placeholder="Name, code or description"
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
        sortBy={sort.by}
        sortOrder={sort.order}
        onSort={(by, order) => setSort({ by, order })}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={hasFilters ? 'No records match those filters' : 'No records yet'}
        emptyDescription={
          hasFilters ? 'Try clearing the search or changing the filters.' : 'Add the first record for this master.'
        }
        caption={typeRow?.label}
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
