import { createContext, useContext } from 'react';

/**
 * Sidebar context, kept separate from sidebar.jsx.
 *
 * A module that exports both components and plain functions breaks React fast
 * refresh, so the context and its hook live here. `useSidebar` is re-exported
 * from sidebar.jsx, so the documented import path still works:
 *
 *   import { useSidebar } from '@/components/ui/sidebar'
 */
export const SidebarContext = createContext(null);

/**
 * @returns {{
 *   state: 'expanded' | 'collapsed',
 *   open: boolean,
 *   setOpen: (open: boolean) => void,
 *   openMobile: boolean,
 *   setOpenMobile: (open: boolean) => void,
 *   isMobile: boolean,
 *   toggleSidebar: () => void,
 * }}
 */
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used inside a <SidebarProvider>');
  return context;
}
