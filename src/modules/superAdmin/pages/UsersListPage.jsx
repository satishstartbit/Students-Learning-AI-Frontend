import { useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuEye, LuFilterX } from 'react-icons/lu';
import {
  PageHeader,
  Button,
  IconButton,
  FilterBar,
  DataTable,
  SearchInput,
  Select,
  StatusBadge,
  Badge,
  Toast,
} from '../../../components/common';
import { Tooltip } from '../../../components/ui/tooltip';
import { useApi } from '../../../hooks/useApi';
import { useListQuery } from '../../../hooks/useListQuery';
import { useAddressText } from '../../../hooks/useAddressText';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatDateTime, formatRelative } from '../../../utils/date';
import { formatName } from '../../../utils/format';
import { USER_ROLES, USER_STATUS, ROLE_LABELS, ROLE_CREATE_PATH } from '../../../utils/constants';
import adminUserService from '../services/adminUser.service';

/**
 * Super Admin user list.
 *
 * Search, filtering, sorting and paging all happen on the server - the
 * browser only ever holds one page of users.
 */
const ROLE_OPTIONS = [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.PARENT].map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}));

const STATUS_OPTIONS = Object.values(USER_STATUS).map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

const VERIFIED_OPTIONS = [
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Not verified' },
];

/** Sub-heading for each per-role view. */
const DESCRIPTIONS = {
  [USER_ROLES.STUDENT]: 'Students are added by their parent, who also sets up their account.',
  [USER_ROLES.PARENT]: 'Parents manage their own children from their record.',
  [USER_ROLES.TEACHER]: 'Teachers are assigned students from the Relationships page.',
};

/** Empty-state copy per view - a locked role needs its own wording. */
const EMPTY_COPY = {
  [USER_ROLES.STUDENT]: {
    title: 'No students yet',
    description: 'A student account is created by their parent from the parent’s record.',
  },
  [USER_ROLES.PARENT]: {
    title: 'No parents yet',
    description: 'Parents can register themselves, or be created here.',
  },
  [USER_ROLES.TEACHER]: {
    title: 'No teachers yet',
    description: 'Teachers can register themselves, or be created here.',
  },
};

/**
 * The Super Admin user list.
 *
 * @param fixedRole - when set, the listing is locked to that role and the role
 *        filter is hidden. The sidebar's Students / Parents / Teachers entries
 *        reuse this page that way instead of duplicating the screen.
 */
export default function UsersListPage({ fixedRole = null }) {
  const navigate = useNavigate();
  // Filters, sort and page live in the address (2026-10-20): Back from a user's
  // record shows the list as it was left. Each role's list has its own address.
  const { query, setQuery, pagination } = useListQuery({
    search: '', role: '', status: '', emailVerified: '', sortBy: 'created_at', sortOrder: 'desc',
  });
  const { search, role, status, emailVerified } = query;
  const sort = { by: query.sortBy, order: query.sortOrder };

  // A locked role always wins over the dropdown.
  const effectiveRole = fixedRole ?? role;

  const debouncedSearch = useDebounce(search, 350);

  const { data, meta, error, isLoading, run } = useApi(adminUserService.listUsers);

  const { page, limit, applyMeta, goToPage } = pagination;

  const load = useCallback(
    () =>
      run({
        page,
        limit,
        search: debouncedSearch,
        role: effectiveRole,
        status,
        emailVerified,
        sortBy: sort.by,
        sortOrder: sort.order,
      }),
    [run, page, limit, debouncedSearch, effectiveRole, status, emailVerified, sort.by, sort.order]
  );

  useEffect(() => {
    load().catch(() => {
      /* surfaced through `error` */
    });
  }, [load]);

  // Keep the pager in step with what the server reported.
  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  // Any filter change starts again from page one.
  const filterBy = (key) => (value) => setQuery({ [key]: value, page: 1 });
  const [searchText, typeSearch] = useAddressText(search, filterBy('search'));

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <Link to={`/admin/users/${row.id}`} style={{ fontWeight: 600 }}>
          {formatName(row)}
        </Link>
      ),
    },
    { key: 'username', header: 'Username', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <Badge variant="primary">{ROLE_LABELS[row.role] ?? row.role}</Badge>,
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'emailVerified',
      header: 'Email verified',
      render: (row) =>
        row.emailVerified ? (
          <Badge variant="success" dot>
            Verified
          </Badge>
        ) : (
          <Badge variant="warning" dot>
            Pending
          </Badge>
        ),
    },
    // {
    //   key: 'lastLoginAt',
    //   header: 'Last login',
    //   sortable: true,
    //   render: (row) => (row.lastLoginAt ? formatRelative(row.lastLoginAt) : '—'),
    // },
    // {
    //   key: 'createdAt',
    //   header: 'Created',
    //   sortable: true,
    //   render: (row) => formatDateTime(row.createdAt),
    // },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Tooltip label="View" side="top">
          <IconButton icon={<LuEye aria-hidden="true" />} label="View" variant="primary" size="sm" onClick={() => navigate(`/admin/users/${row.id}`)} />
        </Tooltip>
      ),
    },
  ];

  // Teachers and parents each have their own create page. Students are added
  // by their parent, so there is no "create" here for them.
  const createPath = ROLE_CREATE_PATH[fixedRole];

  // Distinguishes "nothing here yet" from "nothing matched your filters".
  const hasFilters = Boolean(search || status || emailVerified || (!fixedRole && role));
  const clearFilters = () => setQuery({ search: '', role: '', status: '', emailVerified: '', page: 1 });

  const heading = fixedRole
    ? { title: `${ROLE_LABELS[fixedRole]}s`, description: DESCRIPTIONS[fixedRole] }
    : {
        title: 'Users',
        description: 'Search, filter and manage every account on the platform.',
      };

  return (
    <div className="td-page">
      <PageHeader
        title={heading.title}
        description={heading.description}
        actions={
          createPath ? (
            <Button as={Link} to={createPath}>
              Create {ROLE_LABELS[fixedRole].toLowerCase()}
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput
          fieldClassName="ui-filterbar__search ui-field--compact"
          placeholder="Name or email"
          value={searchText}
          onChange={(e) => typeSearch(e.target.value)}
          onClear={() => typeSearch('')}
        />
        {/* Hidden when the route already fixes the role. */}
        {!fixedRole && (
          <Select
            fieldClassName="ui-field--compact"
            label="Role"
            options={ROLE_OPTIONS}
            placeholder="All roles"
            value={role}
            onChange={(e) => filterBy('role')(e.target.value)}
          />
        )}
        <Select
          fieldClassName="ui-field--compact"
          label="Status"
          options={STATUS_OPTIONS}
          placeholder="All statuses"
          value={status}
          onChange={(e) => filterBy('status')(e.target.value)}
        />
        <Select
          fieldClassName="ui-field--compact"
          label="Email verification"
          options={VERIFIED_OPTIONS}
          placeholder="Any"
          value={emailVerified}
          onChange={(e) => filterBy('emailVerified')(e.target.value)}
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
        sortBy={sort.by === 'first_name' ? 'name' : sort.by}
        sortOrder={sort.order}
        onSort={(by, order) => setQuery({ sortBy: by === 'name' ? 'first_name' : by, sortOrder: order, page: 1 })}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle={
          hasFilters
            ? 'No users match those filters'
            : (EMPTY_COPY[fixedRole]?.title ?? 'No users yet')
        }
        emptyDescription={
          hasFilters
            ? 'Try clearing the search or changing the filters.'
            : EMPTY_COPY[fixedRole]?.description
        }
        caption={fixedRole ? `${ROLE_LABELS[fixedRole]} accounts` : 'Platform users'}
      />

      <Toast />
    </div>
  );
}
