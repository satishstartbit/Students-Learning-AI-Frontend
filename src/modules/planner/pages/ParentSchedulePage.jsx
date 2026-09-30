import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuCalendarClock, LuPlus } from 'react-icons/lu';
import { Button, ConfirmationModal, EmptyState, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import SupportSummaryCard from '../components/SupportSummaryCard';
import supportService from '../services/support.service';
import { useViewingChild } from '../../parent/hooks/useViewingChild';
import AddWorkDialog from '../components/AddWorkDialog';
import NextActionsCard from '../components/NextActionsCard';
import PendingIntakes from '../components/PendingIntakes';
import PlanNotices from '../components/PlanNotices';
import PriorityList from '../components/PriorityList';
import WorkList from '../components/WorkList';
import { usePlan } from '../hooks/usePlan';
import planService from '../services/plan.service';
import '../planner.css';

const VIEWS = [
  { key: 'priority', label: 'Priority' },
  { key: 'due', label: 'Due date' },
  { key: 'subject', label: 'Subject' },
];

function ChildSchedule({ child }) {
  const first = child.firstName ?? formatName(child);
  const { plan, isLoading, error, reload } = usePlan(child.id);
  const work = useApi(planService.listWork, { immediate: true, args: [child.id] });
  const [view, setView] = useState('priority');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    reload();
    work.run(child.id).catch(() => {});
  };

  // "No longer needed" for work the family added (teacher work stays the teacher's call - Q1).
  const remove = async () => {
    setBusy(true);
    try {
      await supportService.withdrawWork(child.id, removing.id);
      toast.success(`Taken off ${first}’s plan`);
      setRemoving(null);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="td-page pl-page">
      <PageHeader
        title="Schedule"
        description={`${first}’s plan: what’s next, all their work from every source, and their study times.`}
        actions={
          <div className="pl-row">
            <Button as={Link} to="/parent/schedule/study-times" variant="secondary" startIcon={<LuCalendarClock aria-hidden="true" />}>
              Study times
            </Button>
            <Button type="button" startIcon={<LuPlus aria-hidden="true" />} onClick={() => setAdding(true)}>
              Add work for {first}
            </Button>
          </div>
        }
      />

      <PlanNotices plan={plan} studyTimesHref="/parent/schedule/study-times" viewer="parent" />
      <PendingIntakes studentId={child.id} onChanged={refresh} />

      <div className="pl-grid">
        <section className="pl-card" aria-labelledby="pl-all-title">
          <div className="pl-card__head">
            <div>
              <h2 id="pl-all-title" className="pl-card__title">
                All work
              </h2>
              <p className="pl-card__sub">Teacher work and anything {first} or you added.</p>
            </div>
          </div>
          <div className="pl-segment" role="group" aria-label="Show work by" style={{ marginBottom: 12 }}>
            {VIEWS.map((v) => (
              <button key={v.key} type="button" aria-pressed={view === v.key} onClick={() => setView(v.key)}>
                {v.label}
              </button>
            ))}
          </div>
          {view === 'priority' ? (
            error && !plan ? (
              <ErrorState error={error} onRetry={reload} variant="compact" />
            ) : isLoading ? (
              <p className="pl-muted">Loading…</p>
            ) : (
              <PriorityList plan={plan} />
            )
          ) : work.error && !work.data ? (
            <ErrorState error={work.error} onRetry={() => work.run(child.id).catch(() => {})} variant="compact" />
          ) : !work.data ? (
            <p className="pl-muted">Loading…</p>
          ) : (
            <>
              <WorkList
                work={work.data}
                today={plan?.today}
                groupBy={view}
                viewer="parent"
                onOpen={(w) => (w.source !== 'teacher' ? setRemoving(w) : undefined)}
              />
              <p className="pl-muted">Select work you or {first} added to take it off the plan.</p>
            </>
          )}
        </section>

        <div className="pl-stack">
          <NextActionsCard plan={plan} isLoading={isLoading} error={error} onRetry={reload} canStart={false} title="Coming up" />
          <SupportSummaryCard studentId={child.id} firstName={first} />
        </div>
      </div>

      <ConfirmationModal
        isOpen={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        loading={busy}
        title="Is this no longer needed?"
        message={removing ? `“${removing.title}” will come off ${first}’s plan and list. Anything already done on it is kept.` : ''}
        confirmLabel="Take it off"
      />

      <AddWorkDialog
        isOpen={adding}
        onClose={() => setAdding(false)}
        onAdded={refresh}
        studentId={child.id}
        childName={first}
      />
    </div>
  );
}

/**
 * /parent/schedule - the child picked in the sidebar: their plan, all their
 * work (teacher, own and parent-added, with who added it - PDF Q15), and
 * adding work for them. Aggregate only: no AI conversations here.
 */
export default function ParentSchedulePage() {
  const { viewingChild, children, isLoading } = useViewingChild();
  if (!children.length && !isLoading) {
    return (
      <div className="td-page">
        <PageHeader title="Schedule" />
        <EmptyState
          title="No children on your account yet"
          description="Once you add a child, their plan shows up here."
          action={
            <Button as={Link} to="/parent/children">
              Go to My Children
            </Button>
          }
        />
      </div>
    );
  }
  if (!viewingChild) return <Loader message="Loading the schedule…" />;
  // Keyed: switching child in the sidebar starts clean.
  return <ChildSchedule key={viewingChild.id} child={viewingChild} />;
}
