import { Link } from 'react-router-dom';
import { LuBell } from 'react-icons/lu';
import { Badge, IconButton } from '../../../components/common';
import useNotifications from '../hooks/useNotifications';

/**
 * The header bell for a role that reads notifications on its own page
 * (Teacher, Parent): the same bell and unread badge as NotificationBell, but
 * a link to `to` instead of a dropdown list. The badge polls the unread count
 * and drops as soon as the page marks something read.
 */
export function NotificationBellLink({ to }) {
  const { unreadCount } = useNotifications({ limit: 1 });
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <IconButton
        as={Link}
        to={to}
        icon={<LuBell aria-hidden="true" />}
        label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      />
      {unreadCount > 0 && (
        <Badge
          variant="danger"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 16,
            padding: '0 4px',
            fontSize: 10,
            lineHeight: '16px',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </span>
  );
}

export default NotificationBellLink;
