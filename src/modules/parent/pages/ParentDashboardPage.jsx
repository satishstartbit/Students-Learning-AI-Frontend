import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LuArrowRight,
  LuChartLine,
  LuClipboardCheck,
  LuCreditCard,
  LuInfo,
  LuListChecks,
  LuRotateCcw,
  LuSmile,
  LuTimer,
  LuTriangleAlert,
  LuTrophy,
} from 'react-icons/lu';
import { Button, EmptyState, ErrorState, Loader, Toast } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatDate, formatDateKey, formatLongDate, formatTime, formatTimeAgo, getHourInTimezone } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { MoodFace, StudentAvatar } from '../../teacher/components/students/StudentBits';
import { checkInWhen, focusLabel, fullName, partOfDayPhrase } from '../../teacher/components/students/studentFormat';
import parentService from '../services/parent.service';
import '../../teacher/components/students/teacherStudents.css';
import '../../teacher/components/dashboard/teacherDashboard.css';
import '../components/dashboard/parentDashboard.css';

/*
 * The parent's Overview (/parent). Same page frame, stat cards, alert panel
 * and panels as the Teacher dashboard (td- classes), with the parent's own
 * content: each child today, the work coming up, what needs the parent, what
 * teachers marked and what the children did. Everything comes from
 * GET /parent/dashboard; "today" for a child is that child's own day.
 */

const NUMBER_WORDS = ['no', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const lower = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const progressLink = (childId) => `/parent/progress?childId=${childId}`;

function greeting() {
  const hour = getHourInTimezone();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "Thursday, September 24 · Two things need you today." */
function subtitle(count) {
  const date = formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: undefined });
  if (!count) return `${date} · Nothing needs you right now.`;
  const word = count <= 10 ? NUMBER_WORDS[count] : String(count);
  return `${date} · ${word} thing${count === 1 ? '' : 's'} need${count === 1 ? 's' : ''} you today.`;
}

/** "Due today" / "Due tomorrow" / "Due Friday" / "Due Oct 8", from the child's own days-left count. */
function dueLabel(dueDate, daysLeft) {
  if (!dueDate) return 'No due date';
  if (daysLeft === 0) return 'Due today';
  if (daysLeft === 1) return 'Due tomorrow';
  if (daysLeft > 1 && daysLeft < 7) {
    return `Due ${formatDateKey(dueDate, { weekday: 'long', month: undefined, day: undefined, year: undefined })}`;
  }
  return `Due ${formatDateKey(dueDate, { year: undefined })}`;
}

/** Focus time, or "Under 1m" when there were sessions too short to count a minute. */
const focusValue = (minutes, sessions) => (!Number(minutes) && sessions ? 'Under 1m' : focusLabel(minutes));

/** "Harsh and Sam" / "Harsh, Sam and Maya". */
function listNames(names) {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

const STAGE_PILL = {
  not_started: { label: 'Not started', tone: '' },
  in_progress: { label: 'In progress', tone: 'accent' },
  returned: { label: 'Sent back to fix', tone: 'warning' },
};

function Panel({ title, link, linkLabel, children, className = '' }) {
  return (
    <section className={`td-panel ${className}`.trim()}>
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

function StatCard({ to, label, value, note, tone }) {
  return (
    <Link to={to} className="td-stat pd-stat">
      <p className="td-stat__label">{label}</p>
      <p className="td-stat__value">{value}</p>
      <p className={`td-stat__note ${tone ? `td-stat__note--${tone}` : ''}`.trim()}>{note}</p>
    </Link>
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

function ChildCard({ child }) {
  const { tasks, focus } = child;
  const percent = tasks.total ? Math.round((tasks.handedIn / tasks.total) * 100) : 0;

  let todayText = 'Not checked in yet today';
  if (child.checkIn) todayText = `Checked in feeling ${lower(child.checkIn.moodName)} · ${formatTime(child.checkIn.at)}`;
  else if (child.state === 'invited') todayText = 'No check-ins yet';

  let nextText = 'Nothing due soon';
  if (child.nextDue) nextText = `${child.nextDue.title} · ${dueLabel(child.nextDue.dueDate, child.nextDue.daysLeft)}`;
  else if (tasks.open) nextText = `${plural(tasks.open, 'open task')}, no due date`;

  return (
    <li className="pd-kid">
      <div className="pd-kid__head">
        <StudentAvatar student={child} size="lg" />
        <div className="pd-kid__who">
          <Link to={progressLink(child.id)} className="pd-kid__name">
            {fullName(child)}
          </Link>
          <span className="td-meta">{child.grade ?? 'Grade not set'}</span>
        </div>
        {child.hasAlert && <span className="ts-pill ts-pill--danger">Alert</span>}
        {!child.hasAlert && child.state === 'invited' && <span className="ts-pill">Not signed in</span>}
        {!child.hasAlert && child.state === 'suspended' && <span className="ts-pill ts-pill--danger">Suspended</span>}
      </div>

      <div className="pd-kid__today">
        <MoodFace checkIn={child.checkIn} label={child.checkIn ? child.checkIn.moodName : undefined} />
        <span>{todayText}</span>
      </div>

      <div className="pd-kid__work">
        <div className="pd-kid__workline">
          <span>{tasks.total ? `${tasks.handedIn} of ${plural(tasks.total, 'task')} handed in` : 'No tasks from teachers yet'}</span>
          {tasks.overdue > 0 && <span className="pd-kid__flag pd-kid__flag--danger">{tasks.overdue} overdue</span>}
          {!tasks.overdue && tasks.dueToday > 0 && <span className="pd-kid__flag pd-kid__flag--warning">{tasks.dueToday} due today</span>}
        </div>
        <div
          className="td-progress__track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={`${fullName(child)}: ${tasks.handedIn} of ${tasks.total} tasks handed in`}
        >
          <div className="td-progress__fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="td-meta pd-kid__next">
          <strong>Next:</strong> {nextText}
        </p>
      </div>

      <dl className="pd-kid__stats">
        <div>
          <dt title="Focus time this week">Focus time</dt>
          <dd>{focusValue(focus?.weekMinutes, focus?.weekSessions)}</dd>
        </div>
        <div>
          <dt>Points</dt>
          <dd>{child.points}</dd>
        </div>
        <div>
          <dt>Teachers</dt>
          <dd>
            {child.teachers}
            {child.invitations.waiting > 0 && <span className="pd-kid__sub"> +{child.invitations.waiting} invited</span>}
          </dd>
        </div>
      </dl>

      <Link to={progressLink(child.id)} className="td-panel__link pd-kid__foot">
        View progress <LuArrowRight size={14} aria-hidden="true" />
      </Link>
    </li>
  );
}

const ACTIVITY_ICON = { submitted: LuListChecks, focus: LuTimer, checkin: LuSmile, reward: LuTrophy };

function activityText(item) {
  const who = item.student.firstName ?? fullName(item.student);
  if (item.type === 'submitted') return `${who} handed in ${item.assignment.title}`;
  if (item.type === 'focus') return item.minutes ? `${who} finished a ${item.minutes} minute focus session` : `${who} finished a focus session`;
  if (item.type === 'checkin') return `${who} checked in feeling ${lower(item.moodName)}`;
  const kind = item.reward?.type === 'emoji' ? 'emoji' : item.reward?.type === 'sticker' ? 'sticker' : 'reward';
  return `${who} earned the ${item.reward?.name} ${kind}`;
}

function Dashboard({ data, onReload }) {
  const { stats, account, children, wellbeingAlerts, comingUp, needsAttention, recentFeedback, recentActivity } = data;
  const [busyAlert, setBusyAlert] = useState(null);

  const markSeen = async (alert) => {
    setBusyAlert(alert.id);
    try {
      await parentService.markAlertSeen(alert.student.id, alert.id);
      toast.success('Marked as seen');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyAlert(null);
    }
  };

  const header = (
    <header className="td-head">
      <div>
        <h1 className="td-greeting">
          {greeting()}, {data.parent.firstName ?? 'there'}
        </h1>
        <p className="td-subtitle">{subtitle(data.needsYouCount)}</p>
      </div>
      {children.length > 0 && (
        <div className="pd-head__actions">
          <Button as={Link} to="/parent/children" variant="secondary">
            My children
          </Button>
          <Button as={Link} to="/parent/progress" startIcon={<LuChartLine />}>
            View progress
          </Button>
        </div>
      )}
    </header>
  );

  if (!children.length) {
    return (
      <div className="td-page">
        {header}
        <AccountNotice account={account} />
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

  const { checkedInToday: ci, dueThisWeek: due, focusThisWeek: focus } = stats;
  let checkInNote = 'Everyone has';
  if (ci.waiting.length) checkInNote = ci.waiting.length <= 2 ? `Waiting on ${listNames(ci.waiting)}` : `${ci.waiting.length} not yet`;

  let dueNote = { text: 'Nothing due today', tone: '' };
  if (due.overdue) dueNote = { text: `${due.overdue} overdue`, tone: 'danger' };
  else if (due.dueToday) dueNote = { text: `${due.dueToday} due today`, tone: 'warning' };

  return (
    <div className="td-page">
      {header}

      <AccountNotice account={account} />

      <div className="td-stats">
        <StatCard
          to="/parent/children"
          label="Children"
          value={stats.children.total}
          note={stats.children.needAttention ? `${stats.children.needAttention} need${stats.children.needAttention === 1 ? 's' : ''} attention` : 'All doing fine'}
          tone={stats.children.needAttention ? 'danger' : ''}
        />
        <StatCard to="/parent/progress" label="Checked in today" value={`${ci.done} of ${ci.total}`} note={checkInNote} />
        <StatCard to="/parent/progress" label="Due this week" value={due.total} note={dueNote.text} tone={dueNote.tone} />
        <StatCard
          to="/parent/progress"
          label="Focus this week"
          value={focusValue(focus.minutes, focus.sessions)}
          note={focus.sessions ? plural(focus.sessions, 'session') : 'No focus sessions yet'}
        />
      </div>

      {wellbeingAlerts.length > 0 && (
        <section className="td-alerts" aria-labelledby="pd-alerts-title">
          <div className="td-alerts__head">
            <LuTriangleAlert size={18} aria-hidden="true" style={{ color: 'var(--color-danger-fg)' }} />
            <h2 id="pd-alerts-title" className="td-alerts__title">
              Wellbeing alerts
            </h2>
            <span className="td-alerts__note">Their teachers see these too</span>
          </div>
          <ul className="td-alerts__list">
            {wellbeingAlerts.map((alert) => (
              <li key={alert.id} className="td-alert">
                <StudentAvatar student={alert.student} />
                <MoodFace checkIn={alert} label={alert.moodName} />
                <div className="td-alert__body">
                  <div className="td-alert__name">{fullName(alert.student)}</div>
                  <div className="td-alert__text">
                    Felt {lower(alert.moodName)} at {partOfDayPhrase(alert.createdAt)} check-in · {checkInWhen(alert.createdAt)}
                    {alert.parentEmailStatus === 'sent' ? ' · We emailed you about this' : ''}
                  </div>
                </div>
                <div className="pd-alert__actions">
                  <Button variant="ghost" size="sm" onClick={() => markSeen(alert)} loading={busyAlert === alert.id}>
                    Mark as seen
                  </Button>
                  <Button as={Link} to={progressLink(alert.student.id)} variant="secondary" size="sm">
                    View progress
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Panel title="Your children" link="/parent/children" linkLabel="Manage">
        <ul className="pd-kids">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </ul>
      </Panel>

      <div className="td-grid">
        <Panel title="Coming up" link="/parent/progress" linkLabel="All work">
          {comingUp.length ? (
            <ul className="td-list">
              {comingUp.map((item) => {
                const pill = STAGE_PILL[item.stage] ?? STAGE_PILL.not_started;
                return (
                  <li key={item.key} className="td-row">
                    <StudentAvatar student={item.student} />
                    <div className="td-row__body">
                      <Link to={progressLink(item.student.id)} className="td-row__title">
                        {item.title}
                      </Link>
                      <div className="td-meta">
                        {[item.student.firstName, item.subject, dueLabel(item.dueDate, item.daysLeft)].filter(Boolean).join(' · ')}
                      </div>
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

        <Panel title="Needs attention" link="/parent/children" linkLabel="My children">
          {needsAttention.length ? (
            <ul className="td-list">
              {needsAttention.map((item) => {
                const to = item.kind === 'invitation' ? '/parent/children' : progressLink(item.student.id);
                return (
                  <li key={item.key} className="td-row">
                    <StudentAvatar student={item.student} />
                    <div className="td-row__body">
                      <Link to={to} className="td-row__title">
                        {fullName(item.student)}
                      </Link>
                      <div className="td-meta">{item.reasons.join(' · ')}</div>
                    </div>
                    <Button as={Link} to={to} variant="secondary" size="sm">
                      {item.kind === 'invitation' ? 'Manage' : 'View'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="td-empty">Everyone is on track today.</p>
          )}
        </Panel>

        <Panel title="From teachers">
          {recentFeedback.length ? (
            <ul className="td-list">
              {recentFeedback.map((item) => {
                const Icon = item.returned ? LuRotateCcw : LuClipboardCheck;
                const meta = [
                  item.student.firstName,
                  item.teacherName ? `${item.returned ? 'Sent back' : 'Marked'} by ${item.teacherName}` : null,
                  item.score !== null ? `Score ${item.score}%` : null,
                  item.feedbackGiven ? 'Feedback left' : null,
                  formatTimeAgo(item.at),
                ].filter(Boolean);
                return (
                  <li key={item.id} className="td-row">
                    <span className="td-activity__icon" aria-hidden="true">
                      <Icon size={14} />
                    </span>
                    <div className="td-row__body">
                      <Link to={progressLink(item.student.id)} className="td-row__title">
                        {item.title}
                      </Link>
                      <div className="td-meta">{meta.join(' · ')}</div>
                    </div>
                    <span className={`ts-pill ${item.returned ? 'ts-pill--warning' : 'ts-pill--success'}`}>
                      {item.returned ? 'Sent back' : 'Marked'}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="td-empty">Nothing has been marked yet.</p>
          )}
        </Panel>

        <Panel title="Recent activity">
          {recentActivity.length ? (
            <ul className="td-list">
              {recentActivity.map((item, index) => {
                const Icon = ACTIVITY_ICON[item.type] ?? LuListChecks;
                return (
                  <li key={`${item.type}-${item.student.id}-${item.at}-${index}`} className="td-row">
                    <span className="td-activity__icon" aria-hidden="true">
                      <Icon size={14} />
                    </span>
                    <div className="td-row__body">
                      <div className="td-row__title">{activityText(item)}</div>
                      <div className="td-meta">{formatTimeAgo(item.at)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="td-empty">Nothing from your children yet.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

/** The parent's Overview (/parent) - how each child is doing today. */
export default function ParentDashboardPage() {
  const { data, error, run } = useApi(parentService.getDashboard);
  const load = useCallback(() => run().catch(() => {}), [run]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) return <ErrorState error={error} onRetry={load} />;
  if (!data) return <Loader message="Loading your overview…" />;

  return (
    <>
      <Dashboard data={data} onReload={load} />
      <Toast />
    </>
  );
}
