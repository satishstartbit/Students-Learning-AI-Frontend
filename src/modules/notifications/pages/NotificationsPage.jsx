import { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { Alert, Button, Pagination } from '../../../components/common';
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
 * /teacher/notifications, /parent/notifications and (2026-10-20)
 * /admin/notifications - built to the student notifications mockup. For
 * these roles it is the only list of notifications: their header bell is a
 * link here, not a dropdown (AuthenticatedLayout `notificationsPath`); Super
 * Admin has no bell, only the sidebar item with the unread count.
 *
 * Filters run on the server (`unreadOnly`, `category`), so "Deadlines" and
 * "Rewards" (students) are exact, not just whatever happened to be on the
 * first page. Opening a notification marks it read and goes where it points
 * for the reader's role (notificationPath.js); reading tells the bell's badge
 * to look again.
 *
 * Paged on the server, 20 a page (the shared Pagination, as on Notes). The
 * filter and page live in the address (?filter=unread&page=2), so coming back
 * from a notification lands on the same page.
 */

const UNREAD = { key: 'unread', label: 'Unread', query: { unreadOnly: true } };
const ALL = { key: 'all', label: 'All', query: {} };
const FILTERS_BY_ROLE = {
  STUDENT: [ALL, UNREAD, { key: 'deadlines', label: 'Deadlines', query: { category: 'deadlines' } }, { key: 'rewards', label: 'Rewards', query: { category: 'rewards' } }],
  TEACHER: [ALL, UNREAD],
  PARENT: [ALL, UNREAD],
  SUPER_ADMIN: [ALL, UNREAD],
};

const EMPTY_ALL = {
  STUDENT: 'Updates about your work, reminders and rewards will show up here.',
  TEACHER: 'Updates about your students, their work and invitations will show up here.',
  PARENT: 'Updates about your children, their teachers and your subscription will show up here.',
  SUPER_ADMIN: 'Parents’ teacher requests and other things that need you will show up here.',
};

// Roles with notification settings (the backend's per-role catalog); Super Admin has none.
const HAS_SETTINGS = new Set(['STUDENT', 'TEACHER', 'PARENT']);
const EMPTY = {
  unread: { title: 'You’re all caught up', text: 'Nothing new since you last looked.' },
  deadlines: { title: 'No deadline updates', text: 'New assignments and due-date reminders will show up here.' },
  rewards: { title: 'No rewards yet', text: 'Points you earn and rewards you unlock will show up here.' },
};

const PAGE_SIZE = 20;

/** ?page= as a whole number from 1; anything else is page 1. */
const pageFrom = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 1 ? n : 1;
};

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
  const [params, setParams] = useSearchParams();
  const topRef = useRef(null);
  // Ids read on this visit - applied over the fetched list so a row un-tints instantly.
  const [readIds, setReadIds] = useState(() => new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const filter = filters.find((f) => f.key === params.get('filter')) ?? filters[0];
  const filterKey = filter.key;
  const page = pageFrom(params.get('page'));
  const query = { page, limit: PAGE_SIZE, ...filter.query };
  const list = useApi(notificationService.listNotifications, { immediate: true, args: [query] });
  const unread = useApi(notificationService.getUnreadCount, { immediate: true });

  const meta = list.meta ?? {};
  const total = meta.total ?? meta.pagination?.total ?? 0;
  const totalPages = meta.totalPages ?? Math.ceil(total / PAGE_SIZE);
  const notifications = useMemo(
    () => (list.data ?? []).map((n) => (readIds.has(n.id) ? { ...n, read: true } : n)),
    [list.data, readIds]
  );
  const today = notifications.filter((n) => isTodayInTimezone(n.createdAt));
  const earlier = notifications.filter((n) => !isTodayInTimezone(n.createdAt));
  // readIds only ever holds rows that were unread when opened, so this stays exact.
  const unreadCount = Math.max(0, (unread.data?.count ?? 0) - readIds.size);

  /** Filter and page in the address; page 1 and "All" are left out. */
  const show = (key, nextPage = 1) => {
    const next = new URLSearchParams(params);
    if (key === 'all') next.delete('filter');
    else next.set('filter', key);
    if (nextPage > 1) next.set('page', String(nextPage));
    else next.delete('page');
    setParams(next, { replace: true });
  };
  const chooseFilter = (key) => show(key, 1);
  const goToPage = (next) => {
    show(filterKey, Math.min(Math.max(1, next), Math.max(1, totalPages)));
    topRef.current?.scrollIntoView({ block: 'start' });
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
      // On "Unread" every page just emptied: back to the first (the address change reloads it).
      if (filterKey === 'unread' && page > 1) {
        show(filterKey, 1);
        await unread.run();
      } else {
        await Promise.all([list.run(query), unread.run()]);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  };

  const loading = list.isLoading && !list.data;
  const empty = filterKey === 'all' ? { title: 'No notifications yet', text: EMPTY_ALL[role] ?? EMPTY_ALL.PARENT } : EMPTY[filterKey];

  return (
    <div className="sn-page td-page" ref={topRef}>
      <header className="sn-head">
        <div>
          <h1 className="sn-title">Notifications</h1>
          <p className="sn-subtitle">What&apos;s new, and what needs you.</p>
        </div>
        <div className="sn-head__actions">
          {/* What they hear about, and how (in app / email / browser push). */}
          {HAS_SETTINGS.has(role) && (
            <button type="button" className="sn-settings-btn" onClick={() => setSettingsOpen(true)}>
              <LuSettings2 size={13} aria-hidden="true" /> Settings
            </button>
          )}
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
      ) : notifications.length === 0 && page > 1 && total > 0 ? (
        // A page that no longer exists (fewer notifications than when it was linked).
        <div className="sn-empty">
          <p className="sn-empty__title">Nothing on this page</p>
          <Button variant="secondary" size="sm" onClick={() => goToPage(1)}>
            Go to the first page
          </Button>
        </div>
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
          <div aria-busy={list.isLoading || undefined}>
            <Section title="Today" items={today} onOpen={handleOpen} />
            <Section title="Earlier" items={earlier} onOpen={handleOpen} />
          </div>
          <Pagination
            className="sn-pagination"
            page={page}
            totalPages={totalPages}
            total={total}
            from={(page - 1) * PAGE_SIZE + 1}
            to={(page - 1) * PAGE_SIZE + notifications.length}
            onPageChange={goToPage}
          />
        </>
      )}
    </div>
  );
}
