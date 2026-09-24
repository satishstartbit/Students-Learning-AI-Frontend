import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../../../lib/utils';
import { useAuth } from '../../../../hooks/useAuth';
import { useStudentExperience } from '../../hooks/useStudentExperience';
import { KidAvatar } from './KidAvatar';
import { StarIcon } from './KidIcons';
import { KID_NAV_ITEMS, KID_SETTINGS_ITEM } from './kidNav';

/**
 * The K-5 shell's navigation: a roomy sidebar on laptops and desktops, and
 * a top bar plus a bottom tab bar (thumb-reachable, like a tablet app) below
 * the `lg` breakpoint.
 */

function Brand() {
  return (
    <Link to="/student" className="flex items-center gap-3 rounded-2xl no-underline">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-kid-blue shadow-paper lg:size-14">
        <StarIcon className="size-8 lg:size-9" />
      </span>
      <span className="font-kid-display text-lg font-semibold leading-tight text-kid-navy lg:text-xl">
        My Learning <br />
        Space
      </span>
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
          'group flex h-14 items-center gap-4 rounded-2xl px-3.5 font-kid-display text-[1.2rem] text-kid-navy no-underline transition-colors',
          isActive ? 'bg-kid-sky font-semibold shadow-paper' : 'hover:bg-kid-paper-deep/70'
        )
      }
    >
      <Icon className="size-8 shrink-0 transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110" />
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
      className="flex items-center gap-3 rounded-2xl p-2 no-underline transition-colors hover:bg-kid-paper-deep/70"
    >
      <KidAvatar photoUrl={profile?.profileImageUrl} size="md" />
      <span className="min-w-0">
        <span className="block truncate font-kid-display text-lg font-semibold text-kid-ink">
          {user?.firstName}
        </span>
        {grade && <span className="block truncate text-base text-kid-ink-soft">{grade}</span>}
      </span>
    </Link>
  );
}

export function KidSidebar() {
  return (
    <aside className="kid-ui relative hidden min-h-0 w-64 shrink-0 flex-col border-r border-kid-edge bg-kid-sidebar px-4 pb-4 pt-6 lg:flex">
      <div className="shrink-0 px-1">
        <Brand />
      </div>

      <nav aria-label="Main" className="my-6 min-h-0 flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-1.5">
          {KID_NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <SidebarLink item={item} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto flex shrink-0 flex-col gap-3">
        <SidebarLink item={KID_SETTINGS_ITEM} />
        <hr className="m-0 h-0 border-0 border-t border-kid-edge" />
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
          {KID_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="min-w-24 flex-1">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className="flex h-[4.25rem] flex-col items-center justify-center gap-0.5 whitespace-nowrap px-2 font-kid-display text-[0.8rem] text-kid-navy no-underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-kid-teal"
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'grid h-9 w-14 place-items-center rounded-full transition-colors',
                          isActive && 'bg-kid-sky'
                        )}
                      >
                        <Icon className="size-7" />
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
