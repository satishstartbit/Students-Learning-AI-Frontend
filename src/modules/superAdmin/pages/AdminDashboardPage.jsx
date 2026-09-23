import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, StatCard, Button } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { USER_ROLES } from '../../../utils/constants';
import adminUserService from '../services/adminUser.service';

/**
 * Admin dashboard shell.
 *
 * The counts come from the user list endpoint's pagination meta - asking for
 * a single row per filter and reading `total`, rather than pulling records
 * the page does not display.
 */
function useUserCount(params) {
  const { meta, run, isLoading } = useApi(adminUserService.listUsers);

  useEffect(() => {
    run({ ...params, limit: 1 }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, JSON.stringify(params)]);

  return { total: meta?.total ?? 0, isLoading };
}

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const students = useUserCount({ role: USER_ROLES.STUDENT });
  const teachers = useUserCount({ role: USER_ROLES.TEACHER });
  const parents = useUserCount({ role: USER_ROLES.PARENT });
  const suspended = useUserCount({ status: 'suspended' });

  return (
    <div className="td-page">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? 'Admin'}`}
        description="Platform overview and account administration."
        actions={
          <Button as={Link} to="/admin/users/create">
            Create user
          </Button>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <StatCard label="Students" value={students.total} icon="🎒" loading={students.isLoading} />
        <StatCard label="Teachers" value={teachers.total} icon="🧑‍🏫" loading={teachers.isLoading} />
        <StatCard label="Parents" value={parents.total} icon="👪" loading={parents.isLoading} />
        <StatCard
          label="Suspended"
          value={suspended.total}
          icon="⛔"
          loading={suspended.isLoading}
          hint="Accounts that cannot sign in"
        />
      </div>
    </div>
  );
}
