import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LuBell, LuChevronRight, LuLogOut, LuStar, LuUser } from 'react-icons/lu';
import { Modal } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import useNotifications from '../modules/notifications/hooks/useNotifications';
import NotificationBell from '../modules/notifications/components/NotificationBell';
import { AvatarPicture } from '../modules/student/components/personalize/AvatarPicture';
import { useStudentSettings } from '../modules/student/hooks/useStudentSettings';
import { APP_NAME } from '../utils/constants';
import { formatName, getInitials } from '../utils/format';
import { flattenNav, PROFILE_PATH_BY_ROLE } from './navConfig';
import './mobileChrome.css';

/**
 * The phone shell for Teacher, Parent and Grade 6+ Student (the mobile
 * mockups), used by AuthenticatedLayout below the md breakpoint when the role
 * passes `mobileTabs`:
 *
 *   top bar   brand, notifications, and the account avatar - which opens
 *             "More": every page that isn't one of the five tabs, the
 *             account page and Log out
 *   tab bar   five thumb-reachable destinations, the current one on a soft
 *             accent pill
 *
 * The desktop sidebar is untouched; this only replaces it on phones.
 */

function Initials({ size = 32 }) {
  const { user } = useAuth();
  // Inert outside the student shells (no provider), so other roles keep initials.
  const { settings } = useStudentSettings();
  return (
    <span className="am-avatar" style={{ width: size, height: size }} aria-hidden="true">
      <AvatarPicture imageUrl={settings?.avatar?.imageUrl} size={size}>
        <span>{getInitials(formatName(user)) || '?'}</span>
      </AvatarPicture>
    </span>
  );
}

/** Grade 6+ students read notifications on their own page, so the bell is a link there. */
function NotificationsLink({ to }) {
  const { unreadCount } = useNotifications({ limit: 1 });
  return (
    <Link to={to} className="am-iconbtn" aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}>
      <LuBell aria-hidden="true" />
      {unreadCount > 0 && <span className="am-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </Link>
  );
}

/** "More" - the pages that aren't tabs, the account page, and Log out. */
function MoreSheet({ isOpen, onClose, items, accountSubtitle }) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const profilePath = PROFILE_PATH_BY_ROLE[role];
  const links = profilePath && !items.some((i) => i.to === profilePath) ? [...items, { to: profilePath, label: 'Account', icon: LuUser }] : items;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={formatName(user) || 'Your account'}
      description={accountSubtitle ?? user?.email}
      size="sm"
      className="am-sheet"
    >
      <nav aria-label="More">
        <ul className="am-more">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className="am-more__link" onClick={onClose}>
                  {Icon && <Icon aria-hidden="true" className="am-more__icon" />}
                  <span className="am-more__label">{item.label}</span>
                  <LuChevronRight aria-hidden="true" className="am-more__chevron" />
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <button
        type="button"
        className="am-more__link am-more__link--danger"
        onClick={() => {
          onClose();
          signOut();
          navigate('/login', { replace: true });
        }}
      >
        <LuLogOut aria-hidden="true" className="am-more__icon" />
        <span className="am-more__label">Log out</span>
      </button>
    </Modal>
  );
}

/**
 * @param navItems          the role's sidebar entries (flat or grouped)
 * @param mobileTabs        the five tab destinations
 * @param notificationsPath a page to link the bell to (students); otherwise the bell dropdown
 */
/**
 * `brandSlot` (parents: the viewing-child chip) takes the place of the app
 * name next to the logo, as the parent "child view" mobile mockup shows it.
 */
export function MobileTopBar({ navItems, mobileTabs, notificationsPath, accountSubtitle, brandSlot }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const tabPaths = new Set(mobileTabs.map((t) => t.to));
  const more = flattenNav(navItems).filter((item) => !tabPaths.has(item.to));

  // Any navigation closes the sheet (a link inside it, or the browser's Back).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (moreOpen) setMoreOpen(false);
  }

  return (
    <header className="am-topbar">
      <div className="am-brandrow">
        <Link to="/" className="am-brand" aria-label={brandSlot ? APP_NAME : undefined}>
          <span className="am-brand__mark" aria-hidden="true">
            <LuStar />
          </span>
          {!brandSlot && <span className="am-brand__name">{APP_NAME}</span>}
        </Link>
        {brandSlot}
      </div>

      <div className="am-topbar__actions">
        {notificationsPath ? <NotificationsLink to={notificationsPath} /> : <NotificationBell />}
        <button
          type="button"
          className="am-avatarbtn"
          aria-label="Account and more pages"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
        >
          <Initials />
        </button>
      </div>

      <MoreSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} items={more} accountSubtitle={accountSubtitle} />
    </header>
  );
}

export function MobileTabBar({ items }) {
  return (
    <nav aria-label="Main" className="am-tabbar">
      <ul className="am-tabbar__list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="am-tabbar__item">
              <NavLink to={item.to} end={item.end} className="am-tab">
                <Icon aria-hidden="true" className="am-tab__icon" />
                <span className="am-tab__label">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
