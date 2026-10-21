import { Link, useLocation } from 'react-router-dom';
import { LuArrowLeft } from 'react-icons/lu';
import { Button } from '../../../components/common';
import { listAddress } from '../../../utils/listQuery';
import './masterPages.css';

/**
 * "Back" at the top of every Master Management page (2026-10-20, user
 * request). Worked out from the address, so every page gets it the same way:
 *
 *   /admin/masters/<list>                  → Master Management
 *   /admin/masters/<list>/create, …/edit,
 *   …/:id/redemptions                      → that list
 *
 * It returns to where that page was left (utils/listQuery#listAddress): the
 * dashboard keeps its search, area and section sorts; a list kept in the
 * address (subscription plans, discount codes) keeps its filters and page.
 */
export function MasterBackButton() {
  const { pathname } = useLocation();
  const match = /^\/admin\/masters\/([^/]+)(\/.+)?$/.exec(pathname);
  if (!match) return null;

  const inList = Boolean(match[2]);
  const target = inList ? `/admin/masters/${match[1]}` : '/admin/masters';
  return (
    <Button as={Link} to={listAddress(target)} variant="ghost" size="sm" className="ms-back" startIcon={<LuArrowLeft aria-hidden="true" />}>
      {inList ? 'Back to the list' : 'Back to Master Management'}
    </Button>
  );
}

export default MasterBackButton;
