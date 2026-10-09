import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuBell,
  LuCalendarDays,
  LuCheck,
  LuChevronRight,
  LuClock3,
  LuInfo,
  LuSettings2,
  LuSmile,
  LuTrophy,
} from 'react-icons/lu';
import { Alert, Button } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from '../../../hooks/useToast';
import { formatTimeAgo, isTodayInTimezone } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { NOTIFICATIONS_CHANGED_EVENT, notificationPathFor } from '../notificationPath';
import notificationService from '../services/notification.service';
import NotificationSettingsModal from '../components/NotificationSettingsModal';
import '../components/notificationsPage.css';

/**
 * The notifications page - /student/notifications (Grade 6+),
 * /teacher/notifications and /parent/notifications - built to the student
 * notifications mockup. For these roles it is the only list of
 * notifications: their header bell is a link here, not a dropdown
 * (AuthenticatedLayout `notificationsPath`). Super Admin keeps the dropdown.
 *
 * Filters run on the server (`unreadOnly`, `category`), so "Deadlines" and
 * "Rewards" (students) are exact, not just whatever happened to be on the
 * first page. Opening a notification marks it read and goes where it points
 * for the reader's role (notificationPath.js); reading tells the bell's badge
 * to look again.
 */

const UNREAD = { key: 'unread', label: 'Unread', query: { unreadOnly: true } };
const ALL = { key: 'all', label: 'All', query: {} };
const FILTERS_BY_ROLE = {
  STUDENT: [ALL, UNREAD, { key: 'deadlines', label: 'Deadlines', query: { category: 'deadlines' } }, { key: 'rewards', label: 'Rewards', query: { category: 'rewards' } }],
  TEACHER: [ALL, UNREAD],
  PARENT: [ALL, UNREAD],
};

const EMPTY_ALL = {
  STUDENT: 'Updates about your work, reminders and rewards will show up here.',
  TEACHER: 'Updates about your students, their work and invitations will show up here.',
  PARENT: 'Updates about your children, their teachers and your subscription will show up here.',
};
const EMPTY = {
  unread: { title: 'You’re all caught up', text: 'Nothing new since you last looked.' },
  deadlines: { title: 'No deadline updates', text: 'New assignments and due-date reminders will show up here.' },
  rewards: { title: 'No rewards yet', text: 'Points you earn and rewards you unlock will show up here.' },
};

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

const announce = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const filters = FILTERS_BY_ROLE[role] ?? FILTERS_BY_ROLE.PARENT;
  const [filterKey, setFilterKey] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  // Ids read on this visit - applied over the fetched list so a row un-tints instantly.
  const [readIds, setReadIds] = useState(() => new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const filter = filters.find((f) => f.key === filterKey) ?? filters[0];
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
      notificationService
        .markNotificationRead(notification.id)
        .then(announce)
        .catch(() => {
          // Not fatal - it will just show as unread again next visit.
        });
    }
    const path = notificationPathFor(role, notification);
    if (path) navigate(path);
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllNotificationsRead();
      setReadIds(new Set());
      announce();
      await Promise.all([list.run(query), unread.run()]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  };

  const loading = list.isLoading && !list.data;
  const empty = filterKey === 'all' ? { title: 'No notifications yet', text: EMPTY_ALL[role] ?? EMPTY_ALL.PARENT } : EMPTY[filterKey];

  return (
    <div className="sn-page td-page">
      <header className="sn-head">
        <div>
          <h1 className="sn-title">Notifications</h1>
          <p className="sn-subtitle">What&apos;s new, and what needs you.</p>
        </div>
        <div className="sn-head__actions">
          {/* What they hear about, and how (in app / email / browser push). */}
          <button type="button" className="sn-settings-btn" onClick={() => setSettingsOpen(true)}>
            <LuSettings2 size={13} aria-hidden="true" /> Settings
          </button>
          <button type="button" className="sn-markall" onClick={handleMarkAll} disabled={markingAll || unreadCount === 0}>
            Mark all as read <LuChevronRight size={13} aria-hidden="true" />
          </button>
        </div>
      </header>
      <NotificationSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <div className="sn-chips" role="group" aria-label="Filter notifications">
        {filters.map((f) => (
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
