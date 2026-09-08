import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Button,
  Card,
  DataTable,
  SearchInput,
  Select,
  StatusBadge,
  Badge,
  Toast,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatDateTime, formatRelative } from '../../../utils/date';
import { formatName } from '../../../utils/format';
import { USER_ROLES, USER_STATUS, ROLE_LABELS } from '../../../utils/constants';
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

export default function UsersListPage() {
  const navigate = useNavigate();
  const pagination = usePagination();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [emailVerified, setEmailVerified] = useState('');
  const [sort, setSort] = useState({ by: 'created_at', order: 'desc' });

  const debouncedSearch = useDebounce(search, 350);

  const { data, meta, error, isLoading, run } = useApi(adminUserService.listUsers);

  const { page, limit, applyMeta, goToPage } = pagination;

  const load = useCallback(
    () =>
      run({
        page,
        limit,
        search: debouncedSearch,
        role,
        status,
        emailVerified,
        sortBy: sort.by,
        sortOrder: sort.order,
      }),
    [run, page, limit, debouncedSearch, role, status, emailVerified, sort]
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
  const resetTo = (setter) => (value) => {
    setter(value);
    goToPage(1);
  };

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
    {
      key: 'lastLoginAt',
      header: 'Last login',
      sortable: true,
      render: (row) => (row.lastLoginAt ? formatRelative(row.lastLoginAt) : '—'),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/users/${row.id}`)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Search, filter and manage every account on the platform."
        actions={
          <Button as={Link} to="/admin/users/create">
            Create user
          </Button>
        }
      />

      <Card flat className="ui-field">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          <SearchInput
            label="Search"
            placeholder="Name or email"
            value={search}
            onChange={(e) => resetTo(setSearch)(e.target.value)}
            onClear={() => resetTo(setSearch)('')}
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            placeholder="All roles"
            value={role}
            onChange={(e) => resetTo(setRole)(e.target.value)}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={status}
            onChange={(e) => resetTo(setStatus)(e.target.value)}
          />
          <Select
            label="Email verification"
            options={VERIFIED_OPTIONS}
            placeholder="Any"
            value={emailVerified}
            onChange={(e) => resetTo(setEmailVerified)(e.target.value)}
          />
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
        onSort={(by, order) => setSort({ by: by === 'name' ? 'first_name' : by, order })}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle="No users match those filters"
        emptyDescription="Try clearing the search or changing the filters."
        caption="Platform users"
      />

      <Toast />
    </>
  );
}
