import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LuBell,
  LuChevronRight,
  LuChevronsUpDown,
  LuLogOut,
  LuUser,
} from 'react-icons/lu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '../components/ui/sidebar';
import { Tooltip } from '../components/ui/tooltip';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../utils/constants';
import { formatName, getInitials } from '../utils/format';

/**
 * The application sidebar.
 *
 * Navigation is supplied by each role's layout, so this holds no role logic
 * and is never duplicated per role. Two entry shapes:
 *
 *   { to, label, icon, end }              a link
 *   { label, icon, items: [...] }         a collapsible parent with a submenu
 *
 * Optionally wrapped in { group, items } to render a labelled section.
 * `icon` is a component (from react-icons), not a string.
 */

/** Does this path match the current location? Mirrors NavLink's own rule. */
function useIsPathActive() {
  const { pathname } = useLocation();

  return (to, end) => {
    if (!to) return false;
    return end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  };
}

/**
 * A single link, rendered as either a top-level or a sub-menu button.
 *
 * The icon must be the FIRST child: the collapsed rail hides everything after
 * it, so anything before the icon would be shown instead of the icon.
 */
function NavLeaf({ item, Button = SidebarMenuButton, isActive }) {
  const Icon = item.icon;
  const { state, isMobile } = useSidebar();

  // Only worth a tooltip once the label is hidden.
  const collapsed = state === 'collapsed' && !isMobile;

  return (
    <Tooltip label={item.label} enabled={collapsed}>
      <Button as={NavLink} to={item.to} end={item.end} isActive={isActive} tooltip={item.label}>
        {Icon ? (
          <Icon aria-hidden="true" />
        ) : (
          <span className="size-4 shrink-0" aria-hidden="true" />
        )}
        <span className="truncate">{item.label}</span>
      </Button>
    </Tooltip>
  );
}

/**
 * A parent whose children collapse.
 *
 * Starts expanded when one of its children is the current route, so a deep
 * link never lands on a page whose nav entry is hidden.
 */
function NavCollapsible({ entry, isPathActive }) {
  const hasActiveChild = entry.items.some((child) => isPathActive(child.to, child.end));
  const Icon = entry.icon;
  const { state, isMobile, setOpen } = useSidebar();
  const collapsed = state === 'collapsed' && !isMobile;

  // `setOpen` here would shadow the sidebar's own setter, so it is named apart.
  const [open, setLocalOpen] = useState(hasActiveChild);
  const [wasActive, setWasActive] = useState(hasActiveChild);

  /*
   * Expand when navigation moves into this section, while still letting the
   * user collapse it by hand.
   *
   * Adjusted during render rather than in an effect - React's documented
   * pattern for state derived from changing props. An effect would render
   * once with the section shut, then again to open it.
   */
  if (hasActiveChild !== wasActive) {
    setWasActive(hasActiveChild);
    if (hasActiveChild) setLocalOpen(true);
  }

  /*
   * On the collapsed rail the submenu is hidden, so this button would do
   * nothing visible. Clicking it expands the sidebar instead, which then
   * reveals the section.
   */
  const handleToggle = () => {
    if (collapsed) {
      setOpen(true);
      setLocalOpen(true);
      return;
    }
    setLocalOpen((v) => !v);
  };

  return (
    <SidebarMenuItem>
      <Tooltip label={entry.label} enabled={collapsed}>
        <SidebarMenuButton
          onClick={handleToggle}
          aria-expanded={open}
          isActive={hasActiveChild && (!open || collapsed)}
          tooltip={entry.label}
        >
          {Icon && <Icon aria-hidden="true" />}
          <span className="truncate">{entry.label}</span>
          <LuChevronRight
            aria-hidden="true"
            className={`ml-auto shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
        </SidebarMenuButton>
      </Tooltip>

      {open && !collapsed && (
        <SidebarMenuSub>
          {entry.items.map((child) => (
            <SidebarMenuSubItem key={child.to}>
              <NavLeaf
                item={child}
                Button={SidebarMenuSubButton}
                isActive={isPathActive(child.to, child.end)}
              />
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

function NavEntry({ entry, isPathActive }) {
  if (Array.isArray(entry.items)) {
    return <NavCollapsible entry={entry} isPathActive={isPathActive} />;
  }

  return (
    <SidebarMenuItem>
      <NavLeaf item={entry} isActive={isPathActive(entry.to, entry.end)} />
    </SidebarMenuItem>
  );
}

/**
 * The account tile in the footer, with its menu.
 *
 * Built here rather than reusing the shared Dropdown component, which is
 * styled by the older CSS system and would not match the sidebar.
 */
function UserMenu() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const name = formatName(user);
  const initials = getInitials(name) || '?';

  const handleSignOut = () => {
    setOpen(false);
    signOut();
    navigate('/login', { replace: true });
  };

  /** size-6 so it still fits inside the 32px button on the collapsed rail. */
  const avatar = (
    <span
      aria-hidden="true"
      className="bg-sidebar-accent text-sidebar-accent-foreground flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold"
    >
      {initials}
    </span>
  );

  const menuItem =
    'flex w-full cursor-pointer appearance-none items-center gap-2 rounded-[var(--radius-sm)] border-0 bg-transparent px-2 py-1.5 text-left text-sm hover:bg-[color:var(--color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <SidebarMenuItem ref={containerRef} className="relative">
      <SidebarMenuButton
        size="lg"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        tooltip={name}
      >
        {avatar}
        <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
          <span className="truncate text-sm font-semibold">{name}</span>
          <span className="truncate text-xs opacity-70">{user?.email ?? ROLE_LABELS[role]}</span>
        </span>
        <LuChevronsUpDown aria-hidden="true" className="ml-auto shrink-0 opacity-70" />
      </SidebarMenuButton>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          // Opens upward: the tile sits at the bottom of the sidebar.
          className="absolute bottom-full left-0 z-50 mb-2 w-60 overflow-hidden rounded-[var(--radius-md)] border p-1 shadow-lg"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
            color: 'var(--color-text-primary)',
          }}
        >
          <div
            className="flex items-center gap-2 border-b px-2 py-2"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {avatar}
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold">{name}</span>
              <span className="truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {user?.email}
              </span>
            </span>
          </div>

          <div className="py-1">
            <button type="button" role="menuitem" className={menuItem} disabled>
              <LuUser aria-hidden="true" />
              <span>Account</span>
            </button>
            <button type="button" role="menuitem" className={menuItem} disabled>
              <LuBell aria-hidden="true" />
              <span>Notifications</span>
            </button>
          </div>

          <div className="border-t pt-1" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className={menuItem}
              style={{ color: 'var(--color-error)' }}
            >
              <LuLogOut aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </SidebarMenuItem>
  );
}

export default function AppSidebar({
  title = 'Executive Functioning',
  subtitle,
  brand = 'EF',
  navItems = [],
}) {
  const isPathActive = useIsPathActive();

  // Accepts both a flat list and { group, items } sections.
  const sections = navItems.some((entry) => entry.group)
    ? navItems
    : [{ group: null, items: navItems }];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton as={NavLink} to="/" size="lg" tooltip={title}>
              <span
                aria-hidden="true"
                className="bg-sidebar-primary text-sidebar-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
              >
                {brand}
              </span>
              <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
                <span className="truncate text-sm font-semibold">{title}</span>
                {subtitle && <span className="truncate text-xs opacity-70">{subtitle}</span>}
              </span>
              <LuChevronsUpDown aria-hidden="true" className="ml-auto shrink-0 opacity-70" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section, index) => (
          <SidebarGroup key={section.group ?? index}>
            {section.group && <SidebarGroupLabel>{section.group}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((entry) => (
                  <NavEntry
                    key={entry.to ?? entry.label}
                    entry={entry}
                    isPathActive={isPathActive}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <UserMenu />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
