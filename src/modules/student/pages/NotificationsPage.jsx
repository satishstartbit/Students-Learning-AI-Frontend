import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, Button, EmptyState, Loader } from '../../../components/common';
import { formatRelative } from '../../../utils/date';
import useNotifications from '../../notifications/hooks/useNotifications';

/**
 * /student/notifications - the full list behind the header bell
 * (modules/notifications/components/NotificationBell.jsx), which only ever
 * shows the most recent few. Same data, same actions, just room to see it all.
 */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications({ limit: 50 });

  const handleSelect = async (notification) => {
    if (!notification.read) await markRead(notification.id);
    if (notification.relatedType === 'assignment' && notification.relatedId) {
      navigate(`/student/assignments/${notification.relatedId}`);
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates about your assignments, check-ins and rewards."
        actions={
          unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )
        }
      />

      {isLoading && notifications.length === 0 ? (
        <Loader message="Loading notifications…" />
      ) : notifications.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications yet" description="You'll see updates here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {notifications.map((n) => (
            <Card key={n.id} flat padded={false}>
              <button
                type="button"
                onClick={() => handleSelect(n)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  width: '100%',
                  textAlign: 'left',
                  padding: 'var(--spacing-md)',
                  border: 0,
                  background: 'none',
                  cursor: 'pointer',
                  opacity: n.read ? 0.65 : 1,
                }}
              >
                <span style={{ fontWeight: 600 }}>{n.title}</span>
                <span>{n.message}</span>
                <span className="ui-hint">{formatRelative(n.createdAt)}</span>
              </button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
