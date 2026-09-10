import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { LuPanelLeft } from 'react-icons/lu';
import { Toast } from '../components/common';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';
import { useAuth } from '../hooks/useAuth';
import { setActiveTimezone, setActiveLocale } from '../utils/locale';
import NotificationBell from '../modules/notifications/components/NotificationBell';
import AppSidebar from './AppSidebar';

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
 */
export function AuthenticatedLayout({ navItems = [], title, subtitle, brand, children }) {
  const { user } = useAuth();

  // Every date/currency formatted anywhere in the app (utils/date.js,
  // utils/format.js) reads the active timezone/locale rather than the
  // browser's own - this is the one place that active value is set, from
  // whichever signed-in user is viewing. Runs for every authenticated role
  // since this layout wraps all of them.
  useEffect(() => {
    setActiveTimezone(user?.timezone);
    setActiveLocale(user?.locale);
  }, [user?.timezone, user?.locale]);

  return (
    <SidebarProvider>
      <AppSidebar title={title} subtitle={subtitle} brand={brand} navItems={navItems} />

      <SidebarInset>
        <header
          className="flex h-14 min-w-0 shrink-0 items-center gap-2 border-b px-3 sm:px-4"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <SidebarTrigger>
            <LuPanelLeft aria-hidden="true" />
          </SidebarTrigger>
          <span className="min-w-0 truncate text-sm font-semibold">{title}</span>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        {/*
          The only scrolling region. min-w-0 lets wide tables scroll inside
          their own container rather than widening the page.
        */}
        <main className="ui-shell__main min-w-0 flex-1 overflow-y-auto">
          {children ?? <Outlet />}
        </main>
      </SidebarInset>

      <Toast />
    </SidebarProvider>
  );
}

export default AuthenticatedLayout;
