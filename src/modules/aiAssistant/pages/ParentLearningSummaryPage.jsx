import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LuCheck } from 'react-icons/lu';
import { Avatar, Badge, Button, EmptyState, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatName } from '../../../utils/format';
import LearningSummaryPanel from '../components/LearningSummaryPanel';
import * as aiAssistantService from '../services/aiAssistant.service';
import '../../parent/components/parentPanels.css';

/**
 * The parent's Learning Summary: how each child is getting on with the AI
 * learning assistant.
 *
 * Activity and progress only - the child's conversations with the assistant
 * are private and are never returned by the API. The summary itself is the
 * shared LearningSummaryPanel, which the teacher's Learning Activity
 * drill-down also renders.
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
  const summary = !detail.isLoading && !detail.error ? detail.data : null;

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
          <LearningSummaryPanel
            summary={summary}
            emptyDescription="When your child uses the AI learning assistant, their sessions will be listed here."
          />
        )}
      </section>
    </div>
  );
}
