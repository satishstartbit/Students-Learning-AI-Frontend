import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../../utils/constants';
import { LuArrowLeft, LuHouse, LuLogIn } from 'react-icons/lu';
import { Button } from '../../components/common';
import { StatusView } from '../../components/status/StatusView';
import { useAuth } from '../../hooks/useAuth';

/**
 * 404 - "We can't find that page".
 *
 *   standalone  an address outside every area (/whatever): the whole screen,
 *               with the brand, and a way home (or to sign in)
 *   inShell     an unknown address inside a role's area (/teacher/whatever):
 *               drawn inside that role's layout, so the navigation stays
 *
 * Shows the address that wasn't found, so a mistyped link is easy to spot.
 */
export default function NotFoundPage({ inShell = false }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, homePath } = useAuth();
  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

  // The tab says so too, for as long as this page is showing.
  useEffect(() => {
    const previous = document.title;
    document.title = `Page not found · ${APP_NAME}`;
    return () => {
      document.title = previous;
    };
  }, []);

  const home = isAuthenticated ? (
    <Button as={Link} to={homePath || '/'} startIcon={<LuHouse aria-hidden="true" />}>
      Go to your home
    </Button>
  ) : (
    <Button as={Link} to="/login" startIcon={<LuLogIn aria-hidden="true" />}>
      Go to sign in
    </Button>
  );

  return (
    <StatusView
      kind="pageNotFound"
      variant={inShell ? 'shell' : 'page'}
      role="main"
      actions={
        <>
          {home}
          {canGoBack && (
            <Button variant="secondary" startIcon={<LuArrowLeft aria-hidden="true" />} onClick={() => navigate(-1)}>
              Go back
            </Button>
          )}
        </>
      }
    >
      <p className="st-path">
        <span className="ui-sr-only">Address: </span>
        {pathname}
      </p>
    </StatusView>
  );
}
