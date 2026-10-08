import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuChevronLeft, LuChevronRight, LuPlus } from 'react-icons/lu';
import { ErrorState, Modal } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import AddWorkDialog from '../../planner/components/AddWorkDialog';
import PendingIntakes from '../../planner/components/PendingIntakes';
import PlanNotices from '../../planner/components/PlanNotices';
import StudyBlockDialog from '../../planner/components/StudyBlockDialog';
import SchoolworkBoard from '../../planner/components/schoolwork/SchoolworkBoard';
import SchoolworkList from '../../planner/components/schoolwork/SchoolworkList';
import SchoolworkPreferences from '../../planner/components/schoolwork/SchoolworkPreferences';
import SortMenu from '../../planner/components/schoolwork/SortMenu';
import ViewSwitcher from '../../planner/components/schoolwork/ViewSwitcher';
import WorkNoteDialog from '../../planner/components/schoolwork/WorkNoteDialog';
import { usePlan } from '../../planner/hooks/usePlan';
import { useSchoolwork } from '../../planner/hooks/useSchoolwork';
import { useSchoolworkSettings } from '../../planner/hooks/useSchoolworkSettings';
import { blocksByDay } from '../../planner/planView';
import { DEFAULT_SORT, blockStats, eventsByDay, sortBlocks, sortOptionsFor } from '../../planner/schoolwork';
import planService from '../../planner/services/plan.service';
import '../../planner/planner.css';
import '../../planner/components/schoolwork/schoolwork.css';
import OwnTaskModal from '../components/home/OwnTaskModal';
import '../components/home/studentHome.css';
import PlanDayColumn from '../components/plan/PlanDayColumn';
import PlanMonthPicker from '../components/plan/PlanMonthPicker';
import { DueSoonCard, NothingPlannedCard, PlanMoreLinks, WeekSummaryCard } from '../components/plan/PlanSideCards';
import '../components/plan/studentPlan.css';
import focusService from '../services/focus.service';
import { useTodayTasks } from '../hooks/useTodayTasks';
import { addDaysToKey, formatDateKey, formatDateKeyRange, getDateKey, weekdayOfKey } from '../../../utils/date';

const byTitle = (a, b) => Number(a.done) - Number(b.done) || a.title.localeCompare(b.title);

/**
 * Grade 6+ "Plan" (/student/calendar), built to the Plan mockups: the same
 * server plan three ways - Board, List, Calendar - one chosen on "Customize
 * views" (or Settings) and switchable any time, a Sort menu for the order in
 * every view, "+ Add assignment", and the rail ("This week", "Due soon").
 *
 *   Board     every piece of work as a taped note in its subject's colour, in
 *             To do / Doing / Done (moving one changes its real status: drag
 *             it, or open it); "+ Add assignment" under To do
 *   List      "Up next" (Start on the first) and "Finished"; tick own work
 *   Calendar  the week (or a day) of study times the planner placed, as cards
 *             with Start, what is due each day, personal activities, Add and
 *             each day's tally; a month picker jumps to any day
 *
 * "This week" counts the week's study steps; with none planned it becomes
 * "Nothing planned yet" (add work, or spread the steps already there). Every
 * date is a day key in the student's own zone; times come from the plan.
 */
export default function StudentPlanPage() {
  const plan = useTodayTasks();
  const navigate = useNavigate();
  const todayKey = getDateKey();
  const settings = useSchoolworkSettings('me');
  const { preferences, colorOf } = settings;

  // null = the view they chose in Customize; a click here switches for now.
  const [chosenView, setChosenView] = useState(null);
  const view = chosenView ?? preferences.defaultView;
  const [sorts, setSorts] = useState(DEFAULT_SORT);
  const sort = sorts[view] ?? 'plan';
  const [customizing, setCustomizing] = useState(false);
  const [openWork, setOpenWork] = useState(null);
  const [spreading, setSpreading] = useState(false);

  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [viewMode, setViewMode] = useState('week');
  // Own-task details: null = closed, else { mode: 'edit', task }.
  const [taskDialog, setTaskDialog] = useState(null);
  // Add work: null = closed, else { dueDate }.
  const [adding, setAdding] = useState(null);
  const [openBlock, setOpenBlock] = useState(null);

  const weekStartKey = addDaysToKey(selectedKey, -weekdayOfKey(selectedKey));
  const weekEndKey = addDaysToKey(weekStartKey, 6);

  const schedule = usePlan('me', { from: weekStartKey, to: weekEndKey });
  const weekBlocks = useMemo(() => schedule.plan?.blocks ?? [], [schedule.plan]);
  const blocks = useMemo(() => blocksByDay(weekBlocks), [weekBlocks]);
  const events = useMemo(() => eventsByDay(schedule.plan?.personalEvents ?? []), [schedule.plan]);

  const refreshPlans = () => {
    plan.reload();
    schedule.reload();
  };
  const schoolwork = useSchoolwork('me', { onChanged: refreshPlans });
  const refresh = () => {
    refreshPlans();
    schoolwork.reload();
  };

  const byDay = useMemo(() => {
    const map = new Map();
    plan.all.forEach((task) => {
      if (!task.dueDate) return;
      const key = String(task.dueDate).slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(task);
    });
    map.forEach((list) => list.sort(byTitle));
    return map;
  }, [plan.all]);

  // The month picker: days with work due (dots) and days holding overdue work.
  const counts = useMemo(() => {
    const map = new Map();
    byDay.forEach((list, key) => {
      map.set(key, { total: list.length, overdue: key < todayKey && list.some((t) => !t.done) });
    });
    return map;
  }, [byDay, todayKey]);

  const weekKeys = Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStartKey, i));
  const weekDue = weekKeys.flatMap((k) => byDay.get(k) ?? []).filter((t) => !t.done).length;
  const weekStats = blockStats(weekBlocks);
  const hasPlannedWeek = weekBlocks.length > 0;
  const openWorkCount = schoolwork.work.filter((w) => w.progress !== 'done').length;

  const dueSoon = useMemo(
    () =>
      plan.all
        .filter((t) => !t.done && t.dueDate)
        .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)) || a.title.localeCompare(b.title)),
    [plan.all]
  );

  // A study time's work: its due day (the calendar's "Due date" sort) and whether a teacher set it.
  const workById = useMemo(() => new Map(schoolwork.work.map((w) => [w.id, w])), [schoolwork.work]);
  const dueOf = (assignmentId) => workById.get(assignmentId)?.dueDate ?? null;
  const isTeacherWork = (assignmentId) => workById.get(assignmentId)?.kind === 'teacher';

  const step = viewMode === 'week' ? 7 : 1;
  const shownDays = viewMode === 'week' ? weekKeys : [selectedKey];
  const rangeLabel =
    viewMode === 'week'
      ? formatDateKeyRange(weekStartKey, weekEndKey)
      : formatDateKey(selectedKey, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const openOwnTask = (task) => setTaskDialog({ mode: 'edit', task: task.raw });
  const addTask = (dueDate) => setAdding({ dueDate });
  const addFromToolbar = () => addTask(selectedKey >= todayKey ? selectedKey : todayKey);
  const openAssignment = (work) => navigate(`/student/assignments/${work.id}`);
  const startWork = (work) => navigate(`/student/focus?assignment=${encodeURIComponent(work.id)}`);
  const editWork = (work) => {
    setOpenWork(null);
    if (work.kind === 'teacher') return openAssignment(work);
    const own = plan.all.find((t) => t.type === 'own' && t.id === work.id);
    if (own) openOwnTask(own);
    return undefined;
  };
  const moveFromDialog = async (work, to) => {
    setOpenWork(null);
    await schoolwork.move(work, to);
  };
  const spreadSteps = async () => {
    setSpreading(true);
    try {
      await planService.replan('me');
      toast.success('Planning your week - your steps will appear in a moment.');
      schedule.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSpreading(false);
    }
  };

  const priorities = schedule.plan?.priorities ?? plan.schedule?.priorities ?? [];
  const upcomingPersonal = plan.schedule?.personalEvents ?? schedule.plan?.personalEvents ?? [];
  const waitingForSettings = !settings.loaded && settings.isLoading;

  const workView = (content) =>
    schoolwork.error && !schoolwork.loaded ? (
      <ErrorState error={schoolwork.error} onRetry={schoolwork.reload} variant="compact" />
    ) : !schoolwork.loaded ? (
      <div className="sp-skeleton" aria-hidden="true" style={{ minHeight: 240 }} />
    ) : (
      content
    );

  let main;
  if (waitingForSettings) {
    main = <div className="sp-skeleton" aria-hidden="true" style={{ minHeight: 240 }} />;
  } else if (view === 'board') {
    main = (
      <section className="sp-main" aria-label="Board">
        {workView(
          <SchoolworkBoard
            work={schoolwork.work}
            priorities={priorities}
            sort={sort}
            today={todayKey}
            colorOf={colorOf}
            preferences={preferences}
            personalEvents={upcomingPersonal}
            busyId={schoolwork.busyId}
            columnLabels={{ todo: 'To do' }}
            onAdd={addFromToolbar}
            onOpen={setOpenWork}
            onMove={schoolwork.move}
            onHandIn={openAssignment}
          />
        )}
      </section>
    );
  } else if (view === 'list') {
    main = (
      <section className="sp-main" aria-label="List">
        {workView(
          <SchoolworkList
            work={schoolwork.work}
            priorities={priorities}
            sort={sort}
            today={todayKey}
            colorOf={colorOf}
            preferences={preferences}
            personalEvents={upcomingPersonal}
            busyId={schoolwork.busyId}
            onOpen={setOpenWork}
            onMove={schoolwork.move}
            onHandIn={openAssignment}
            onStart={startWork}
          />
        )}
      </section>
    );
  } else {
    main =
      schedule.error && !schedule.plan ? (
        <ErrorState error={schedule.error} onRetry={schedule.reload} />
      ) : (
        <section className="sp-main" aria-label="Calendar">
          <div className="sp-board" data-view={viewMode}>
            {shownDays.map((key) => (
              <PlanDayColumn
                key={key}
                dayKey={key}
                layout={viewMode}
                todayKey={todayKey}
                selectedKey={selectedKey}
                isLoading={schedule.isLoading}
                blocks={sortBlocks(blocks.get(key) ?? [], sort, dueOf)}
                inTimeOrder={sort === 'plan'}
                due={byDay.get(key) ?? []}
                events={events.get(key) ?? []}
                timeZone={schedule.plan?.timezone}
                colorOf={colorOf}
                isTeacherWork={isTeacherWork}
                onOpenBlock={setOpenBlock}
                onPickDay={(k) => {
                  setSelectedKey(k);
                  setViewMode('day');
                }}
                onAdd={addTask}
                onOpenOwn={openOwnTask}
                onNextWeek={() => setSelectedKey(addDaysToKey(weekStartKey, 7))}
              />
            ))}
          </div>
        </section>
      );
  }

  return (
    <div className="sh-page sp-page td-page" data-view={view}>
      <header className="sp-header">
        <h1 className="sp-header__title">Plan</h1>
        <p className="sp-header__summary">Your week, one step at a time.</p>
      </header>

      <div className="sp-toolbar sp-toolbar--views">
        <ViewSwitcher value={view} onChange={setChosenView} look="pill" labels={{ board: 'Board' }} label="Show my plan as" />
        <div className="sp-toolbar__actions">
          <SortMenu value={sort} options={sortOptionsFor(view)} onChange={(key) => setSorts((s) => ({ ...s, [view]: key }))} />
          <button type="button" className="sp-primary sp-toolbar__add" onClick={addFromToolbar}>
            <LuPlus size={16} aria-hidden="true" /> Add assignment
          </button>
        </div>
      </div>

      {view === 'calendar' && (
        <div className="sp-toolbar sp-toolbar--calendar">
          <div className="sp-toolbar__nav">
            <button
              type="button"
              className="sp-iconbtn"
              onClick={() => setSelectedKey((k) => addDaysToKey(k, -step))}
              aria-label={viewMode === 'week' ? 'Previous week' : 'Previous day'}
            >
              <LuChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" className="sp-textbtn" onClick={() => setSelectedKey(todayKey)} disabled={selectedKey === todayKey}>
              Today
            </button>
            <button
              type="button"
              className="sp-iconbtn"
              onClick={() => setSelectedKey((k) => addDaysToKey(k, step))}
              aria-label={viewMode === 'week' ? 'Next week' : 'Next day'}
            >
              <LuChevronRight size={18} aria-hidden="true" />
            </button>
            <PlanMonthPicker label={rangeLabel} selectedKey={selectedKey} todayKey={todayKey} counts={counts} onPick={setSelectedKey} />
          </div>
          <div className="sp-segment" role="group" aria-label="Calendar range">
            {['week', 'day'].map((mode) => (
              <button key={mode} type="button" aria-pressed={viewMode === mode} onClick={() => setViewMode(mode)}>
                {mode === 'week' ? 'Week' : 'Day'}
              </button>
            ))}
          </div>
        </div>
      )}

      <PlanNotices plan={schedule.plan} studyTimesHref="/student/study-times" />
      <PendingIntakes onChanged={refresh} />

      <div className="sp-grid" data-view={view}>
        {main}
        <aside className="sp-side" aria-label="This week">
          {schedule.isLoading || hasPlannedWeek ? (
            <WeekSummaryCard total={weekStats.total} done={weekStats.done} dueCount={weekDue} minutes={weekStats.minutes} isLoading={schedule.isLoading} />
          ) : (
            <NothingPlannedCard canSpread={openWorkCount > 0} spreading={spreading || Boolean(schedule.plan?.updating)} onAdd={addFromToolbar} onSpread={spreadSteps} />
          )}
          <DueSoonCard tasks={dueSoon} isLoading={plan.isLoading} onOpenOwn={openOwnTask} />
          <PlanMoreLinks onCustomize={() => setCustomizing(true)} />
        </aside>
      </div>

      <Modal isOpen={customizing} onClose={() => setCustomizing(false)} title="Customize My Growing Focus" size="md">
        {customizing && <SchoolworkPreferences store={settings} idPrefix="plan-prefs" />}
      </Modal>

      <WorkNoteDialog
        key={openWork?.id ?? 'closed'}
        work={openWork}
        today={todayKey}
        colorOf={colorOf}
        preferences={preferences}
        movable
        busy={schoolwork.busyId === openWork?.id}
        loadSteps={focusService.listSteps}
        onClose={() => setOpenWork(null)}
        onMove={moveFromDialog}
        onHandIn={(w) => {
          setOpenWork(null);
          openAssignment(w);
        }}
        onOpenPage={editWork}
        onFocus={(w) => {
          setOpenWork(null);
          startWork(w);
        }}
      />
      <OwnTaskModal mode={taskDialog?.mode ?? null} task={taskDialog?.task ?? null} onClose={() => setTaskDialog(null)} onChanged={refresh} />
      <AddWorkDialog
        key={adding ? `add-${adding.dueDate}` : 'closed'}
        isOpen={Boolean(adding)}
        method="quick"
        defaultDueDate={adding?.dueDate}
        onClose={() => setAdding(null)}
        onAdded={refresh}
      />
      <StudyBlockDialog block={openBlock} plan={schedule.plan} onClose={() => setOpenBlock(null)} onSaved={refresh} />
    </div>
  );
}
