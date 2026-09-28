import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar, Button, EmptyState, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatName } from '../../../utils/format';
import { useViewingChild } from '../../parent/hooks/useViewingChild';
import LearningSummaryPanel from '../components/LearningSummaryPanel';
import * as aiAssistantService from '../services/aiAssistant.service';
import '../../parent/components/parentPanels.css';

/**
 * The parent's Learning Summary: how each child is getting on with the AI
 * learning assistant.
 *
 * The child picker has moved to the sidebar (VIEWING section); this page
 * reads the selection from ViewingChildContext. Deep links with ?childId=
 * are synced on mount and stripped.
 */
export default function ParentLearningSummaryPage() {
  const { viewingChild, setViewingChildId, children } = useViewingChild();
  const detail = useApi(aiAssistantService.getParentLearningSummary);
  const { run: runDetail } = detail;

  // Backward compat: ?childId= syncs to the sidebar.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlChildId = searchParams.get('childId');
  useEffect(() => {
    if (urlChildId && children.some((c) => c.id === urlChildId)) {
      setViewingChildId(urlChildId);
      setSearchParams({}, { replace: true });
    } else if (urlChildId) {
      setSearchParams({}, { replace: true });
    }
  }, [urlChildId, children, setViewingChildId, setSearchParams]);

  const childId = viewingChild?.id;
  useEffect(() => {
    if (childId) runDetail(childId).catch(() => {});
  }, [childId, runDetail]);

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

  if (!viewingChild) return <Loader message="Loading…" />;

  const name = formatName(viewingChild);
  const firstName = viewingChild.firstName ?? name;
  const summary = !detail.isLoading && !detail.error ? detail.data : null;

  return (
    <div className="td-page">
      <PageHeader title="Learning Summary" description="How your child is getting on with the AI learning assistant." />

      <section className="pp-panel">
        <div className="pp-panel__head">
          <Avatar name={name} size="md" />
          <div>
            <h2 className="pp-panel__title">{name}&rsquo;s learning</h2>
            <p className="pp-panel__sub">
              {[viewingChild.grade, `Everything below is about ${firstName}.`].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {detail.isLoading && <Loader message="Loading learning summary…" />}

        {detail.error && !detail.isLoading && (
          <ErrorState
            title="We couldn't load this summary"
            error={detail.error}
            onRetry={() => runDetail(childId).catch(() => {})}
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
