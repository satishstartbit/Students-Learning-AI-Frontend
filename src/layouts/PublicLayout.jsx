import { Outlet } from 'react-router-dom';
import { BrandMark, Toast } from '../components/common';

/**
 * Shell for unauthenticated pages: login, forgot/reset password, email
 * verification. Centres a narrow column with the shared brand mark above it
 * - no navigation, no business logic.
 */
export function PublicLayout({ children }) {
  return (
    <div className="ui-shell__public">
      <BrandMark size="md" className="ui-shell__public-brand" />
      <main className="ui-shell__public-inner">{children ?? <Outlet />}</main>
      <Toast />
    </div>
  );
}

export default PublicLayout;
