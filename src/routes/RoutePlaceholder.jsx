import { useLocation } from 'react-router-dom';
import { EmptyState, PageHeader } from '../components/common';

/**
 * Stand-in until a module supplies the real page for a route.
 *
 * Its own file so pages that choose between variants (student/pages/
 * GradeBandPage.jsx) can fall back to it without importing the router.
 */
export function RoutePlaceholder({ label }) {
  const { pathname } = useLocation();

  return (
    <>
      <PageHeader title={label} description={pathname} />
      <EmptyState
        icon="🚧"
        title="Not built yet"
        description="This route is wired up and guarded. Its page component will be added when this Phase 1 module is implemented."
      />
    </>
  );
}

export default RoutePlaceholder;
