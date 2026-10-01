import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuCreditCard, LuInfo, LuListChecks, LuSmile, LuTimer, LuTriangleAlert, LuTrophy } from 'react-icons/lu';
import { Button, EmptyState, ErrorState, Loader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatDate, formatDateKey, formatLongDate, formatTimeAgo, getHourInTimezone } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useMoodLookup } from '../../checkIn/hooks/useMoodLookup';
import CheckInStrip from '../../progress/components/CheckInStrip';
import MoodIcon from '../../progress/components/MoodIcon';
import { TodayCards } from '../../progress/components/StudentProgressDetail';
import { StudentAvatar } from '../../teacher/components/students/StudentBits';
import { checkInWhen, fullName, partOfDayPhrase } from '../../teacher/components/students/studentFormat';
import { activityLine, alertLine, attentionLine, lowerFirst } from '../components/dashboard/overviewText';
import { useViewingChild } from '../hooks/useViewingChild';
import parentService from '../services/parent.service';
import '../../teacher/components/students/teacherStudents.css';
import '../../teacher/components/dashboard/teacherDashboard.css';
import '../components/dashboard/parentDashboard.css';

/*
 * The parent's Overview (/parent), for the child picked in the sidebar's
 * VIEWING card (the "Good evening, Naven" mockup). Switching child there
 * switches everything here.
 *
 *   greeting · "Here's Sanjay's day so far."
 *   plan notice (only when the plan needs the parent)
 *   wellbeing alert (the latest one this parent hasn't marked seen)
 *   Today's check-in · Tasks today · Focus time today  (the Progress page's cards)
 *   Coming up            | Needs your attention
 *   Check-ins this week  | Recent activity
 *
 * One request, GET /parent/children/:id/overview. Its "today" is the
 * child's own day; the greeting and date are the parent's. With no children
 * yet the page asks for the first one (GET /parent/dashboard for the name
 * and plan notice).
 */

const PROGRESS = '/parent/progress';

function greeting() {
  const hour = getHourInTimezone();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "Tuesday, September 22" - the parent's own today. */
const todayText = () => formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: undefined });

/** "Due today" / "Due tomorrow" / "Due Fri, Sep 25" - due dates are calendar days, never shifted. */
function dueLabel(dueDate, daysLeft) {
  if (!dueDate) return 'No due date';
  if (daysLeft === 0) return 'Due today';
  if (daysLeft === 1) return 'Due tomorrow';
  return `Due ${formatDateKey(dueDate, { weekday: 'short', year: undefined })}`;
}

const weekdayName = (key) => formatDateKey(key, { weekday: 'long', year: undefined, month: undefined, day: undefined });

/** The formatters overviewText.js words its lines with - all in the parent's locale. */
const LINE_FORMAT = {
  due: dueLabel,
  day: (key) => formatDateKey(key, { weekday: 'short', year: undefined }),
  sent: (at) => formatDate(at, { year: undefined }),
  weekday: weekdayName,
  weekdayPlural: (key) => `${weekdayName(key)}s`,
  ago: (at) => formatTimeAgo(at),
  when: (at) => checkInWhen(at),
};

const STAGE_PILL = {
  not_started: { label: 'Not started', tone: '' },
  in_progress: { label: 'In progress', tone: 'accent' },
  returned: { label: 'Sent back to fix', tone: 'warning' },
};

const ACTIVITY_ICON = { submitted: LuListChecks, focus: LuTimer, checkin: LuSmile, reward: LuTrophy };

function Panel({ title, link, linkLabel, children }) {
  return (
    <section className="td-panel">
      <div className="td-panel__head">
        <h2 className="td-panel__title">{title}</h2>
        {link && (
          <Link to={link} className="td-panel__link">
            {linkLabel} <LuArrowRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Greeting({ parent, line }) {
  return (
    <header className="td-head">
      <div>
        <h1 className="td-greeting">
          {greeting()}, {parent?.firstName ?? 'there'}
        </h1>
        <p className="td-subtitle">
          {todayText()} · {line}
        </p>
      </div>
    </header>
  );
}

/** The family plan, when it needs the parent (payment failed, ending) or is on a trial. */
function AccountNotice({ account }) {
  if (!account?.plan) return null;
  const plan = account.plan.name ? `${account.plan.name} plan` : 'plan';

  let notice = null;
  if (account.notice === 'past_due') {
    notice = {
      tone: 'danger',
      icon: LuCreditCard,
      title: "We couldn't take your last payment",
      text: 'Your family keeps access while we try again. Update your card so nothing is interrupted.',
      action: 'Update payment',
    };
  } else if (account.notice === 'ending') {
    notice = {
      tone: 'warning',
      icon: LuCreditCard,
      title: account.currentPeriodEnd ? `Your ${plan} ends on ${formatLongDate(account.currentPeriodEnd)}` : `Your ${plan} is ending`,
      text: "Renewal is turned off. Turn it back on to keep your children's access.",
      action: 'Manage plan',
    };
  } else if (account.status === 'trialing' && account.trialEndAt) {
    notice = {
      tone: 'info',
      icon: LuInfo,
      title: `Your free trial ends on ${formatLongDate(account.trialEndAt)}`,
      text: `Your ${plan} carries on after that - nothing to do unless you want to change it.`,
      action: 'View plan',
    };
  }
  if (!notice) return null;

  const Icon = notice.icon;
  return (
    <section className={`pd-notice pd-notice--${notice.tone}`} role={notice.tone === 'info' ? 'status' : 'alert'}>
      <Icon className="pd-notice__icon" size={18} aria-hidden="true" />
      <div className="pd-notice__body">
        <p className="pd-notice__title">{notice.title}</p>
        <p className="pd-notice__text">{notice.text}</p>
      </div>
      <Button as={Link} to="/parent/subscription" variant="secondary" size="sm">
        {notice.action}
      </Button>
    </section>
  );
}

/** The child's latest check-in alert this parent hasn't marked seen. */
function WellbeingAlert({ alert, child, onSeen }) {
  const { moodFor } = useMoodLookup();
  const [busy, setBusy] = useState(false);
  const first = child.firstName ?? fullName(child);

  let note = null;
  if (child.teachers > 0) note = `${first}’s teachers have been told too`;
  else if (alert.parentEmailStatus === 'sent') note = 'We emailed you about this too';

  const text = alertLine(alert, {
    weekday: weekdayName,
    single: () => `Felt ${lowerFirst(alert.moodName)} at ${partOfDayPhrase(alert.createdAt)} check-in · ${checkInWhen(alert.createdAt)}`,
  });

  const markSeen = async () => {
    setBusy(true);
    try {
      await parentService.markAlertSeen(child.id, alert.id);
      toast.success('Marked as seen');
      await onSeen();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="td-alerts" aria-labelledby="pd-alert-title">
      <div className="td-alerts__head">
        <LuTriangleAlert size={18} aria-hidden="true" style={{ color: 'var(--color-danger-fg)' }} />
        <h2 id="pd-alert-title" className="td-alerts__title">
          Wellbeing alert
        </h2>
        {note && <span className="td-alerts__note">{note}</span>}
      </div>
      <div className="td-alert">
        <StudentAvatar student={child} />
        <MoodIcon mood={moodFor(alert.mood)} size={30} />
        <div className="td-alert__body">
          <div className="td-alert__name">{fullName(child)}</div>
          <div className="td-alert__text">{text}</div>
        </div>
        <div className="pd-alert__actions">
          <Button variant="ghost" size="sm" onClick={markSeen} loading={busy}>
            Mark as seen
          </Button>
          <Button as={Link} to={PROGRESS} variant="secondary" size="sm">
            See check-ins
          </Button>
        </div>
      </div>
    </section>
  );
}

function ComingUp({ items }) {
  return (
    <Panel title="Coming up" link={PROGRESS} linkLabel="See progress">
      {items.length ? (
        <ul className="td-list">
          {items.map((item) => {
            const pill = STAGE_PILL[item.stage] ?? STAGE_PILL.not_started;
            return (
              <li key={item.key} className="td-row">
                <div className="td-row__body">
                  <Link to={PROGRESS} className="td-row__title">
                    {item.title}
                  </Link>
                  <div className="td-meta">{[item.subject, dueLabel(item.dueDate, item.daysLeft)].filter(Boolean).join(' · ')}</div>
                </div>
                <span className={`ts-pill ${pill.tone ? `ts-pill--${pill.tone}` : ''}`.trim()}>{pill.label}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="td-empty">Nothing due in the next two weeks.</p>
      )}
    </Panel>
  );
}

function NeedsAttention({ items, firstName }) {
  const fmt = { ...LINE_FORMAT, firstName };
  return (
    <Panel title="Needs your attention">
      {items.length ? (
        <ul className="td-list">
          {items.map((item) => {
            const line = attentionLine(item, fmt);
            return (
              <li key={item.key} className="td-row">
                <div className="td-row__body">
                  <Link to={line.to} className="td-row__title">
                    {line.title}
                  </Link>
                  {line.meta && <div className="td-meta">{line.meta}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="td-empty">Nothing needs you right now.</p>
      )}
    </Panel>
  );
}

function RecentActivity({ items, firstName }) {
  return (
    <Panel title="Recent activity">
      {items.length ? (
        <ul className="td-list">
          {items.map((item, index) => {
            const Icon = ACTIVITY_ICON[item.type] ?? LuListChecks;
            const line = activityLine(item, LINE_FORMAT);
            return (
              <li key={`${item.type}-${item.at}-${index}`} className="td-row">
                <span className="pd-activity__icon" aria-hidden="true">
                  <Icon size={16} />
                </span>
                <div className="td-row__body">
                  <div className="td-row__title">{line.title}</div>
                  <div className="td-meta">{line.meta}</div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="td-empty">Nothing from {firstName} yet.</p>
      )}
    </Panel>
  );
}

function Overview({ data, onReload }) {
  const { parent, account, child, progress, alert, comingUp = [], attention = [], recentActivity = [] } = data;
  const first = child.firstName ?? fullName(child);
  const line = child.archived
    ? `${first}’s account is archived. Everything saved is still here.`
    : `Here’s ${first}’s day so far.`;

  return (
    <div className="td-page pd-page">
      <Greeting parent={parent} line={line} />

      <AccountNotice account={account} />

      {alert && <WellbeingAlert alert={alert} child={child} onSeen={onReload} />}

      {progress && <TodayCards progress={progress} />}

      <div className="pd-cols">
        <div className="pd-col">
          <ComingUp items={comingUp} />
          <CheckInStrip
            className="td-panel pd-checkins"
            titleAs="h2"
            title="Check-ins this week"
            lead="A dashed circle means no check-in that day."
            days={7}
            faceSize={34}
            history={progress?.checkInHistory ?? []}
            todayKey={progress?.today?.date ?? data.today}
            name={first}
          />
        </div>
        <div className="pd-col">
          <NeedsAttention items={attention} firstName={first} />
          <RecentActivity items={recentActivity} firstName={first} />
        </div>
      </div>
    </div>
  );
}

/** One child's Overview. Keyed by child, so switching child starts clean. */
function ChildOverview({ childId }) {
  const { data, error, run } = useApi(parentService.getChildOverview);
  const load = useCallback(() => run(childId).catch(() => {}), [run, childId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) return <ErrorState error={error} onRetry={load} />;
  if (!data) return <Loader message="Loading your overview…" />;
  return <Overview data={data} onReload={load} />;
}

/** No children yet: the greeting, any plan notice, and a way to add the first one. */
function NoChildren() {
  const { data, error, run } = useApi(parentService.getDashboard);
  const load = useCallback(() => run().catch(() => {}), [run]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) return <ErrorState error={error} onRetry={load} />;
  if (!data) return <Loader message="Loading your overview…" />;

  return (
    <div className="td-page pd-page">
      <Greeting parent={data.parent} line="Add a child to see their day here." />
      <AccountNotice account={data.account} />
      <EmptyState
        icon="👨‍👩‍👧"
        title="Add your first child"
        description="Once a child is on your account, their check-ins, work and focus time show up here every day."
        action={
          <Button as={Link} to="/parent/children">
            Go to My Children
          </Button>
        }
      />
    </div>
  );
}

/** The parent's Overview (/parent) - the sidebar's child, today. */
export default function ParentDashboardPage() {
  const { viewingChild, children, isLoading } = useViewingChild();

  if (isLoading) return <Loader message="Loading your overview…" />;
  if (!children.length) return <NoChildren />;
  if (!viewingChild) return <Loader message="Loading your overview…" />;
  return <ChildOverview key={viewingChild.id} childId={viewingChild.id} />;
}
