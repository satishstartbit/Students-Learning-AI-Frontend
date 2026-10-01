import { DataTable } from '../../../components/common';
import { formatDate, formatDuration, formatDurationLong, formatTime, getDateKey } from '../../../utils/date';
// The same subject icon/tone the student sees on their own Home and Plan.
import { getSubjectVisual } from '../../student/components/subjectVisual';
import SubjectPill from '../../../components/subjects/SubjectPill';
import '../../progress/components/progressDetail.css';
import './learningSummary.css';

/** "Today, 4:10 pm" / "Yesterday" / "Sep 19" - in the reader's own timezone. */
function activityDate(value) {
  if (!value) return '—';
  const key = getDateKey(value);
  if (key === getDateKey(new Date())) return `Today, ${formatTime(value)}`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (key === getDateKey(yesterday)) return 'Yesterday';

  return formatDate(value, { year: undefined, month: 'short', day: 'numeric' });
}

/** Sessions, questions and how much of the practice was right. */
function SummaryCards({ summary }) {
  const progress = summary.overallProgress ?? {};
  const trend = summary.trend ?? {};
  const rate = progress.completionRate;

  const sessionNote = [
    progress.sessionsThisWeek ? `${progress.sessionsThisWeek} this week` : null,
    progress.totalMinutes ? `${formatDurationLong(progress.totalMinutes)} in total` : null,
  ].filter(Boolean);

  return (
    <div className="pg-cards">
      <section className="pg-card">
        <p className="pg-card__label">Learning sessions</p>
        <p className="pg-card__value">{progress.sessionsCount ?? 0}</p>
        <p className="pg-card__note">{sessionNote.length ? sessionNote.join(' · ') : 'No sessions yet.'}</p>
      </section>

      <section className="pg-card">
        <p className="pg-card__label">Practice questions</p>
        <p className="pg-card__value">{progress.practiceQuestionCount ?? 0}</p>
        <p className="pg-card__note">
          {progress.questionsThisWeek ? `${progress.questionsThisWeek} this week` : 'None answered this week.'}
        </p>
      </section>

      <section className="pg-card">
        <p className="pg-card__label">Got it right</p>
        <p className="pg-card__value">{rate == null ? '—' : `${rate}%`}</p>
        {rate != null && (
          <div className="pg-bar" role="img" aria-label={`${rate}% of practice questions answered correctly`}>
            <span className="pg-bar__fill" style={{ width: `${rate}%` }} />
          </div>
        )}
        <p className="pg-card__note">
          {/* The month-over-month line only shows when both months have
              answered questions - otherwise there is no trend to report. */}
          {trend.delta == null
            ? rate == null
              ? 'No practice questions answered yet.'
              : `${progress.practiceCorrectCount} of ${progress.practiceQuestionCount} answered correctly`
            : trend.delta === 0
              ? `Holding at ${trend.lastMonthRate}% from last month`
              : `${trend.delta > 0 ? 'Up' : 'Down'} from ${trend.lastMonthRate}% last month`}
        </p>
      </section>
    </div>
  );
}

/** Per-subject practice, busiest subject first. */
function SubjectsPractised({ bySubject }) {
  return (
    <section className="pg-block">
      <h3 className="pg-block__title">Subjects practised</h3>

      {bySubject.length ? (
        <div className="ls-subjects">
          {bySubject.map((row) => {
            const { icon: Icon, tone } = getSubjectVisual(row.subject);

            return (
              <div key={row.subject} className="ls-subject">
                <SubjectPill subject={row.subject} tone={tone} className="pg-subject ls-subject__icon">
                  <Icon size={16} aria-hidden="true" />
                </SubjectPill>

                <div>
                  <div className="ls-subject__head">
                    <span className="ls-subject__name">{row.subject}</span>
                    <span className="ls-subject__rate">{row.rate == null ? 'No questions' : `${row.rate}% right`}</span>
                  </div>

                  {row.rate != null && (
                    <div className="pg-bar" role="img" aria-label={`${row.rate}% right in ${row.subject}`}>
                      <span className="pg-bar__fill" style={{ width: `${row.rate}%` }} />
                    </div>
                  )}

                  <p className="ls-subject__meta">
                    {`${row.sessions} session${row.sessions === 1 ? '' : 's'}`}
                    {row.questions ? ` · ${row.questions} question${row.questions === 1 ? '' : 's'}` : ''}
                    {row.minutes ? ` · ${formatDuration(row.minutes)}` : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="pg-block__lead">No subjects practised yet.</p>
      )}
    </section>
  );
}

/** What they've been working on, most studied first. */
function TopicsStudied({ topics }) {
  return (
    <section className="pg-block">
      <h3 className="pg-block__title">Topics studied</h3>

      {topics.length ? (
        <div className="ls-topics">
          {topics.map((t) => (
            <span key={t.topic} className="ls-topic">
              {t.topic}
              <span className="ls-topic__count">· {t.count}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="pg-block__lead">No topics studied yet.</p>
      )}
    </section>
  );
}

const SESSION_COLUMNS = [
  {
    key: 'subject',
    header: 'Subject',
    render: (row) =>
      row.subject ? (
        <SubjectPill subject={row.subject} tone={getSubjectVisual(row.subject).tone} className="pg-subject" />
      ) : (
        <span className="ls-muted">—</span>
      ),
  },
  { key: 'topic', header: 'Topic', render: (row) => <span className="ls-activity__topic">{row.topic ?? '—'}</span> },
  { key: 'date', header: 'Date', render: (row) => activityDate(row.date) },
  {
    key: 'durationMinutes',
    header: 'Duration',
    render: (row) =>
      row.durationMinutes ? formatDuration(row.durationMinutes) : <span className="ls-muted">In progress</span>,
  },
  {
    key: 'practice',
    header: 'Practice',
    render: (row) =>
      row.practiceQuestionCount > 0 ? (
        `${row.practiceCorrectCount} of ${row.practiceQuestionCount} right`
      ) : (
        <span className="ls-muted">No questions</span>
      ),
  },
];

/**
 * One student's AI-assistant learning summary: totals and trend, per-subject
 * practice, topics, and the most recent sessions.
 *
 * Aggregates only - the conversation itself is private and is never returned
 * by the API, for either audience. Shared by the parent page and the teacher
 * drill-down so both read the same numbers the same way.
 */
export function LearningSummaryPanel({ summary, emptyDescription }) {
  return (
    <div>
      <SummaryCards summary={summary} />

      <div className="ls-split">
        <SubjectsPractised bySubject={summary.bySubject ?? []} />
        <TopicsStudied topics={summary.topicsStudied ?? []} />
      </div>

      <section className="pg-block">
        <h3 className="pg-block__title">Recent learning activity</h3>
        <div className="ls-activity">
          <DataTable
            columns={SESSION_COLUMNS}
            data={summary.recentSessions ?? []}
            rowKey="id"
            emptyTitle="No learning sessions yet"
            emptyDescription={
              emptyDescription ?? 'Sessions with the AI learning assistant will be listed here.'
            }
            caption="Recent learning activity"
          />
        </div>
      </section>
    </div>
  );
}

export default LearningSummaryPanel;
