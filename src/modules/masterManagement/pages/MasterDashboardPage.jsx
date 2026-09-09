import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, DataTable, SearchInput, Select, Button, StatCard } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { formatDateTime } from '../../../utils/date';
import dashboardService from '../services/dashboard.service';

const CATEGORY_ALL = '';

/**
 * Master Management dashboard - every master (generic and dedicated) as one
 * list of cards, with total/active/inactive record counts and a link into
 * that master's own list/edit screens.
 */
export default function MasterDashboardPage() {
  const navigate = useNavigate();
  const pagination = usePagination();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState({ by: 'label', order: 'asc' });

  const debouncedSearch = useDebounce(search, 350);

  const { data: masters, error, isLoading, run } = useApi(dashboardService.getSummary, { immediate: true });

  const categoryOptions = useMemo(() => {
    const seen = new Set();
    (masters ?? []).forEach((m) => seen.add(m.category));
    return [...seen].sort().map((c) => ({ value: c, label: c }));
  }, [masters]);

  const filtered = useMemo(() => {
    let rows = masters ?? [];

    if (debouncedSearch) {
      const term = debouncedSearch.trim().toLowerCase();
      rows = rows.filter(
        (m) => m.label.toLowerCase().includes(term) || (m.description ?? '').toLowerCase().includes(term)
      );
    }
    if (category !== CATEGORY_ALL) rows = rows.filter((m) => m.category === category);

    const sorted = [...rows].sort((a, b) => {
      const dir = sort.order === 'desc' ? -1 : 1;
      const av = a[sort.by] ?? '';
      const bv = b[sort.by] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    return sorted;
  }, [masters, debouncedSearch, category, sort]);

  const { page, limit, goToPage, setTotal } = pagination;

  useEffect(() => {
    setTotal(filtered.length);
  }, [filtered.length, setTotal]);

  const pageRows = filtered.slice((page - 1) * limit, (page - 1) * limit + limit);

  const totals = useMemo(
    () =>
      (masters ?? []).reduce(
        (acc, m) => ({
          masters: acc.masters + 1,
          records: acc.records + m.totalRecords,
          active: acc.active + m.activeRecords,
        }),
        { masters: 0, records: 0, active: 0 }
      ),
    [masters]
  );

  const columns = [
    {
      key: 'label',
      header: 'Master',
      sortable: true,
      render: (row) => (
        <div>
          <strong>{row.label}</strong>
          {row.description && <div className="ui-hint">{row.description}</div>}
        </div>
      ),
    },
    { key: 'category', header: 'Category' },
    { key: 'totalRecords', header: 'Total', sortable: true },
    { key: 'activeRecords', header: 'Active', sortable: true },
    { key: 'inactiveRecords', header: 'Inactive', sortable: true },
    {
      key: 'lastUpdated',
      header: 'Last updated',
      sortable: true,
      render: (row) => (row.lastUpdated ? formatDateTime(row.lastUpdated) : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
          <Button size="sm" variant="secondary" onClick={() => navigate(row.viewPath)}>
            View
          </Button>
          <Button size="sm" onClick={() => navigate(`${row.viewPath}/create`)}>
            Add
          </Button>
        </div>
      ),
    },
  ];

  const resetTo = (setter) => (value) => {
    setter(value);
    goToPage(1);
  };

  return (
    <>
      <PageHeader
        title="Master Management"
        description="Reusable reference data used throughout the platform. Deactivate a value instead of deleting it if it is still in use."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <StatCard label="Masters" value={totals.masters} loading={isLoading} />
        <StatCard label="Total records" value={totals.records} loading={isLoading} />
        <StatCard label="Active records" value={totals.active} loading={isLoading} />
      </div>

      <Card flat className="ui-field">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-md)' }}>
          <SearchInput
            label="Search"
            placeholder="Master name or description"
            value={search}
            onChange={(e) => resetTo(setSearch)(e.target.value)}
            onClear={() => resetTo(setSearch)('')}
          />
          <Select
            label="Category"
            options={categoryOptions}
            placeholder="All categories"
            value={category}
            onChange={(e) => resetTo(setCategory)(e.target.value)}
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={pageRows}
        rowKey="code"
        isLoading={isLoading}
        error={error}
        onRetry={run}
        sortBy={sort.by}
        sortOrder={sort.order}
        onSort={(by, order) => setSort({ by, order })}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle="No masters match those filters"
        emptyDescription="Try clearing the search or category filter."
        caption="Master data"
      />
    </>
  );
}
