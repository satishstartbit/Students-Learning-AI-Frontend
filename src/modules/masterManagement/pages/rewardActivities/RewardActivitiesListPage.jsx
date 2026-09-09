import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader, Button, Card, DataTable, SearchInput, Select, StatusBadge, Badge, ConfirmationModal, Toast } from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { usePagination } from '../../../../hooks/usePagination';
import { useDebounce } from '../../../../hooks/useDebounce';
import { toast } from '../../../../hooks/useToast';
import rewardService from '../../services/reward.service';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const ACTION_COPY = {
  activate: { title: 'Activate activity?', confirmLabel: 'Activate', successMessage: 'Reward activity activated' },
  deactivate: { title: 'Deactivate activity?', confirmLabel: 'Deactivate', successMessage: 'Reward activity deactivated' },
  delete: { title: 'Delete activity?', confirmLabel: 'Delete', successMessage: 'Reward activity permanently deleted' },
};

export default function RewardActivitiesListPage() {
  const navigate = useNavigate();
  const pagination = usePagination();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ by: 'display_order', order: 'asc' });
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const { data, meta, error, isLoading, run } = useApi(rewardService.listActivities);
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
      if (confirm.type === 'activate') await rewardService.activateActivity(confirm.item.id);
      else if (confirm.type === 'deactivate') await rewardService.deactivateActivity(confirm.item.id);
      else await rewardService.deleteActivity(confirm.item.id);
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
    { key: 'name', header: 'Activity', sortable: true, render: (row) => <strong>{row.name}</strong> },
    { key: 'activityType', header: 'Key', render: (row) => <code>{row.activityType}</code> },
    { key: 'points', header: 'Points', sortable: false, render: (row) => <Badge variant="primary">{row.points} pts</Badge> },
    { key: 'is_active', header: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/masters/reward-activities/${row.id}/edit`)}>Edit</Button>
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
        title="Reward Activities"
        description="Point values earned for platform activities. Change the point value here without touching application code."
        breadcrumbs={[{ label: 'Master Management', to: '/admin/masters' }, { label: 'Reward Activities' }]}
        actions={<Button as={Link} to="/admin/masters/reward-activities/create">Add activity</Button>}
      />

      <Card flat className="ui-field">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-md)' }}>
          <SearchInput label="Search" placeholder="Name or key" value={search} onChange={(e) => resetTo(setSearch)(e.target.value)} onClear={() => resetTo(setSearch)('')} />
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
        emptyTitle={hasFilters ? 'No activities match those filters' : 'No reward activities yet'}
        emptyDescription={hasFilters ? 'Try clearing the search or changing the filters.' : 'Add the first reward activity.'}
        caption="Reward activities"
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
