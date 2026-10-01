import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuCalendarClock, LuChevronLeft, LuChevronRight, LuPlus, LuSlidersHorizontal } from 'react-icons/lu';
import { Button, ConfirmationModal, EmptyState, ErrorState, Loader, Modal, PageHeader } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { addDaysToKey, formatDateKey, formatDateKeyRange, getDateKey, weekdayOfKey } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import SupportSummaryCard from '../components/SupportSummaryCard';
import supportService from '../services/support.service';
import { useViewingChild } from '../../parent/hooks/useViewingChild';
import AddWorkDialog from '../components/AddWorkDialog';
import NextActionsCard from '../components/NextActionsCard';
import PendingIntakes from '../components/PendingIntakes';
import PlanNotices from '../components/PlanNotices';
import ScheduleWeek from '../components/schoolwork/ScheduleWeek';
import SchoolworkBoard from '../components/schoolwork/SchoolworkBoard';
import SchoolworkList from '../components/schoolwork/SchoolworkList';
import SchoolworkPreferences from '../components/schoolwork/SchoolworkPreferences';
import ViewSwitcher from '../components/schoolwork/ViewSwitcher';
import WorkNoteDialog from '../components/schoolwork/WorkNoteDialog';
import { usePlan } from '../hooks/usePlan';
import { useSchoolwork } from '../hooks/useSchoolwork';
import { useSchoolworkSettings } from '../hooks/useSchoolworkSettings';
import { weekKeys } from '../schoolwork';
import '../planner.css';
import '../components/schoolwork/schoolwork.css';

/** A parent moves only the work a parent added; everything else is the child's (the server enforces it too). */
const parentMay = (work) => work.source === 'parent';

function ChildSchedule({ child }) {
  const first = child.firstName ?? formatName(child);
  const whose = `${first}’s`;
  const { plan, isLoading, error, reload } = usePlan(child.id);
  const settings = useSchoolworkSettings(child.id);
  const { preferences, colorOf } = settings;
  const [chosenView, setChosenView] = useState(null);
  const view = chosenView ?? preferences.defaultView;
  const [order, setOrder] = useState('priority');
  const [customizing, setCustomizing] = useState(false);
  const [openWork, setOpenWork] = useState(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  // The child's own days (they may be in another time zone than the parent).
  const todayKey = plan?.today ?? getDateKey();
  const [weekOffset, setWeekOffset] = useState(0);
  const thisWeek = addDaysToKey(todayKey, -weekdayOfKey(todayKey));
  const weekStartKey = addDaysToKey(thisWeek, weekOffset * 7);
  const weekEndKey = addDaysToKey(weekStartKey, 6);
  const week = usePlan(child.id, { from: weekStartKey, to: weekEndKey });

  const schoolwork = useSchoolwork(child.id, {
    onChanged: () => {
      reload();
      week.reload();
    },
  });

  const refresh = () => {
    reload();
    week.reload();
    schoolwork.reload();
  };

  // "No longer needed" for work the family added (teacher work stays the teacher's call - Q1).
  const remove = async () => {
    setBusy(true);
    try {
      await supportService.withdrawWork(child.id, removing.id);
      toast.success(`Taken off ${whose} plan`);
      setRemoving(null);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const workView = (content) =>
    schoolwork.error && !schoolwork.loaded ? (
      <ErrorState error={schoolwork.error} onRetry={schoolwork.reload} variant="compact" />
    ) : !schoolwork.loaded ? (
      <p className="pl-muted">Loading…</p>
    ) : (
      content
    );

  return (
    <div className="td-page pl-page">
      <PageHeader
        title="Schedule"
        description={`${whose} schoolwork - the same plan ${first} sees, as sticky notes, a list or a calendar with their study times and plans.`}
        actions={
          <div className="pl-row">
            <Button type="button" variant="secondary" startIcon={<LuSlidersHorizontal aria-hidden="true" />} onClick={() => setCustomizing(true)}>
              Customize
            </Button>
            <Button as={Link} to="/parent/schedule/study-times" variant="secondary" startIcon={<LuCalendarClock aria-hidden="true" />}>
              Study & busy times
            </Button>
            <Button type="button" startIcon={<LuPlus aria-hidden="true" />} onClick={() => setAdding(true)}>
              Add work for {first}
            </Button>
          </div>
        }
      />

      <PlanNotices plan={plan} studyTimesHref="/parent/schedule/study-times" viewer="parent" />
      <PendingIntakes studentId={child.id} onChanged={refresh} />

      <div className="sw-heading">
        <ViewSwitcher value={view} onChange={setChosenView} label={`Show ${whose} schoolwork as`} />
        <p className="sw-heading__date">
          {first}’s today · {formatDateKey(todayKey, { weekday: 'long', month: 'long', day: 'numeric', year: undefined })}
        </p>
      </div>

      {view === 'board' ? (
        <section className="pl-card" aria-label="Sticky notes">
          {workView(
            <SchoolworkBoard
              work={schoolwork.work}
              priorities={plan?.priorities ?? []}
              today={todayKey}
              colorOf={colorOf}
              preferences={preferences}
              personalEvents={plan?.personalEvents ?? []}
              canMove={parentMay}
              busyId={schoolwork.busyId}
              onOpen={setOpenWork}
              onMove={schoolwork.move}
              onHandIn={() => {}}
            />
          )}
          <p className="pl-muted" style={{ marginBottom: 0 }}>
            {first} moves their own notes. You can move work you added, or take it off the plan.
          </p>
        </section>
      ) : (
        <div className="pl-grid">
          {view === 'list' ? (
            <section className="pl-card" aria-label="List">
              {workView(
                <SchoolworkList
                  work={schoolwork.work}
                  priorities={plan?.priorities ?? []}
                  today={todayKey}
                  colorOf={colorOf}
                  preferences={preferences}
                  personalEvents={plan?.personalEvents ?? []}
                  order={order}
                  onOrderChange={setOrder}
                  canMove={parentMay}
                  busyId={schoolwork.busyId}
                  viewer="parent"
                  onOpen={setOpenWork}
                  onMove={schoolwork.move}
                  onHandIn={() => {}}
                />
              )}
            </section>
          ) : (
            <section className="pl-card" aria-label="Calendar">
              <div className="pl-card__head">
                <div className="pl-row">
                  <Button type="button" variant="secondary" size="sm" aria-label="Previous week" onClick={() => setWeekOffset((w) => w - 1)}>
                    <LuChevronLeft aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
                    This week
                  </Button>
                  <Button type="button" variant="secondary" size="sm" aria-label="Next week" onClick={() => setWeekOffset((w) => w + 1)}>
                    <LuChevronRight aria-hidden="true" />
                  </Button>
                </div>
                <p className="pl-card__sub" style={{ margin: 0 }}>
                  {formatDateKeyRange(weekStartKey, weekEndKey)}
                </p>
              </div>
              {week.error && !week.plan ? (
                <ErrorState error={week.error} onRetry={week.reload} variant="compact" />
              ) : !week.plan ? (
                <p className="pl-muted">Loading…</p>
              ) : (
                <ScheduleWeek
                  days={weekKeys(weekStartKey, 7)}
                  plan={week.plan}
                  work={schoolwork.work}
                  colorOf={colorOf}
                  showTypeIcons={preferences.showTypeIcons}
                  onOpenWork={setOpenWork}
                />
              )}
            </section>
          )}

          <div className="pl-stack">
            <NextActionsCard plan={plan} isLoading={isLoading} error={error} onRetry={reload} canStart={false} title="Coming up" />
            <SupportSummaryCard studentId={child.id} firstName={first} />
          </div>
        </div>
      )}

      <Modal isOpen={customizing} onClose={() => setCustomizing(false)} title={`Customize ${whose} Growing Focus`} size="md">
        {customizing && <SchoolworkPreferences store={settings} whose={whose} idPrefix="child-prefs" />}
      </Modal>

      <WorkNoteDialog
        key={openWork?.id ?? 'closed'}
        work={openWork}
        today={todayKey}
        colorOf={colorOf}
        preferences={preferences}
        viewer="parent"
        movable={Boolean(openWork && parentMay(openWork))}
        busy={schoolwork.busyId === openWork?.id}
        onClose={() => setOpenWork(null)}
        onMove={async (w, to) => {
          setOpenWork(null);
          await schoolwork.move(w, to);
        }}
        onRemove={
          openWork && openWork.source !== 'teacher' && openWork.progress !== 'done'
            ? (w) => {
                setOpenWork(null);
                setRemoving(w);
              }
            : undefined
        }
      />

      <ConfirmationModal
        isOpen={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        loading={busy}
        title="Is this no longer needed?"
        message={removing ? `“${removing.title}” will come off ${whose} plan and list. Anything already done on it is kept.` : ''}
        confirmLabel="Take it off"
      />

      <AddWorkDialog isOpen={adding} onClose={() => setAdding(false)} onAdded={refresh} studentId={child.id} childName={first} />
    </div>
  );
}

/**
 * /parent/schedule - the child picked in the sidebar: their schoolwork as
 * sticky notes, a list or a calendar (the same plan they see, in their
 * subject colours), what's coming up, adding work for them, and their view
 * settings (PDF: "the student or parent could have a simple settings
 * screen"). Aggregate only: no AI conversations here.
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
