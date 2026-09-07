import { Outlet } from 'react-router-dom';
import { Toast } from '../components/common';

/**
 * Shell for unauthenticated pages: login, forgot/reset password, email
 * verification. Centres a narrow column - no navigation, no business logic.
 */
export function PublicLayout({ children }) {
  return (
    <div className="ui-shell__public">
      <main className="ui-shell__public-inner">{children ?? <Outlet />}</main>
      <Toast />
    </div>
  );
}

export default PublicLayout;
