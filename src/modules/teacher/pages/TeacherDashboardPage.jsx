import { useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LuArrowRight,
  LuListChecks,
  LuPlus,
  LuSmile,
  LuTimer,
  LuTriangleAlert,
  LuTrophy,
} from 'react-icons/lu';
import { Button, ErrorState, Loader, Toast } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import dashboardService from '../services/dashboard.service';
import { MoodFace, StudentAvatar } from '../components/students/StudentBits';
import { checkInWhen, fullName, partOfDayPhrase } from '../components/students/studentFormat';
import { daysUntilDateKey, formatDate, formatDateKey, formatTimeAgo, getDateKey, getHourInTimezone } from '../../../utils/date';
import '../components/students/teacherStudents.css';
import '../components/dashboard/teacherDashboard.css';

const NUMBER_WORDS = ['no', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const lower = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function greeting() {
  const hour = getHourInTimezone();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "Tuesday, September 22 · Three things need you today." */
function subtitle(count) {
  const date = formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: undefined });
  if (!count) return `${date} · Nothing needs you right now.`;
  const word = count <= 10 ? NUMBER_WORDS[count] : String(count);
  return `${date} · ${word} thing${count === 1 ? '' : 's'} need${count === 1 ? 's' : ''} you today.`;
}

/** The chip for an assignment that hasn't been marked completed yet. */
function dueState(item, today) {
  if (item.status === 'completed') return { label: 'Completed', tone: 'success' };
  if (item.startDate && item.startDate.slice(0, 10) > today) return { label: 'Scheduled', tone: '' };
  const days = item.dueDate ? daysUntilDateKey(item.dueDate) : null;
  if (days !== null && days < 0) return { label: 'Overdue', tone: 'danger' };
  if (days === 0) return { label: 'Due today', tone: 'warning' };
  return { label: 'Published', tone: 'accent' };
}

function dueLabel(item, today) {
  if (item.startDate && item.startDate.slice(0, 10) > today) return `Opens ${formatDateKey(item.startDate.slice(0, 10), { year: undefined })}`;
  if (!item.dueDate) return 'No due date';
  const days = daysUntilDateKey(item.dueDate);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due ${formatDateKey(item.dueDate.slice(0, 10), { year: undefined })}`;
}

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

const ACTIVITY_ICON = { submitted: LuListChecks, focus: LuTimer, checkin: LuSmile, reward: LuTrophy };

function activityText(item) {
  const who = fullName(item.student);
  if (item.type === 'submitted') return `${who} submitted ${item.assignment.title}`;
  if (item.type === 'focus') return item.minutes ? `${who} finished a ${item.minutes} minute focus session` : `${who} finished a focus session`;
  if (item.type === 'checkin') return `${who} checked in feeling ${lower(item.moodName)}`;
  const kind = item.reward?.type === 'emoji' ? 'emoji' : item.reward?.type === 'sticker' ? 'sticker' : 'reward';
  return `${who} earned the ${item.reward?.name} ${kind}`;
}

function Dashboard({ data }) {
  const { stats, wellbeingAlerts, dueSoon, needsAttention, waitingToMark, recentActivity } = data;
  const today = getDateKey();

  return (
    <div className="td-page">
      <header className="td-head">
        <div>
          <h1 className="td-greeting">
            {greeting()}, {data.teacher.firstName ?? 'there'}
          </h1>
          <p className="td-subtitle">{subtitle(data.needsYouCount)}</p>
        </div>
        <Button as={Link} to="/teacher/assignments/new" startIcon={<LuPlus />}>
          Create assignment
        </Button>
      </header>

      <div className="td-stats">
        <Link to="/teacher/students" className="td-stat" style={{ textDecoration: 'none', color: 'inherit' }}>
          <p className="td-stat__label">Students</p>
          <p className="td-stat__value">{stats.students.total}</p>
          <p className={`td-stat__note ${stats.students.needAttention ? 'td-stat__note--danger' : ''}`.trim()}>
            {stats.students.needAttention ? `${stats.students.needAttention} need attention` : 'All doing fine'}
          </p>
        </Link>
        <Link to="/teacher/students?view=no_checkin" className="td-stat" style={{ textDecoration: 'none', color: 'inherit' }}>
          <p className="td-stat__label">Checked in today</p>
          <p className="td-stat__value">
            {stats.checkedInToday.done} of {stats.checkedInToday.total}
          </p>
          <p className="td-stat__note">{stats.checkedInToday.notYet ? `${stats.checkedInToday.notYet} not yet` : 'Everyone has'}</p>
        </Link>
        <Link to="/teacher/assignments?view=published" className="td-stat" style={{ textDecoration: 'none', color: 'inherit' }}>
          <p className="td-stat__label">Due this week</p>
          <p className="td-stat__value">{stats.dueThisWeek.total}</p>
          <p className={`td-stat__note ${stats.dueThisWeek.dueToday ? 'td-stat__note--warning' : ''}`.trim()}>
            {stats.dueThisWeek.dueToday ? `${stats.dueThisWeek.dueToday} due today` : 'Nothing due today'}
          </p>
        </Link>
        <div className="td-stat">
          <p className="td-stat__label">Work to mark</p>
          <p className="td-stat__value">{stats.toMark.submissions}</p>
          <p className="td-stat__note">
            {stats.toMark.submissions ? `From ${plural(stats.toMark.assignments, 'assignment')}` : 'Nothing waiting'}
          </p>
        </div>
      </div>

      {wellbeingAlerts.length > 0 && (
        <section className="td-alerts" aria-labelledby="td-alerts-title">
          <div className="td-alerts__head">
            <LuTriangleAlert size={18} aria-hidden="true" style={{ color: 'var(--color-danger-fg)' }} />
            <h2 id="td-alerts-title" className="td-alerts__title">
              Wellbeing alerts
            </h2>
            <span className="td-alerts__note">Parents are emailed automatically</span>
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
                  </div>
                </div>
                <Button as={Link} to={`/teacher/students/${alert.student.id}`} variant="secondary" size="sm">
                  View student
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="td-grid">
        <Panel title="Due soon" link="/teacher/assignments" linkLabel="All assignments">
          {dueSoon.length ? (
            <ul className="td-list">
              {dueSoon.map((item) => {
                const chip = dueState(item, today);
                const percent = item.recipientCount ? Math.round((item.submittedCount / item.recipientCount) * 100) : 0;
                return (
                  <li key={item.id} className="td-due">
                    <div>
                      <Link to={`/teacher/assignments/${item.id}`} className="td-due__title">
                        {item.title}
                      </Link>
                      <span className="td-meta">{[item.subject, item.grade, dueLabel(item, today)].filter(Boolean).join(' · ')}</span>
                    </div>
                    <div className="td-progress">
                      <div
                        className="td-progress__track"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                        aria-label={`${item.submittedCount} of ${item.recipientCount} submitted`}
                      >
                        <div className="td-progress__fill" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="td-meta">
                        {item.recipientCount ? `${item.submittedCount} of ${item.recipientCount} submitted` : 'No students'}
                      </span>
                    </div>
                    <span className={`ts-pill ${chip.tone ? `ts-pill--${chip.tone}` : ''}`.trim()}>{chip.label}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="td-empty">Nothing due in the next couple of weeks.</p>
          )}
        </Panel>

        <Panel title="Needs attention" link="/teacher/students?view=attention" linkLabel="All students">
          {needsAttention.length ? (
            <ul className="td-list">
              {needsAttention.map((item) => (
                <li key={item.student.id} className="td-row">
                  <StudentAvatar student={item.student} />
                  <div className="td-row__body">
                    <Link to={`/teacher/students/${item.student.id}`} className="td-row__title">
                      {fullName(item.student)}
                    </Link>
                    <div className="td-meta">{item.reason}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="td-empty">Everyone is on track today.</p>
          )}
        </Panel>

        <Panel title="Waiting for you to mark">
          {waitingToMark.length ? (
            <ul className="td-list">
              {waitingToMark.map((item) => (
                <li key={item.id} className="td-row">
                  <div className="td-row__body">
                    <Link to={`/teacher/assignments/${item.id}`} className="td-row__title">
                      {item.title}
                    </Link>
                    <div className="td-meta">
                      {item.writtenAnswers ? plural(item.writtenAnswers, 'written answer') : plural(item.submissions, 'submission')}
                    </div>
                  </div>
                  <Button as={Link} to={`/teacher/assignments/${item.id}`} variant="secondary" size="sm">
                    Start marking
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="td-empty">Nothing is waiting to be marked.</p>
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
            <p className="td-empty">Nothing from your students yet today.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

/** The teacher's dashboard (/teacher) - what needs them today. */
export default function TeacherDashboardPage() {
  const { data, error, run } = useApi(dashboardService.getTeacherDashboard);
  const load = useCallback(() => run().catch(() => {}), [run]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) return <ErrorState error={error} onRetry={load} />;
  if (!data) return <Loader message="Loading your dashboard…" />;

  return (
    <>
      <Dashboard data={data} />
      <Toast />
    </>
  );
}
