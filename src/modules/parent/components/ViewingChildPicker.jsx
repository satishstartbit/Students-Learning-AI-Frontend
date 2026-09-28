import { useEffect, useRef, useState } from 'react';
import { LuCheck, LuChevronDown } from 'react-icons/lu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../../../components/ui/sidebar';
import { formatName, getInitials } from '../../../utils/format';
import { useViewingChild } from '../hooks/useViewingChild';
import './viewingChild.css';

/**
 * Sidebar child picker - the tinted "VIEWING" card at the top of the parent
 * sidebar (the sidebar mockup). The whole card is the button: "VIEWING", then
 * avatar, name over grade, and a chevron that opens the list of children.
 *
 * Rendered inside the first nav section (ParentLayout `withExtra`), so it
 * shares that section's outlined box with Overview / Progress / Learning
 * Summary. The avatar is the button's FIRST child so the collapsed icon rail
 * still shows it; the grid puts the label above it visually.
 */
export default function ViewingChildPicker() {
  const { viewingChild, children, setViewingChildId, isLoading } = useViewingChild();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { state, isMobile } = useSidebar();
  const collapsed = state === 'collapsed' && !isMobile;

  // Close on outside click or Escape, matching the UserMenu pattern.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (isLoading || !children.length) return null;

  const name = viewingChild ? formatName(viewingChild) : '';
  const initials = getInitials(name) || '?';
  const grade = viewingChild?.grade ?? '';

  const canSwitch = children.length > 1;

  return (
    <SidebarMenu className="vc-picker">
      <SidebarMenuItem ref={containerRef} className="relative">
        <SidebarMenuButton
          size="lg"
          onClick={() => canSwitch && setOpen((v) => !v)}
          aria-haspopup={canSwitch ? 'listbox' : undefined}
          aria-expanded={canSwitch ? open : undefined}
          tooltip={name}
          className="vc-trigger"
        >
          {/* Avatar - the first child element so the collapsed rail keeps it. */}
          <span aria-hidden="true" className="vc-avatar">
            {initials}
          </span>

          {!collapsed && (
            <>
              <span className="vc-label">Viewing</span>
              <span className="vc-body">
                <span className="vc-name">{name}</span>
                {grade && <span className="vc-grade">{grade}</span>}
              </span>
              {canSwitch && (
                <LuChevronDown
                  aria-hidden="true"
                  className={`vc-chevron transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
              )}
            </>
          )}
        </SidebarMenuButton>

        {open && !collapsed && (
          <div role="listbox" aria-label="Choose a child" className="vc-dropdown">
            {children.map((child) => {
              const childName = formatName(child);
              const childInitials = getInitials(childName) || '?';
              const active = child.id === viewingChild?.id;
              return (
                <button
                  key={child.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className="vc-option"
                  onClick={() => {
                    setViewingChildId(child.id);
                    setOpen(false);
                  }}
                >
                  <span className="vc-avatar vc-avatar--sm" aria-hidden="true">
                    {childInitials}
                  </span>
                  <span className="vc-option__body">
                    <span className="vc-option__name">{childName}</span>
                    {child.grade && <span className="vc-option__grade">{child.grade}</span>}
                  </span>
                  {active && <LuCheck className="vc-option__check" size={14} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
