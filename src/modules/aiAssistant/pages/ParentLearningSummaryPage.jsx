import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LuAtom, LuBookOpen, LuCalculator, LuCheck, LuGlobe, LuMusic, LuPalette, LuPencilRuler } from 'react-icons/lu';
import { Avatar, Badge, Button, DataTable, EmptyState, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatDate, formatDuration, formatDurationLong, formatTime, getDateKey } from '../../../utils/date';
import { formatName } from '../../../utils/format';
import { subjectTone } from '../../parent/components/subjectTone';
import * as aiAssistantService from '../services/aiAssistant.service';
import '../../parent/components/parentPanels.css';
import '../../parent/components/parentLearningSummary.css';

/**
 * An icon for a subject, matched on what the subject is called. Subjects are
 * admin-editable master data, so this is a keyword match with a general
 * fallback rather than a fixed list - a new subject still gets a tile.
 */
const SUBJECT_ICONS = [
  [/(math|number|algebra|geometr)/i, LuCalculator],
  [/(science|physic|chem|biolog)/i, LuAtom],
  [/(english|read|writ|literac|language)/i, LuBookOpen],
  [/(history|geograph|social|civic)/i, LuGlobe],
  [/(art|draw|paint|design)/i, LuPalette],
  [/(music|sing|instrument)/i, LuMusic],
];

function SubjectIcon({ subject }) {
  const match = SUBJECT_ICONS.find(([pattern]) => pattern.test(String(subject ?? '')));
  const Icon = match ? match[1] : LuPencilRuler;
  return <Icon size={16} aria-hidden="true" />;
}

/** "Today, 4:10 pm" / "Yesterday" / "Sep 19" - in the reader's own timezone. */
function activityDate(value) {
  if (!value) return '—';
  const key = getDateKey(value);
  const todayKey = getDateKey(new Date());
  if (key === todayKey) return `Today, ${formatTime(value)}`;

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
    <div className="pp-cards">
      <section className="pp-card">
        <p className="pp-card__label">Learning sessions</p>
        <p className="pp-card__value">{progress.sessionsCount ?? 0}</p>
        <p className="pp-card__note">{sessionNote.length ? sessionNote.join(' · ') : 'No sessions yet.'}</p>
      </section>

      <section className="pp-card">
        <p className="pp-card__label">Practice questions</p>
        <p className="pp-card__value">{progress.practiceQuestionCount ?? 0}</p>
        <p className="pp-card__note">
          {progress.questionsThisWeek ? `${progress.questionsThisWeek} this week` : 'None answered this week.'}
        </p>
      </section>

      <section className="pp-card">
        <p className="pp-card__label">Got it right</p>
        <p className="pp-card__value">{rate == null ? '—' : `${rate}%`}</p>
        {rate != null && (
          <div className="pp-bar" role="img" aria-label={`${rate}% of practice questions answered correctly`}>
            <span className="pp-bar__fill" style={{ width: `${rate}%` }} />
          </div>
        )}
        <p className="pp-card__note">
          {/* Only shown when both months have answered questions - otherwise
              there is no trend to report. */}
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
    <section className="pp-block">
      <h3 className="pp-block__title">Subjects practised</h3>

      {bySubject.length ? (
        <div className="pl-subjects">
          {bySubject.map((row) => (
            <div key={row.subject} className="pl-subject" data-tone={subjectTone(row.subject)}>
              <span className="pl-subject__icon pp-subject" data-tone={subjectTone(row.subject)}>
                <SubjectIcon subject={row.subject} />
              </span>

              <div>
                <div className="pl-subject__head">
                  <span className="pl-subject__name">{row.subject}</span>
                  <span className="pl-subject__rate">{row.rate == null ? 'No questions' : `${row.rate}% right`}</span>
                </div>

                {row.rate != null && (
                  <div className="pp-bar" role="img" aria-label={`${row.rate}% right in ${row.subject}`}>
                    <span className="pp-bar__fill" style={{ width: `${row.rate}%` }} />
                  </div>
                )}

                <p className="pl-subject__meta">
                  {`${row.sessions} session${row.sessions === 1 ? '' : 's'}`}
                  {row.questions ? ` · ${row.questions} question${row.questions === 1 ? '' : 's'}` : ''}
                  {row.minutes ? ` · ${formatDuration(row.minutes)}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="pp-block__lead">No subjects practised yet.</p>
      )}
    </section>
  );
}

/** What they've been working on, most studied first. */
function TopicsStudied({ topics }) {
  return (
    <section className="pp-block">
      <h3 className="pp-block__title">Topics studied</h3>

      {topics.length ? (
        <div className="pl-topics">
          {topics.map((t) => (
            <span key={t.topic} className="pl-topic">
              {t.topic}
              <span className="pl-topic__count">· {t.count}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="pp-block__lead">No topics studied yet.</p>
      )}
    </section>
  );
}

/**
 * The parent's Learning Summary: how each child is getting on with the AI
 * learning assistant.
 *
 * Activity and progress only - the child's conversations with the assistant
 * are private and are never returned by the API.
 */
export default function ParentLearningSummaryPage() {
  const overview = useApi(aiAssistantService.getParentLearningOverview, { immediate: true });
  const detail = useApi(aiAssistantService.getParentLearningSummary);
  const { run: runDetail } = detail;

  // The chosen child lives in the URL, matching /parent/progress - so a link
  // to one child's summary can be shared or reloaded.
  const [searchParams, setSearchParams] = useSearchParams();
  const childId = searchParams.get('childId') ?? '';
  const setChildId = (id) => setSearchParams(id ? { childId: id } : {}, { replace: true });

  const children = overview.data ?? [];
  const known = children.some((c) => c.student.id === childId);
  const selectedId = (known ? childId : '') || children[0]?.student.id || '';

  useEffect(() => {
    if (selectedId) runDetail(selectedId).catch(() => {});
  }, [selectedId, runDetail]);

  if (overview.isLoading && !overview.data) return <Loader message="Loading your children…" />;

  if (overview.error && !overview.data) {
    return (
      <div className="td-page">
        <PageHeader title="Learning Summary" />
        <ErrorState
          title="We couldn't load this page"
          error={overview.error}
          onRetry={() => overview.run().catch(() => {})}
        />
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className="td-page">
        <PageHeader title="Learning Summary" />
        <EmptyState
          icon="👨‍👩‍👧"
          title="No children on your account yet"
          description="Once you add a child, their learning progress will show up here."
          action={
            <Button as={Link} to="/parent/children">
              Go to My Children
            </Button>
          }
        />
      </div>
    );
  }

  const selected = children.find((c) => c.student.id === selectedId);
  const selectedName = selected ? formatName(selected.student) : '';
  const firstName = selected?.student?.firstName ?? selectedName;
  const ready = !detail.isLoading && !detail.error && detail.data;
  const summary = ready ? detail.data : null;

  const sessionColumns = [
    {
      key: 'subject',
      header: 'Subject',
      render: (row) =>
        row.subject ? (
          <span className="pp-subject" data-tone={subjectTone(row.subject)}>
            {row.subject}
          </span>
        ) : (
          <span className="pl-muted">—</span>
        ),
    },
    {
      key: 'topic',
      header: 'Topic',
      render: (row) => <span className="pl-activity__topic">{row.topic ?? '—'}</span>,
    },
    { key: 'date', header: 'Date', render: (row) => activityDate(row.date) },
    {
      key: 'durationMinutes',
      header: 'Duration',
      render: (row) =>
        row.durationMinutes ? formatDuration(row.durationMinutes) : <span className="pl-muted">In progress</span>,
    },
    {
      key: 'practice',
      header: 'Practice',
      render: (row) =>
        row.practiceQuestionCount > 0 ? (
          `${row.practiceCorrectCount} of ${row.practiceQuestionCount} right`
        ) : (
          <span className="pl-muted">No questions</span>
        ),
    },
  ];

  return (
    <div className="td-page">
      <PageHeader title="Learning Summary" description="How your child is getting on with the AI learning assistant." />

      <section>
        <p className="pp-picker__label" id="pl-choose-child">
          Choose a child
        </p>
        <div className="pp-picker" role="group" aria-labelledby="pl-choose-child">
          {children.map((child) => {
            const active = child.student.id === selectedId;
            const name = formatName(child.student);

            return (
              <button
                key={child.student.id}
                type="button"
                className="pp-child"
                aria-pressed={active}
                onClick={() => setChildId(child.student.id)}
              >
                <Avatar name={name} size="md" />

                <span className="pp-child__body">
                  <span className="pp-child__name">{name}</span>
                  {child.student.grade && <span className="pp-child__grade">{child.student.grade}</span>}

                  <span className="pp-child__chips">
                    <Badge variant={child.sessionsThisMonth ? 'primary' : 'neutral'}>
                      {child.sessionsThisMonth
                        ? `${child.sessionsThisMonth} session${child.sessionsThisMonth === 1 ? '' : 's'} this month`
                        : child.sessionsTotal
                          ? 'No sessions this month'
                          : 'No sessions yet'}
                    </Badge>
                  </span>
                </span>

                {active && (
                  <span className="pp-child__tick" aria-hidden="true">
                    <LuCheck size={13} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="pp-panel">
        <div className="pp-panel__head">
          <Avatar name={selectedName} size="md" />
          <div>
            <h2 className="pp-panel__title">{selectedName}&rsquo;s learning</h2>
            <p className="pp-panel__sub">
              {[selected?.student?.grade, `Everything below is about ${firstName}.`].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {detail.isLoading && <Loader message="Loading learning summary…" />}

        {detail.error && !detail.isLoading && (
          <ErrorState
            title="We couldn't load this summary"
            error={detail.error}
            onRetry={() => runDetail(selectedId).catch(() => {})}
          />
        )}

        {summary && (
          <>
            <SummaryCards summary={summary} />

            <div className="pl-split">
              <SubjectsPractised bySubject={summary.bySubject ?? []} />
              <TopicsStudied topics={summary.topicsStudied ?? []} />
            </div>

            <section className="pp-block">
              <h3 className="pp-block__title">Recent learning activity</h3>
              <div className="pl-activity">
                <DataTable
                  columns={sessionColumns}
                  data={summary.recentSessions ?? []}
                  rowKey="id"
                  emptyTitle="No learning sessions yet"
                  emptyDescription="When your child uses the AI learning assistant, their sessions will be listed here."
                  caption="Recent learning activity"
                />
              </div>
            </section>
          </>
        )}
      </section>
    </div>
  );
}
