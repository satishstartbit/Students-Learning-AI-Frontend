import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuBell,
  LuCalendarDays,
  LuCheck,
  LuChevronRight,
  LuClock3,
  LuInfo,
  LuSmile,
  LuTrophy,
} from 'react-icons/lu';
import { Alert, Button } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatTimeAgo, isTodayInTimezone } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import notificationService from '../../notifications/services/notification.service';
import { studentNotificationPath } from '../../notifications/studentNotificationPath';
import '../components/notifications/studentNotifications.css';

/**
 * /student/notifications (Grade 6+), built to the student notifications
 * mockup. The only place students see notifications - the header bell is
 * switched off for them (StudentLayout).
 *
 * Filters run on the server (`unreadOnly`, `category`), so "Deadlines" and
 * "Rewards" are exact, not just whatever happened to be on the first page.
 * Opening a notification marks it read and goes where it points
 * (studentNotificationPath).
 */

const FILTERS = [
  { key: 'all', label: 'All', query: {} },
  { key: 'unread', label: 'Unread', query: { unreadOnly: true } },
  { key: 'deadlines', label: 'Deadlines', query: { category: 'deadlines' } },
  { key: 'rewards', label: 'Rewards', query: { category: 'rewards' } },
];

const PAGE_SIZE = 20;
// The API caps one request at 100 rows - more than enough history to scroll.
const MAX_LIMIT = 100;

const CATEGORY_ICON = {
  deadlines: LuClock3,
  rewards: LuTrophy,
  plan: LuCalendarDays,
  checkin: LuSmile,
  info: LuInfo,
};

const EMPTY = {
  all: { title: 'No notifications yet', text: 'Updates about your work, reminders and rewards will show up here.' },
  unread: { title: 'You’re all caught up', text: 'Nothing new since you last looked.' },
  deadlines: { title: 'No deadline updates', text: 'New assignments and due-date reminders will show up here.' },
  rewards: { title: 'No rewards yet', text: 'Points you earn and rewards you unlock will show up here.' },
};

function NotificationRow({ notification, onOpen }) {
  const Icon = CATEGORY_ICON[notification.category] ?? LuInfo;
  const unread = !notification.read;

  return (
    <li>
      <button type="button" className="sn-row" data-unread={unread || undefined} onClick={() => onOpen(notification)}>
        <span className="sn-row__icon" data-category={notification.category ?? 'info'} aria-hidden="true">
          <Icon size={15} />
        </span>
        <span className="sn-row__text">
          <span className="sn-row__title">{notification.title}</span>
          {notification.message && <span className="sn-row__message">{notification.message}</span>}
        </span>
        <span className="sn-row__side">
          <span className="sn-row__time">{formatTimeAgo(notification.createdAt)}</span>
          {unread && (
            <>
              <span className="sn-row__dot" aria-hidden="true" />
              <span className="sr-only">Unread</span>
            </>
          )}
        </span>
      </button>
    </li>
  );
}

function Section({ title, items, onOpen }) {
  if (!items.length) return null;
  return (
    <section className="sn-section" aria-label={title}>
      <h2 className="sn-section__head">
        <span className="sn-section__icon" aria-hidden="true">
          <LuBell size={16} />
        </span>
        {title}
      </h2>
      <ul className="sn-list">
        {items.map((n) => (
          <NotificationRow key={n.id} notification={n} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [filterKey, setFilterKey] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  // Ids read on this visit - applied over the fetched list so a row un-tints instantly.
  const [readIds, setReadIds] = useState(() => new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const filter = FILTERS.find((f) => f.key === filterKey);
  const query = { page: 1, limit, ...filter.query };
  const list = useApi(notificationService.listNotifications, { immediate: true, args: [query] });
  const unread = useApi(notificationService.getUnreadCount, { immediate: true });

  const total = list.meta?.total ?? list.meta?.pagination?.total ?? 0;
  const notifications = useMemo(
    () => (list.data ?? []).map((n) => (readIds.has(n.id) ? { ...n, read: true } : n)),
    [list.data, readIds]
  );
  const today = notifications.filter((n) => isTodayInTimezone(n.createdAt));
  const earlier = notifications.filter((n) => !isTodayInTimezone(n.createdAt));
  // readIds only ever holds rows that were unread when opened, so this stays exact.
  const unreadCount = Math.max(0, (unread.data?.count ?? 0) - readIds.size);

  const chooseFilter = (key) => {
    setFilterKey(key);
    setLimit(PAGE_SIZE);
  };

  const handleOpen = async (notification) => {
    if (!notification.read) {
      setReadIds((prev) => new Set(prev).add(notification.id));
      notificationService.markNotificationRead(notification.id).catch(() => {
        // Not fatal - it will just show as unread again next visit.
      });
    }
    const path = studentNotificationPath(notification);
    if (path) navigate(path);
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllNotificationsRead();
      setReadIds(new Set());
      await Promise.all([list.run(query), unread.run()]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  };

  const loading = list.isLoading && !list.data;
  const empty = EMPTY[filterKey];

  return (
    <div className="sn-page td-page">
      <header className="sn-head">
        <div>
          <h1 className="sn-title">Notifications</h1>
          <p className="sn-subtitle">What&apos;s new, and what needs you.</p>
        </div>
        <button type="button" className="sn-markall" onClick={handleMarkAll} disabled={markingAll || unreadCount === 0}>
          Mark all as read <LuChevronRight size={13} aria-hidden="true" />
        </button>
      </header>

      <div className="sn-chips" role="group" aria-label="Filter notifications">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className="sn-chip" aria-pressed={filterKey === f.key} onClick={() => chooseFilter(f.key)}>
            {filterKey === f.key && <LuCheck size={13} aria-hidden="true" />}
            {f.label}
          </button>
        ))}
      </div>

      {list.error && !list.data ? (
        <Alert variant="error">
          {list.error.message}{' '}
          <Button variant="secondary" size="sm" onClick={() => list.run(query).catch(() => {})}>
            Try again
          </Button>
        </Alert>
      ) : loading ? (
        <section className="sn-section" aria-busy="true">
          <div className="sn-list">
            {[0, 1, 2].map((i) => (
              <div key={i} className="sn-skeleton" />
            ))}
          </div>
        </section>
      ) : notifications.length === 0 ? (
        <div className="sn-empty">
          <span className="sn-empty__icon" aria-hidden="true">
            <LuBell size={20} />
          </span>
          <p className="sn-empty__title">{empty.title}</p>
          <p className="sn-empty__text">{empty.text}</p>
        </div>
      ) : (
        <>
          <Section title="Today" items={today} onOpen={handleOpen} />
          <Section title="Earlier" items={earlier} onOpen={handleOpen} />
          {notifications.length < total && limit < MAX_LIMIT && (
            <Button
              className="sn-more"
              variant="secondary"
              size="sm"
              loading={list.isLoading}
              onClick={() => setLimit((l) => Math.min(l + PAGE_SIZE, MAX_LIMIT))}
            >
              Show older
            </Button>
          )}
        </>
      )}
    </div>
  );
}
