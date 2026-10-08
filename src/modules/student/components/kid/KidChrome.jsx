import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import BrandMark from '../../../../components/common/BrandMark';
import { cn } from '../../../../lib/utils';
import { useAuth } from '../../../../hooks/useAuth';
import { APP_NAME } from '../../../../utils/constants';
import { useStudentExperience } from '../../hooks/useStudentExperience';
import { KidAvatar } from './KidAvatar';
import { KID_FOOT_ITEMS, KID_NAV_ITEMS, KID_SETTINGS_ITEM, KID_TAB_ITEMS } from './kidNav';

/**
 * The K-4 shell's navigation, drawn to the Kids Focus mockups: a calm
 * sidebar on laptops and desktops ("Growing Focus", outline icons, the page
 * you are on lightly shaded), and a top bar plus a bottom tab bar
 * (thumb-reachable, like a tablet app) below the `lg` breakpoint.
 */

/** The same "Growing Focus" mark as every other shell (BrandMark), in the kid display type. */
function Brand() {
  return (
    <Link to="/student" className="flex min-w-0 items-center rounded-2xl no-underline">
      <BrandMark name={APP_NAME} size="md" className="min-w-0 font-kid-display" />
    </Link>
  );
}

function SidebarLink({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 items-center gap-3 rounded-xl px-3 font-kid-display text-base text-kid-ink no-underline transition-colors',
          isActive ? 'bg-[var(--accent-soft)] font-semibold' : 'text-kid-ink-soft hover:bg-kid-paper-deep/60 hover:text-kid-ink'
        )
      }
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

/** The student's own tile at the foot of the sidebar - it opens Settings. */
function ProfileTile() {
  const { user } = useAuth();
  const { profile, grade } = useStudentExperience();

  return (
    <Link
      to={KID_SETTINGS_ITEM.to}
      className="flex items-center gap-3 rounded-xl p-2 no-underline transition-colors hover:bg-kid-paper-deep/60"
    >
      <KidAvatar photoUrl={profile?.profileImageUrl} size="sm" />
      <span className="min-w-0">
        <span className="block truncate font-kid-display text-base font-semibold text-kid-ink">
          {user?.firstName}
        </span>
        {grade && <span className="block truncate text-sm text-kid-ink-soft">{grade}</span>}
      </span>
    </Link>
  );
}

export function KidSidebar() {
  return (
    <aside className="kid-ui relative hidden min-h-0 w-60 shrink-0 flex-col border-r border-kid-edge bg-kid-sidebar px-3 pb-4 pt-5 lg:flex">
      <div className="shrink-0 px-2">
        <Brand />
      </div>

      <nav aria-label="Main" className="mt-7 min-h-0 flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-1">
          {KID_NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <SidebarLink item={item} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4 flex shrink-0 flex-col gap-1">
        {KID_FOOT_ITEMS.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
        <SidebarLink item={KID_SETTINGS_ITEM} />
        <hr className="my-2 h-0 border-0 border-t border-kid-edge" />
        <ProfileTile />
      </div>
    </aside>
  );
}

export function KidTopBar() {
  const { profile } = useStudentExperience();

  return (
    <header className="kid-ui flex h-16 shrink-0 items-center justify-between gap-3 border-b-2 border-kid-edge bg-kid-sidebar px-4 lg:hidden">
      <Brand />
      <Link to={KID_SETTINGS_ITEM.to} aria-label="Settings" className="rounded-full">
        <KidAvatar photoUrl={profile?.profileImageUrl} size="sm" />
      </Link>
    </header>
  );
}

export function KidTabBar() {
  const { pathname } = useLocation();
  const scrollRef = useRef(null);

  // Keep a newly selected destination visible without scrolling the page.
  useEffect(() => {
    const nav = scrollRef.current;
    const active = nav?.querySelector('[aria-current="page"]');
    if (!active) return;
    const navBounds = nav.getBoundingClientRect();
    const activeBounds = active.getBoundingClientRect();
    nav.scrollBy({
      left: activeBounds.left - navBounds.left - (nav.clientWidth - activeBounds.width) / 2,
      behavior: 'auto',
    });
  }, [pathname]);

  return (
    <nav
      aria-label="Main"
      className="kid-ui fixed inset-x-0 bottom-0 z-40 border-t-2 border-kid-edge bg-kid-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
    >
      <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain">
        <ul className="mx-auto flex w-full min-w-max">
          {KID_TAB_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="min-w-24 flex-1">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className="flex h-[4.25rem] flex-col items-center justify-center gap-0.5 whitespace-nowrap px-2 font-kid-display text-[0.8rem] text-kid-ink no-underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-kid-teal"
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'grid h-9 w-14 place-items-center rounded-full transition-colors',
                          isActive && 'bg-[var(--accent-soft)]'
                        )}
                      >
                        <Icon className="size-6" aria-hidden="true" />
                      </span>
                      <span className={cn(isActive && 'font-semibold')}>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
