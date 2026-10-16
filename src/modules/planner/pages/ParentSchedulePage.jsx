import { useMemo, useState } from 'react';
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
import SchoolworkBoard from '../components/schoolwork/SchoolworkBoard';
import SchoolworkList from '../components/schoolwork/SchoolworkList';
import SchoolworkPreferences from '../components/schoolwork/SchoolworkPreferences';
import ViewSwitcher from '../components/schoolwork/ViewSwitcher';
import WorkNoteDialog from '../components/schoolwork/WorkNoteDialog';
import { usePlan } from '../hooks/usePlan';
import { useSchoolwork } from '../hooks/useSchoolwork';
import { useSchoolworkSettings } from '../hooks/useSchoolworkSettings';
import { blocksByDay } from '../planView';
import { eventsByDay, sortBlocks, weekKeys } from '../schoolwork';
import PlanDayColumn from '../../student/components/plan/PlanDayColumn';
import PlanMonthPicker from '../../student/components/plan/PlanMonthPicker';
import '../planner.css';
import '../components/schoolwork/schoolwork.css';
import '../../student/components/plan/studentPlan.css';

/** A parent moves only the work a parent added; everything else is the child's (the server enforces it too). */
const parentMay = (work) => work.source === 'parent';

function ChildSchedule({ child }) {
  const first = child.firstName ?? formatName(child);
  // "Type it" can add the work for any of the family's (not archived) children.
  const { children: family = [] } = useViewingChild();
  const childOptions = useMemo(
    () => family.filter((c) => !c.archived).map((c) => ({ value: c.id, label: c.firstName ?? formatName(c) })),
    [family]
  );
  const whose = `${first}’s`;
  const { plan, isLoading, error, reload } = usePlan(child.id);
  const settings = useSchoolworkSettings(child.id);
  const { preferences, colorOf } = settings;
  const [chosenView, setChosenView] = useState(null);
  const view = chosenView ?? preferences.defaultView;
  const [order, setOrder] = useState('priority');
  const [customizing, setCustomizing] = useState(false);
  const [openWork, setOpenWork] = useState(null);
  // Add work: null = closed, else { dueDate } (a day's "+ Add" opens straight on Type it for that day).
  const [adding, setAdding] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  // The child's own days (they may be in another time zone than the parent).
  const todayKey = plan?.today ?? getDateKey();
  // The calendar works like the child's own (student Plan page): a picked day
  // (null = the child's today), shown as its week or alone.
  const [pickedKey, setPickedKey] = useState(null);
  const selectedKey = pickedKey ?? todayKey;
  const [viewMode, setViewMode] = useState('week');
  const weekStartKey = addDaysToKey(selectedKey, -weekdayOfKey(selectedKey));
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

  // The calendar's pieces, the same as on the child's Plan page: study times
  // and personal plans per day, and what is due each day (from the work list).
  const blocks = useMemo(() => blocksByDay(week.plan?.blocks ?? []), [week.plan]);
  const events = useMemo(() => eventsByDay(week.plan?.personalEvents ?? []), [week.plan]);
  const workById = useMemo(() => new Map(schoolwork.work.map((w) => [w.id, w])), [schoolwork.work]);
  const dueByDay = useMemo(() => {
    const map = new Map();
    for (const w of schoolwork.work) {
      if (!w.dueDate) continue;
      const key = String(w.dueDate).slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ key: w.id, title: w.title, done: w.progress === 'done', work: w });
    }
    return map;
  }, [schoolwork.work]);
  // The month picker: days with work due (dots) and days holding overdue work.
  const dueCounts = useMemo(() => {
    const map = new Map();
    dueByDay.forEach((list, key) => map.set(key, { total: list.length, overdue: key < todayKey && list.some((t) => !t.done) }));
    return map;
  }, [dueByDay, todayKey]);
  const step = viewMode === 'week' ? 7 : 1;
  const shownDays = viewMode === 'week' ? weekKeys(weekStartKey, 7) : [selectedKey];
  const rangeLabel =
    viewMode === 'week'
      ? formatDateKeyRange(weekStartKey, weekEndKey)
      : formatDateKey(selectedKey, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

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
            <Button type="button" startIcon={<LuPlus aria-hidden="true" />} onClick={() => setAdding({})}>
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
              showActions
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
        // The calendar takes the width and a narrow rail, like the child's Plan page (it drops below under 1100px).
        <div className={view === 'calendar' ? 'sp-grid' : 'pl-grid'}>
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
            // The child's own calendar (student Plan page): ‹ Today › and a month
            // picker, Week / Day, day columns with study-time cards (read-only: no
            // Start), what is due, personal plans, + Add for that day and each
            // day's tally. A day's header opens it on its own.
            <section className="sp-cal" aria-label="Calendar">
              <div className="sp-toolbar sp-toolbar--calendar">
                <div className="sp-toolbar__nav">
                  <button
                    type="button"
                    className="sp-iconbtn"
                    onClick={() => setPickedKey(addDaysToKey(selectedKey, -step))}
                    aria-label={viewMode === 'week' ? 'Previous week' : 'Previous day'}
                  >
                    <LuChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <button type="button" className="sp-textbtn" onClick={() => setPickedKey(null)} disabled={selectedKey === todayKey}>
                    Today
                  </button>
                  <button
                    type="button"
                    className="sp-iconbtn"
                    onClick={() => setPickedKey(addDaysToKey(selectedKey, step))}
                    aria-label={viewMode === 'week' ? 'Next week' : 'Next day'}
                  >
                    <LuChevronRight size={18} aria-hidden="true" />
                  </button>
                  <PlanMonthPicker label={rangeLabel} selectedKey={selectedKey} todayKey={todayKey} counts={dueCounts} onPick={setPickedKey} />
                </div>
                <div className="sp-segment" role="group" aria-label="Calendar range">
                  {['week', 'day'].map((mode) => (
                    <button key={mode} type="button" aria-pressed={viewMode === mode} onClick={() => setViewMode(mode)}>
                      {mode === 'week' ? 'Week' : 'Day'}
                    </button>
                  ))}
                </div>
              </div>
              {week.error && !week.plan ? (
                <ErrorState error={week.error} onRetry={week.reload} variant="compact" />
              ) : (
                <div className="sp-board" data-view={viewMode}>
                  {shownDays.map((key) => (
                    <PlanDayColumn
                      key={key}
                      dayKey={key}
                      layout={viewMode}
                      todayKey={todayKey}
                      selectedKey={selectedKey}
                      isLoading={!week.plan}
                      blocks={sortBlocks(blocks.get(key) ?? [], 'plan')}
                      inTimeOrder
                      due={dueByDay.get(key) ?? []}
                      events={events.get(key) ?? []}
                      timeZone={week.plan?.timezone}
                      colorOf={colorOf}
                      isTeacherWork={(assignmentId) => workById.get(assignmentId)?.kind === 'teacher'}
                      onPickDay={(k) => {
                        setPickedKey(k);
                        setViewMode('day');
                      }}
                      onAdd={(dueDate) => setAdding({ dueDate })}
                      onOpenDue={(task) => setOpenWork(task.work)}
                      onNextWeek={() => setPickedKey(addDaysToKey(weekStartKey, 7))}
                      viewer="parent"
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          <div className={view === 'calendar' ? 'pl-stack sp-side' : 'pl-stack'}>
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

      <AddWorkDialog
        key={adding ? `add-${adding.dueDate ?? 'any'}` : 'closed'}
        isOpen={Boolean(adding)}
        method={adding?.dueDate ? 'quick' : null}
        defaultDueDate={adding?.dueDate}
        onClose={() => setAdding(null)}
        onAdded={refresh}
        studentId={child.id}
        childName={first}
        childOptions={childOptions}
      />
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
