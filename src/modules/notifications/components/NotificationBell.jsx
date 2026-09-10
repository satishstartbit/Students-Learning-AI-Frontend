import { useNavigate } from 'react-router-dom';
import { LuBell } from 'react-icons/lu';
import { Badge, Dropdown, EmptyState, IconButton, Loader } from '../../../components/common';
import { formatRelative } from '../../../utils/date';
import { useAuth } from '../../../hooks/useAuth';
import useNotifications from '../hooks/useNotifications';

/** Where a notification's `relatedId` should navigate, per signed-in role. */
const ASSIGNMENT_DETAIL_PATH = {
  TEACHER: (id) => `/teacher/assignments/${id}`,
  STUDENT: (id) => `/student/assignments/${id}`,
};

/**
 * Bell icon + unread badge + dropdown panel, shared by every authenticated
 * role's header (see layouts/AuthenticatedLayout.jsx).
 */
export function NotificationBell() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications();

  const handleSelect = async (notification) => {
    if (!notification.read) await markRead(notification.id);

    if (notification.relatedType === 'assignment' && notification.relatedId) {
      const buildPath = ASSIGNMENT_DETAIL_PATH[role];
      if (buildPath) navigate(buildPath(notification.relatedId));
    }
  };

  return (
    <Dropdown
      align="end"
      trigger={
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <IconButton icon={<LuBell aria-hidden="true" />} label="Notifications" />
          {unreadCount > 0 && (
            <Badge
              variant="danger"
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 16,
                padding: '0 4px',
                fontSize: 10,
                lineHeight: '16px',
                textAlign: 'center',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </span>
      }
    >
      <li
        role="none"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 12px',
        }}
      >
        <strong style={{ fontSize: 13 }}>Notifications</strong>
        {unreadCount > 0 && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </li>

      {isLoading && notifications.length === 0 && (
        <li role="none" style={{ padding: 12 }}>
          <Loader message="Loading…" />
        </li>
      )}

      {!isLoading && notifications.length === 0 && (
        <li role="none" style={{ padding: 12 }}>
          <EmptyState icon="🔔" title="No notifications yet" description="You'll see updates here." />
        </li>
      )}

      {notifications.map((n) => (
        <li key={n.id} role="none">
          <button
            type="button"
            role="menuitem"
            className="ui-dropdown__item"
            style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 2, opacity: n.read ? 0.65 : 1 }}
            onClick={() => handleSelect(n)}
          >
            <span style={{ fontWeight: 600 }}>{n.title}</span>
            <span style={{ fontSize: 12 }}>{n.message}</span>
            <span className="ui-hint">{formatRelative(n.createdAt)}</span>
          </button>
        </li>
      ))}
    </Dropdown>
  );
}

export default NotificationBell;
