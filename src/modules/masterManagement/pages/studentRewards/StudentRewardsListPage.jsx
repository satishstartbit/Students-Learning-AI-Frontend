import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuFilterX, LuPencil, LuToggleLeft, LuToggleRight, LuTrash2 } from 'react-icons/lu';
import { PageHeader, Button, IconButton, FilterBar, DataTable, SearchInput, Select, StatusBadge, Badge, ConfirmationModal, Toast } from '../../../../components/common';
import { Tooltip } from '../../../../components/ui/tooltip';
import { useApi } from '../../../../hooks/useApi';
import { usePagination } from '../../../../hooks/usePagination';
import { useDebounce } from '../../../../hooks/useDebounce';
import { toast } from '../../../../hooks/useToast';
import rewardService from '../../services/reward.service';
import RewardArt from '../../../student/components/rewards/RewardArt';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const TYPE_OPTIONS = [
  { value: 'sticker', label: 'Stickers' },
  { value: 'emoji', label: 'Emojis' },
];

const ACTION_COPY = {
  activate: { title: 'Activate reward?', confirmLabel: 'Activate', successMessage: 'Reward activated' },
  deactivate: { title: 'Deactivate reward?', confirmLabel: 'Deactivate', successMessage: 'Reward deactivated' },
  delete: { title: 'Delete reward?', confirmLabel: 'Delete', successMessage: 'Reward permanently deleted' },
};

export default function StudentRewardsListPage() {
  const navigate = useNavigate();
  const pagination = usePagination();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [rewardType, setRewardType] = useState('');
  // Students see rewards cheapest first, so that's the default order here too.
  const [sort, setSort] = useState({ by: 'points_cost', order: 'asc' });
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const { data, meta, error, isLoading, run } = useApi(rewardService.listRewards);
  const { page, limit, applyMeta, goToPage } = pagination;

  const load = useCallback(
    () => run({ page, limit, search: debouncedSearch, status, rewardType, sortBy: sort.by, sortOrder: sort.order }),
    [run, page, limit, debouncedSearch, status, rewardType, sort]
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
      if (confirm.type === 'activate') await rewardService.activateReward(confirm.item.id);
      else if (confirm.type === 'deactivate') await rewardService.deactivateReward(confirm.item.id);
      else await rewardService.deleteReward(confirm.item.id);
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
      header: 'Reward',
      sortable: true,
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <RewardArt imageUrl={row.imageUrl} size={32} animate={false} />
          <strong>{row.name}</strong>
        </span>
      ),
    },
    { key: 'rewardType', header: 'Type', render: (row) => (row.rewardType === 'emoji' ? 'Emoji' : row.rewardType === 'sticker' ? 'Sticker' : row.rewardType ?? '—') },
    { key: 'points_cost', header: 'Points to collect', sortable: true, render: (row) => <Badge variant="primary">{row.pointsRequired} pts</Badge> },
    {
      key: 'collectedCount',
      header: 'Collected by',
      render: (row) => `${row.collectedCount ?? 0} ${row.collectedCount === 1 ? 'student' : 'students'}`,
    },
    { key: 'is_active', header: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
          <Tooltip label="Edit" side="top">
            <IconButton icon={<LuPencil aria-hidden="true" />} label="Edit" variant="primary" size="sm" onClick={() => navigate(`/admin/masters/student-rewards/${row.id}/edit`)} />
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

  const hasFilters = Boolean(search || status || rewardType);
  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setRewardType('');
    goToPage(1);
  };

  return (
    <>
      <PageHeader
        title="Student Rewards"
        description="Stickers and emojis students collect automatically as their earned points reach each level."
        breadcrumbs={[{ label: 'Master Management', to: '/admin/masters' }, { label: 'Student Rewards' }]}
        actions={<Button as={Link} to="/admin/masters/student-rewards/create">Add reward</Button>}
      />

      <FilterBar>
        <SearchInput fieldClassName="ui-filterbar__search ui-field--compact" placeholder="Reward name" value={search} onChange={(e) => resetTo(setSearch)(e.target.value)} onClear={() => resetTo(setSearch)('')} />
        <Select fieldClassName="ui-field--compact" label="Type" options={TYPE_OPTIONS} placeholder="All types" value={rewardType} onChange={(e) => resetTo(setRewardType)(e.target.value)} />
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
        emptyTitle={hasFilters ? 'No rewards match those filters' : 'No rewards yet'}
        emptyDescription={hasFilters ? 'Try clearing the search or changing the filters.' : 'Add the first reward.'}
        caption="Student rewards"
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
