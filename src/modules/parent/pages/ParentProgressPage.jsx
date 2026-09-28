import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar, Button, EmptyState, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatName } from '../../../utils/format';
import { useMoodLookup } from '../../checkIn/hooks/useMoodLookup';
import StudentProgressDetail from '../../progress/components/StudentProgressDetail';
import { useViewingChild } from '../hooks/useViewingChild';
import parentService from '../services/parent.service';
import '../components/parentPanels.css';

/**
 * Parent-facing wording for the task stages. The shared TASK_STAGES labels
 * (modules/progress/stages.js) are written for the teacher who set the work -
 * a parent reads "Handed in", not "Submitted". Tones stay shared, so a stage
 * is the same colour for both.
 */
const PARENT_STAGE_LABEL = {
  not_started: 'Not started',
  in_progress: 'In progress',
  returned: 'Sent back to fix',
  submitted: 'Handed in',
  reviewed: 'Marked',
};

/**
 * /parent/progress - shows the sidebar-selected child's check-in and task
 * progress.
 *
 * The child picker that was on this page has moved to the sidebar (the
 * VIEWING section); this page reads the selection from ViewingChildContext.
 * Deep links with ?childId= (from the Overview dashboard) sync to the
 * context on mount and then strip the param.
 */
export default function ParentProgressPage() {
  const { viewingChild, setViewingChildId, children } = useViewingChild();
  const detail = useApi(parentService.getChildProgress);
  const { run: runDetail } = detail;

  // Mood names on the check-in strip come from the live master list.
  useMoodLookup();

  // Backward compat: ?childId= from Overview links syncs to the sidebar.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlChildId = searchParams.get('childId');
  useEffect(() => {
    if (urlChildId && children.some((c) => c.id === urlChildId)) {
      setViewingChildId(urlChildId);
      setSearchParams({}, { replace: true });
    } else if (urlChildId) {
      // Unknown id (stale link) - just strip it.
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
        <PageHeader title="Progress" />
        <EmptyState
          icon="👨‍👩‍👧"
          title="No children on your account yet"
          description="Once you add a child, their check-ins and task progress will show up here."
          action={
            <Button as={Link} to="/parent/children">
              Go to My Children
            </Button>
          }
        />
      </div>
    );
  }

  if (!viewingChild) return <Loader message="Loading progress…" />;

  const name = formatName(viewingChild);
  const firstName = viewingChild.firstName ?? name;
  const ready = !detail.isLoading && !detail.error && detail.data?.student?.id === childId;

  return (
    <div className="td-page">
      <PageHeader title="Progress" description="How each child is arriving each day, and how their work is going." />

      <section className="pp-panel">
        <div className="pp-panel__head">
          <Avatar name={name} size="md" />
          <div>
            <h2 className="pp-panel__title">{name}&rsquo;s progress</h2>
            <p className="pp-panel__sub">
              {[viewingChild.grade, `Everything below is about ${firstName}.`].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {detail.isLoading && <Loader message="Loading…" />}

        {detail.error && !detail.isLoading && (
          <ErrorState
            title="We couldn't load this child's progress"
            error={detail.error}
            onRetry={() => runDetail(childId).catch(() => {})}
          />
        )}

        {ready && (
          <StudentProgressDetail
            progress={detail.data}
            showTeacher
            stageLabels={PARENT_STAGE_LABEL}
            name={firstName}
          />
        )}
      </section>
    </div>
  );
}
