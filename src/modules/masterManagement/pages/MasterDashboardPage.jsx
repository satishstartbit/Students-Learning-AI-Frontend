import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuChevronDown, LuCircleCheck, LuCircleX, LuDatabase, LuEye, LuList, LuPlus } from 'react-icons/lu';
import {
  PageHeader,
  Card,
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
import { formatDate } from '../../../utils/date';
import dashboardService from '../services/dashboard.service';
import './masterDashboard.css';

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

/** One area's card: the heading collapses the table under it. */
function AreaCard({ category, rows, columns, sort, onSort, busy }) {
  const [open, setOpen] = useState(true);
  const headingId = `mm-area-${category.replace(/\W+/g, '-').toLowerCase()}`;

  return (
    <Card flat padded={false} className="mm-group" aria-busy={busy || undefined}>
      <button
        type="button"
        id={headingId}
        className="mm-group__head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <LuChevronDown className="mm-group__chevron" aria-hidden="true" />
        <span className="mm-group__title">{category}</span>
        <Badge variant="neutral">{rows.length}</Badge>
      </button>

      {open && (
        <Table
          columns={columns}
          data={rows}
          rowKey="code"
          sortBy={sort.by}
          sortOrder={sort.order}
          onSort={onSort}
          caption={`${category} master data`}
        />
      )}
    </Card>
  );
}

/**
 * Master Management dashboard - every master (generic and dedicated),
 * grouped by area, with total/active/inactive record counts and a link
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

  const totals = useMemo(() => {
    const areas = new Set();
    return (masters ?? []).reduce(
      (acc, m) => {
        areas.add(m.category);
        return {
          masters: acc.masters + 1,
          records: acc.records + m.totalRecords,
          active: acc.active + m.activeRecords,
          inactive: acc.inactive + m.inactiveRecords,
          areas: areas.size,
        };
      },
      { masters: 0, records: 0, active: 0, inactive: 0, areas: 0 }
    );
  }, [masters]);

  // No 'category' column - the heading above each group's table already says it.
  const columns = [
    {
      key: 'label',
      header: 'Master',
      sortable: true,
      render: (row) => (
        <div>
          <div className="mm-master__name">{row.label}</div>
          {row.description && <div className="ui-hint">{row.description}</div>}
        </div>
      ),
    },
    { key: 'totalRecords', header: 'Total', sortable: true, width: 90 },
    { key: 'activeRecords', header: 'Active', sortable: true, width: 90 },
    {
      key: 'inactiveRecords',
      header: 'Inactive',
      sortable: true,
      width: 100,
      // Worth a glance: these rows are hidden from the product.
      render: (row) =>
        row.inactiveRecords > 0 ? <span className="mm-count--flagged">{row.inactiveRecords}</span> : <span className="mm-muted">0</span>,
    },
    {
      key: 'lastUpdated',
      header: 'Last updated',
      sortable: true,
      width: 150,
      render: (row) => (row.lastUpdated ? formatDate(row.lastUpdated) : <span className="mm-muted">—</span>),
    },
    {
      key: 'actions',
      header: <span className="ui-sr-only">Actions</span>,
      align: 'right',
      width: 100,
      render: (row) => (
        <div className="mm-row-actions">
          <Tooltip label="View" side="top">
            <IconButton icon={<LuEye aria-hidden="true" />} label={`View ${row.label}`} size="sm" onClick={() => navigate(row.viewPath)} />
          </Tooltip>
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(search || category);

  return (
    <div className="td-page">
      <PageHeader
        title="Master Management"
        description="Reference lists used across the platform, grouped by area. Deactivate a value instead of deleting it when it is still in use."
      />

      <div className="mm-stats">
        <StatCard
          label="Masters"
          value={totals.masters}
          hint={`${totals.areas} ${totals.areas === 1 ? 'area' : 'areas'}`}
          icon={<LuDatabase aria-hidden="true" />}
          loading={isLoading && !masters}
        />
        <StatCard
          label="Total records"
          value={totals.records}
          hint="across all masters"
          icon={<LuList aria-hidden="true" />}
          loading={isLoading && !masters}
        />
        <StatCard
          label="Active"
          value={totals.active}
          hint="shown in the product"
          icon={<LuCircleCheck aria-hidden="true" />}
          loading={isLoading && !masters}
        />
        <StatCard
          label="Inactive"
          value={totals.inactive}
          hint="hidden but kept for history"
          icon={<LuCircleX aria-hidden="true" />}
          loading={isLoading && !masters}
        />
      </div>

      <FilterBar>
        <SearchInput
          fieldClassName="ui-filterbar__search ui-field--compact"
          placeholder="Search masters"
          aria-label="Search masters"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <Select
          fieldClassName="ui-field--compact"
          aria-label="Area"
          options={categoryOptions}
          placeholder="All areas"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </FilterBar>

      {error ? (
        <ErrorState error={error} onRetry={run} />
      ) : isLoading && !masters ? (
        <Loader message="Loading master data…" />
      ) : groups.length === 0 ? (
        <EmptyState
          title="No masters match those filters"
          description={hasFilters ? 'Try clearing the search or choosing All areas.' : undefined}
        />
      ) : (
        groups.map(({ category: cat, rows }) => (
          <AreaCard
            key={cat}
            category={cat}
            rows={rows}
            columns={columns}
            sort={sort}
            onSort={(by, order) => setSort({ by, order })}
            busy={isLoading}
          />
        ))
      )}
    </div>
  );
}
