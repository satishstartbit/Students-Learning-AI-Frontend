import { Outlet, useLocation } from 'react-router-dom';
import { LuPanelLeft } from 'react-icons/lu';
import { Toast } from '../components/common';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';
import { useAuth } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/useIsMobile';
import { useSyncUserLocale } from '../hooks/useSyncUserLocale';
import NotificationBell from '../modules/notifications/components/NotificationBell';
import AppSidebar from './AppSidebar';
import { MobileTabBar, MobileTopBar } from './MobileChrome';
import AppErrorBoundary from '../components/status/AppErrorBoundary';

const COMPACT_BREAKPOINT = 1024;

/**
 * Base shell shared by every signed-in role.
 *
 * Layout is a single flex row: the sidebar is a shrink-0 column and the inset
 * takes the remainder. Scrolling happens in <main>, not on the page, so the
 * sidebar and the header stay put while content moves.
 *
 * The account menu lives in the sidebar footer, so the top bar carries only
 * the collapse trigger and the page title.
 *
 * Only the sidebar chrome is Tailwind - page content still uses the existing
 * component library.
 *
 * Phones and tablets (below lg, 1024px): a role that passes `mobileTabs`
 * gets the mobile mockups' shell instead of the sidebar - a top bar (brand,
 * bell, avatar -> "More") and a five-tab bar under the page
 * (MobileChrome.jsx). A role without tabs (Super Admin) keeps the sidebar,
 * which becomes an off-canvas drawer below md.
 */
export function AuthenticatedLayout({
  navItems = [],
  mobileTabs,
  title,
  subtitle,
  brand,
  accountSubtitle,
  // Grade 6+ students reach notifications from the sidebar instead (StudentLayout passes false).
  showNotificationBell = true,
  // Where the phone top bar's bell leads when there's no dropdown bell (students).
  notificationsPath,
  children,
}) {
  const { user } = useAuth();
  // Below lg, not md: at tablet-portrait widths (768-1023) a 16rem sidebar
  // leaves pages too narrow for their tables and filter rows, so tablets get
  // the tab bar too - the same split the K-5 shell (KidLayout) uses.
  const isCompact = useIsMobile(COMPACT_BREAKPOINT);
  const phoneShell = isCompact && mobileTabs?.length > 0;
  const { pathname } = useLocation();

  // Every date/currency formatted anywhere in the app (utils/date.js,
  // utils/format.js) reads the active timezone/locale rather than the
  // browser's own - set here from whichever signed-in user is viewing (and
  // by KidLayout, the K-5 student shell, which replaces this layout).
  useSyncUserLocale(user);

  return (
    <SidebarProvider>
      {!phoneShell && (
        <AppSidebar title={title} subtitle={subtitle} brand={brand} navItems={navItems} accountSubtitle={accountSubtitle} />
      )}

      <SidebarInset>
        {phoneShell ? (
          <MobileTopBar
            navItems={navItems}
            mobileTabs={mobileTabs}
            notificationsPath={showNotificationBell ? undefined : notificationsPath}
            accountSubtitle={accountSubtitle}
          />
        ) : (
          <header
            className="flex h-14 min-w-0 shrink-0 items-center gap-2 border-b px-3 sm:px-4"
            style={{
              background: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <SidebarTrigger>
              <LuPanelLeft aria-hidden="true" />
            </SidebarTrigger>
            <span className="min-w-0 truncate text-sm font-semibold">{title}</span>
            {showNotificationBell && (
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <NotificationBell />
              </div>
            )}
          </header>
        )}

        {/*
          The only scrolling region. min-w-0 lets wide tables scroll inside
          their own container rather than widening the page.

          ts-page (components/common/common.css) is the shared page frame -
          applied here rather than on each page's root so every page gets the
          same gap and reading width and a new page cannot forget it.
        */}
        <main className={`ui-shell__main min-w-0 flex-1 overflow-y-auto${phoneShell ? ' ui-shell__main--phone' : ''}`}>
          {/* A page that throws shows "This page ran into a problem" here, with
              the navigation still working; moving to another page clears it. */}
          <AppErrorBoundary inShell resetKey={pathname}>
            {children ?? <Outlet />}
          </AppErrorBoundary>
        </main>

        {phoneShell && <MobileTabBar items={mobileTabs} />}
      </SidebarInset>

      <Toast />
    </SidebarProvider>
  );
}

export default AuthenticatedLayout;
