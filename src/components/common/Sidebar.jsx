import { NavLink } from 'react-router-dom';

/**
 * Navigation rail.
 *
 * Items are supplied by each role's layout - this component holds no
 * role logic and is never duplicated per role.
 *
 * @param items - [{ to, label, icon, end }] or [{ group, items: [...] }]
 */
function SidebarLink({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `ui-sidebar__link ${isActive ? 'ui-sidebar__link--active' : ''}`.trim()
      }
      title={collapsed ? item.label : undefined}
    >
      {item.icon && (
        <span className="ui-sidebar__icon" aria-hidden="true">
          {item.icon}
        </span>
      )}
      {!collapsed && <span>{item.label}</span>}
      {collapsed && <span className="ui-sr-only">{item.label}</span>}
    </NavLink>
  );
}

export function Sidebar({ items = [], collapsed = false, label = 'Main', footer, className = '' }) {
  return (
    <nav
      className={`ui-sidebar ${collapsed ? 'ui-sidebar--collapsed' : ''} ${className}`.trim()}
      aria-label={label}
    >
      {items.map((entry) =>
        entry.group ? (
          <div key={entry.group}>
            {!collapsed && <div className="ui-sidebar__group-label">{entry.group}</div>}
            {entry.items.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>
        ) : (
          <SidebarLink key={entry.to} item={entry} collapsed={collapsed} />
        )
      )}

      {footer && <div style={{ marginTop: 'auto' }}>{footer}</div>}
    </nav>
  );
}

export default Sidebar;
