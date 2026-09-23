import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LuArrowLeft, LuTriangleAlert } from 'react-icons/lu';
import { Button, ErrorState, Loader, Toast } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatDateKey, formatDate } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import teacherStudentService from '../services/teacherStudent.service';
import { MoodFace, StudentAvatar, SubjectChips } from '../components/students/StudentBits';
import { checkInWhen, focusLabel, fullName, lastActiveLabel, partOfDayPhrase } from '../components/students/studentFormat';
import '../components/students/teacherStudents.css';

const STATE_PILL = {
  active: { label: 'Active', tone: 'success' },
  invited: { label: 'Invited', tone: '' },
  suspended: { label: 'Suspended', tone: 'danger' },
};

const WORK_PILL = {
  not_started: { label: 'Not started', tone: '' },
  in_progress: { label: 'In progress', tone: 'accent' },
  needs_marking: { label: 'Needs marking', tone: 'warning' },
  marked: { label: 'Marked', tone: 'success' },
  returned: { label: 'Returned', tone: '' },
};

const lower = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

const PARENT_LINE = {
  sent: 'Their parent has been emailed.',
  failed: "We couldn't email their parent - you may want to let them know.",
  no_parent: 'No parent is linked to their account, so nobody was emailed.',
};

function AlertBanner({ student, alert, onSeen, busy }) {
  const first = student.firstName;
  return (
    <section className="ts-alert" role="alert" aria-label="Check-in alert">
      <LuTriangleAlert className="ts-alert__icon" size={20} aria-hidden="true" />
      <div className="ts-alert__body">
        <h2 className="ts-alert__title">Check-in alert · {lower(checkInWhen(alert.createdAt))}</h2>
        <p className="ts-alert__text">
          {first} said they felt {lower(alert.moodName)} during {partOfDayPhrase(alert.createdAt)} check-in.{' '}
          {PARENT_LINE[alert.parentEmailStatus] ?? ''} You may want to check in with {first} today.
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={onSeen} loading={busy}>
        Mark as seen
      </Button>
    </section>
  );
}

function WorkRow({ item }) {
  const pill = WORK_PILL[item.state] ?? WORK_PILL.not_started;
  const handedIn = item.state === 'needs_marking' || item.state === 'marked';
  const when = handedIn && item.submittedAt
    ? `Submitted ${formatDate(item.submittedAt, { year: undefined })}`
    : item.dueDate
      ? `Due ${formatDateKey(item.dueDate.slice(0, 10), { year: undefined })}`
      : 'No due date';
  const score = item.points
    ? `${item.points.earned} / ${item.points.possible}`
    : item.state === 'marked' && item.score !== null
      ? `${item.score}%`
      : '—';

  return (
    <li className="ts-work__row">
      <div>
        <Link to={`/teacher/assignments/${item.id}`} className="ts-work__title">
          {item.title}
        </Link>
        <span className="ts-work__meta">{[item.subject, when].filter(Boolean).join(' · ')}</span>
      </div>
      <div className="ts-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(item.progress * 100)} aria-label={`${item.title} progress`}>
        <div className="ts-bar__fill" style={{ width: `${Math.round(item.progress * 100)}%` }} />
      </div>
      <span className="ts-work__score">{score}</span>
      <span className={`ts-pill ts-work__status ${pill.tone ? `ts-pill--${pill.tone}` : ''}`.trim()}>{pill.label}</span>
    </li>
  );
}

function StudentOverview({ data, onReload }) {
  const { student, alert, stats, assignments, week, recentCheckIns } = data;
  const [busy, setBusy] = useState(false);
  const statePill = STATE_PILL[student.state] ?? STATE_PILL.active;

  const markSeen = async () => {
    setBusy(true);
    try {
      await teacherStudentService.markAlertSeen(student.id, alert.id);
      toast.success('Marked as seen');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ts-page">
      <Link to="/teacher/students" className="ts-back">
        <LuArrowLeft size={15} aria-hidden="true" /> Back to students
      </Link>

      <section className="ts-card ts-header">
        <StudentAvatar student={student} size="lg" />
        <div className="ts-header__body">
          <h1 className="ts-header__name">{fullName(student)}</h1>
          <p className="ts-header__meta">
            {[student.grade, student.email, `Last active ${lower(lastActiveLabel(student.lastActiveAt))}`].filter(Boolean).join(' · ')}
          </p>
          <SubjectChips subjects={student.subjects} />
        </div>
        <span className={`ts-pill ${statePill.tone ? `ts-pill--${statePill.tone}` : ''}`.trim()}>{statePill.label}</span>
      </section>

      {alert && <AlertBanner student={student} alert={alert} onSeen={markSeen} busy={busy} />}

      <div className="ts-layout">
        <div className="ts-main">
          <div className="ts-stats">
            <div className="ts-card">
              <p className="ts-stat__value">{stats.assigned ? `${stats.submitted} of ${stats.assigned}` : '—'}</p>
              <p className="ts-stat__label">Assignments submitted</p>
            </div>
            <div className="ts-card">
              <p className="ts-stat__value">{stats.averageScore !== null ? `${stats.averageScore}%` : '—'}</p>
              <p className="ts-stat__label">Average score</p>
            </div>
            <div className="ts-card">
              <p className="ts-stat__value">{focusLabel(stats.focusMinutesThisWeek)}</p>
              <p className="ts-stat__label">Focus time this week</p>
            </div>
          </div>

          <section className="ts-card" aria-labelledby="ts-work-title">
            <h2 id="ts-work-title" className="ts-card__title">
              Assignments
            </h2>
            {assignments.length ? (
              <ul className="ts-work">
                {assignments.map((item) => (
                  <WorkRow key={item.id} item={item} />
                ))}
              </ul>
            ) : (
              <p className="ts-empty">You haven&apos;t sent {student.firstName} any assignments yet.</p>
            )}
          </section>
        </div>

        <aside className="ts-side">
          <section className="ts-card" aria-labelledby="ts-week-title">
            <h2 id="ts-week-title" className="ts-card__title">
              Wellbeing this week
            </h2>
            <p className="ts-week__lead">From {student.firstName}&apos;s daily check-ins</p>
            <ul className="ts-week">
              {week.map((day) => {
                const dayName = formatDateKey(day.date, { weekday: 'short', month: undefined, day: undefined, year: undefined });
                const label = day.checkIn ? `${dayName}: ${day.checkIn.moodName}` : `${dayName}: no check-in`;
                return (
                  <li key={day.date}>
                    <MoodFace checkIn={day.checkIn} size="lg" label={label} />
                    <span aria-hidden="true">{dayName}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="ts-card" aria-labelledby="ts-recent-title">
            <h2 id="ts-recent-title" className="ts-card__title">
              Recent check-ins
            </h2>
            {recentCheckIns.length ? (
              <ul className="ts-recent">
                {recentCheckIns.map((c) => (
                  <li key={c.checkInId}>
                    <div>
                      <div className="ts-recent__mood">
                        {c.moodName}
                        {c.energy ? ` · Energy ${c.energy} of 5` : ''}
                      </div>
                      <div className="ts-recent__when">{checkInWhen(c.at)}</div>
                    </div>
                    {c.alert && <span className="ts-pill ts-pill--danger">Alert</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ts-empty">No check-ins yet.</p>
            )}
          </section>

          <p className="ts-footnote">Parents get check-in alerts by email. Teachers see them here too.</p>
        </aside>
      </div>
    </div>
  );
}

function StudentPageLoader({ id }) {
  const overview = useApi(teacherStudentService.getStudentOverview, { immediate: true, args: [id] });
  const reload = () => overview.run(id).catch(() => {});

  let content;
  if (overview.error && !overview.data) content = <ErrorState error={overview.error} onRetry={reload} />;
  else if (!overview.data || overview.data.student?.id !== id) content = <Loader message="Loading student…" />;
  else content = <StudentOverview data={overview.data} onReload={reload} />;

  return (
    <>
      {content}
      <Toast />
    </>
  );
}

/** A student's page for their teacher (/teacher/students/:id). Keyed by id so moving between students reloads. */
export default function TeacherStudentPage() {
  const { id } = useParams();
  return <StudentPageLoader key={id} id={id} />;
}
