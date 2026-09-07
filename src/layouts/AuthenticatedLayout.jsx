import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar, Sidebar, Dropdown, Avatar, IconButton, Toast } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../utils/constants';
import { formatName } from '../utils/format';

/**
 * Base shell shared by every signed-in role.
 *
 * The role layouts supply their own navigation items and pass them here, so
 * the chrome exists once rather than four times.
 */
export function AuthenticatedLayout({ navItems = [], title, children }) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="ui-shell">
      <Navbar
        brand={title ?? 'Executive Functioning'}
        end={
          <Dropdown
            align="end"
            trigger={
              <IconButton
                label="Account menu"
                icon={<Avatar name={formatName(user)} size="sm" src={user?.avatarUrl} />}
              />
            }
            items={[
              { key: 'who', label: `${formatName(user)} · ${ROLE_LABELS[role] ?? ''}`, disabled: true },
              { divider: true },
              { key: 'signout', label: 'Sign out', icon: '↩', danger: true, onClick: handleSignOut },
            ]}
          />
        }
      />

      <div className="ui-shell__body">
        {navItems.length > 0 && <Sidebar items={navItems} />}
        <main className="ui-shell__main">{children ?? <Outlet />}</main>
      </div>

      <Toast />
    </div>
  );
}

export default AuthenticatedLayout;
