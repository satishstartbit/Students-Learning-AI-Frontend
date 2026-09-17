import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuEye, LuFilterX, LuPlus } from 'react-icons/lu';
import {
  PageHeader,
  Card,
  SectionHeader,
  Badge,
  Table,
  FilterBar,
  SearchInput,
  Select,
  IconButton,
  StatCard,
  Loader,
  ErrorState,
  EmptyState,
} from '../../../components/common';
import { Tooltip } from '../../../components/ui/tooltip';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatDateTime } from '../../../utils/date';
import dashboardService from '../services/dashboard.service';

const CATEGORY_ALL = '';

/**
 * Fixed display order for known categories, so a whole group - e.g. every
 * Curriculum & Task Setup master - always renders together in one place
 * instead of scattering across an alphabetically-sorted, paginated list (the
 * previous flat table could split a group across pages once there were
 * enough masters). A category not listed here (a future addition) falls back
 * after these, alphabetically.
 */
const CATEGORY_ORDER = [
  'Academic',
  'Curriculum & Task Setup',
  'Assignment',
  'Teacher',
  'Student',
  'Check-In',
  'Regulation Toolkit',
  'Rewards',
  'Personalization',
  'Subscriptions',
  'General',
];

/**
 * Master Management dashboard - every master (generic and dedicated),
 * grouped by category, with total/active/inactive record counts and a link
 * into that master's own list/edit screens.
 */
export default function MasterDashboardPage() {
  const navigate = useNavigate();

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

    return rows;
  }, [masters, debouncedSearch, category]);

  /** Filtered masters, grouped by category and ordered per CATEGORY_ORDER; each group sorted independently. */
  const groups = useMemo(() => {
    const byCategory = new Map();
    filtered.forEach((m) => {
      if (!byCategory.has(m.category)) byCategory.set(m.category, []);
      byCategory.get(m.category).push(m);
    });

    const orderIndex = (cat) => {
      const i = CATEGORY_ORDER.indexOf(cat);
      return i === -1 ? CATEGORY_ORDER.length : i;
    };

    return [...byCategory.entries()]
      .sort(([a], [b]) => orderIndex(a) - orderIndex(b) || a.localeCompare(b))
      .map(([cat, rows]) => {
        const sorted = [...rows].sort((a, b) => {
          const dir = sort.order === 'desc' ? -1 : 1;
          const av = a[sort.by] ?? '';
          const bv = b[sort.by] ?? '';
          if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
          return String(av).localeCompare(String(bv)) * dir;
        });
        return { category: cat, rows: sorted };
      });
  }, [filtered, sort]);

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

  // No 'category' column - the section heading above each group's table already says it.
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
          <Tooltip label="View" side="top">
            <IconButton icon={<LuEye aria-hidden="true" />} label="View" variant="primary" size="sm" onClick={() => navigate(row.viewPath)} />
          </Tooltip>
          <Tooltip label="Add" side="top">
            <IconButton icon={<LuPlus aria-hidden="true" />} label="Add" size="sm" onClick={() => navigate(`${row.viewPath}/create`)} />
          </Tooltip>
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(search || category);

  return (
    <>
      <PageHeader
        title="Master Management"
        description="Reusable reference data used throughout the platform, grouped by area. Deactivate a value instead of deleting it if it is still in use."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <StatCard label="Masters" value={totals.masters} loading={isLoading} />
        <StatCard label="Total records" value={totals.records} loading={isLoading} />
        <StatCard label="Active records" value={totals.active} loading={isLoading} />
      </div>

      <FilterBar>
        <SearchInput
          fieldClassName="ui-filterbar__search ui-field--compact"
          placeholder="Master name or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <Select
          fieldClassName="ui-field--compact"
          label="Category"
          options={categoryOptions}
          placeholder="All categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Tooltip label="Clear filters" side="top">
          <IconButton
            icon={<LuFilterX aria-hidden="true" />}
            label="Clear filters"
            size="sm"
            onClick={() => {
              setSearch('');
              setCategory('');
            }}
            disabled={!hasFilters}
          />
        </Tooltip>
      </FilterBar>

      {error ? (
        <ErrorState error={error} onRetry={run} />
      ) : isLoading && !masters ? (
        <Loader message="Loading master data…" />
      ) : groups.length === 0 ? (
        <EmptyState
          title="No masters match those filters"
          description={hasFilters ? 'Try clearing the search or category filter.' : undefined}
        />
      ) : (
        groups.map(({ category: cat, rows }) => (
          <Card key={cat} flat className="ui-field" aria-busy={isLoading || undefined}>
            <SectionHeader title={cat} actions={<Badge variant="neutral">{rows.length}</Badge>} />
            <Table
              columns={columns}
              data={rows}
              rowKey="code"
              sortBy={sort.by}
              sortOrder={sort.order}
              onSort={(by, order) => setSort({ by, order })}
              caption={`${cat} master data`}
            />
          </Card>
        ))
      )}
    </>
  );
}
