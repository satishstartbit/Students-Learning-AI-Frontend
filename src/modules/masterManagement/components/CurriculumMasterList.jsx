import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuPencil, LuToggleLeft, LuToggleRight, LuTrash2 } from 'react-icons/lu';
import {
  PageHeader,
  Button,
  IconButton,
  Card,
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
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/**
 * List screen shared by the Curriculum & Task Setup masters - same behaviour
 * as the other dedicated master lists (search, status filter, sort, activate /
 * deactivate / delete-when-unused), configured per master.
 *
 * @param noun        singular display name, e.g. "task type"
 * @param basePath    e.g. "/admin/masters/task-types"
 * @param service     { list, activate, deactivate, remove }
 * @param columns     leading DataTable columns (status + actions are added here)
 * @param query       extra list params (e.g. { subjectId })
 * @param filters     extra filter controls rendered beside search/status
 * @param rowActions  (row) => extra buttons before Edit
 * @param createTo    where "Add" goes (defaults to `${basePath}/create`)
 */
export default function CurriculumMasterList({
  title,
  description,
  noun,
  basePath,
  service,
  columns,
  query = {},
  filters = null,
  rowActions,
  createTo,
  headerNote = null,
}) {
  const navigate = useNavigate();
  const pagination = usePagination();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ by: 'display_order', order: 'asc' });
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const { data, meta, error, isLoading, run } = useApi(service.list);
  const { page, limit, applyMeta, goToPage } = pagination;
  const queryKey = JSON.stringify(query);

  const load = useCallback(
    () => run({ ...JSON.parse(queryKey), page, limit, search: debouncedSearch, status, sortBy: sort.by, sortOrder: sort.order }),
    [run, queryKey, page, limit, debouncedSearch, status, sort]
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

  const COPY = {
    activate: { title: `Activate ${noun}?`, confirmLabel: 'Activate', done: 'activated' },
    deactivate: { title: `Deactivate ${noun}?`, confirmLabel: 'Deactivate', done: 'deactivated' },
    delete: { title: `Delete ${noun}?`, confirmLabel: 'Delete', done: 'deleted' },
  };

  const runAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === 'activate') await service.activate(confirm.item.id);
      else if (confirm.type === 'deactivate') await service.deactivate(confirm.item.id);
      else await service.remove(confirm.item.id);
      toast.success(`"${confirm.item.name}" ${COPY[confirm.type].done}`);
      setConfirm(null);
      load().catch(() => {});
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const allColumns = [
    ...columns,
    { key: 'is_active', header: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {rowActions?.(row)}
          <Tooltip label="Edit" side="top">
            <IconButton
              icon={<LuPencil aria-hidden="true" />}
              label="Edit"
              size="sm"
              onClick={() => navigate(`${basePath}/${row.id}/edit`)}
            />
          </Tooltip>
          {row.isActive ? (
            <Tooltip label="Deactivate" side="top">
              <IconButton
                icon={<LuToggleLeft aria-hidden="true" />}
                label="Deactivate"
                size="sm"
                onClick={() => setConfirm({ type: 'deactivate', item: row })}
              />
            </Tooltip>
          ) : (
            <Tooltip label="Activate" side="top">
              <IconButton
                icon={<LuToggleRight aria-hidden="true" />}
                label="Activate"
                size="sm"
                onClick={() => setConfirm({ type: 'activate', item: row })}
              />
            </Tooltip>
          )}
          <Tooltip label="Delete" side="top">
            <IconButton
              icon={<LuTrash2 aria-hidden="true" />}
              label="Delete"
              size="sm"
              onClick={() => setConfirm({ type: 'delete', item: row })}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(search || status);

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: 'Master Management', to: '/admin/masters' }, { label: title }]}
        actions={
          <Button as={Link} to={createTo ?? `${basePath}/create`}>
            Add {noun}
          </Button>
        }
      />

      {headerNote}

      <Card flat className="ui-field">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-md)' }}>
          <SearchInput
            label="Search"
            placeholder="Name"
            value={search}
            onChange={(e) => resetTo(setSearch)(e.target.value)}
            onClear={() => resetTo(setSearch)('')}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={status}
            onChange={(e) => resetTo(setStatus)(e.target.value)}
          />
          {filters}
        </div>
      </Card>

      <DataTable
        columns={allColumns}
        data={data ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        sortBy={sort.by}
        sortOrder={sort.order}
        onSort={(by, order) => setSort({ by, order })}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={hasFilters ? `No ${noun}s match those filters` : `No ${noun}s yet`}
        emptyDescription={hasFilters ? 'Try clearing the search or changing the filters.' : `Add the first ${noun}.`}
        caption={title}
      />

      <ConfirmationModal
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={runAction}
        loading={actionLoading}
        variant={confirm?.type === 'delete' ? 'danger' : 'primary'}
        title={confirm ? COPY[confirm.type].title : ''}
        confirmLabel={confirm ? COPY[confirm.type].confirmLabel : ''}
        message={
          confirm?.type === 'delete'
            ? `Delete "${confirm?.item?.name}"? This cannot be undone. If a task uses it, deletion is blocked - deactivate it instead to hide it from teachers.`
            : confirm?.type === 'deactivate'
              ? `Teachers will no longer see "${confirm?.item?.name}" when creating tasks. Tasks that already use it keep it.`
              : `"${confirm?.item?.name}" will be available to teachers again.`
        }
      />

      <Toast />
    </>
  );
}
