import { Outlet } from 'react-router-dom';
import { LuPanelLeft } from 'react-icons/lu';
import { Toast } from '../components/common';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';
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
  return (
    <SidebarProvider>
      <AppSidebar title={title} subtitle={subtitle} brand={brand} navItems={navItems} />

      <SidebarInset>
        <header
          className="flex h-14 shrink-0 items-center gap-2 border-b px-4"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <SidebarTrigger>
            <LuPanelLeft aria-hidden="true" />
          </SidebarTrigger>
          <span className="text-sm font-semibold">{title}</span>
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
