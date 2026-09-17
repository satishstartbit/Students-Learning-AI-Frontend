import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuFilterX, LuPencil, LuToggleLeft, LuToggleRight, LuTrash2 } from 'react-icons/lu';
import { PageHeader, Button, IconButton, FilterBar, DataTable, SearchInput, Select, StatusBadge, Badge, ConfirmationModal, Toast } from '../../../../components/common';
import { Tooltip } from '../../../../components/ui/tooltip';
import { useApi } from '../../../../hooks/useApi';
import { usePagination } from '../../../../hooks/usePagination';
import { useDebounce } from '../../../../hooks/useDebounce';
import { formatDate } from '../../../../utils/date';
import { toast } from '../../../../hooks/useToast';
import academicService from '../../services/academic.service';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const ACTION_COPY = {
  activate: { title: 'Activate academic year?', confirmLabel: 'Activate', successMessage: 'Academic year activated' },
  deactivate: { title: 'Deactivate academic year?', confirmLabel: 'Deactivate', successMessage: 'Academic year deactivated' },
  delete: { title: 'Delete academic year?', confirmLabel: 'Delete', successMessage: 'Academic year permanently deleted' },
};

export default function AcademicYearsListPage() {
  const navigate = useNavigate();
  const pagination = usePagination();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ by: 'display_order', order: 'asc' });
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const { data, meta, error, isLoading, run } = useApi(academicService.listAcademicYears);
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
      if (confirm.type === 'activate') await academicService.activateAcademicYear(confirm.item.id);
      else if (confirm.type === 'deactivate') await academicService.deactivateAcademicYear(confirm.item.id);
      else await academicService.deleteAcademicYear(confirm.item.id);
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
      header: 'Academic year',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <strong>{row.name}</strong>
          {row.isCurrent && <Badge variant="primary">Current</Badge>}
        </div>
      ),
    },
    { key: 'startDate', header: 'Start', render: (row) => formatDate(row.startDate) },
    { key: 'endDate', header: 'End', render: (row) => formatDate(row.endDate) },
    { key: 'is_active', header: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
          <Tooltip label="Edit" side="top">
            <IconButton icon={<LuPencil aria-hidden="true" />} label="Edit" variant="primary" size="sm" onClick={() => navigate(`/admin/masters/academic-years/${row.id}/edit`)} />
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
  const clearFilters = () => {
    setSearch('');
    setStatus('');
    goToPage(1);
  };

  return (
    <>
      <PageHeader
        title="Academic Years"
        description="Only one academic year can be marked current at a time."
        breadcrumbs={[{ label: 'Master Management', to: '/admin/masters' }, { label: 'Academic Years' }]}
        actions={<Button as={Link} to="/admin/masters/academic-years/create">Add academic year</Button>}
      />

      <FilterBar>
        <SearchInput fieldClassName="ui-filterbar__search ui-field--compact" placeholder="Academic year name" value={search} onChange={(e) => resetTo(setSearch)(e.target.value)} onClear={() => resetTo(setSearch)('')} />
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
        emptyTitle={hasFilters ? 'No academic years match those filters' : 'No academic years yet'}
        emptyDescription={hasFilters ? 'Try clearing the search or changing the filters.' : 'Add the first academic year.'}
        caption="Academic years"
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
