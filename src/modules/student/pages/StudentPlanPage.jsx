import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuCalendarClock, LuChevronLeft, LuChevronRight, LuPlus, LuSlidersHorizontal } from 'react-icons/lu';
import { ErrorState, Modal } from '../../../components/common';
import AddWorkDialog from '../../planner/components/AddWorkDialog';
import PendingIntakes from '../../planner/components/PendingIntakes';
import PlanNotices from '../../planner/components/PlanNotices';
import StudyBlockDialog from '../../planner/components/StudyBlockDialog';
import SchoolworkBoard from '../../planner/components/schoolwork/SchoolworkBoard';
import SchoolworkList from '../../planner/components/schoolwork/SchoolworkList';
import SchoolworkPreferences from '../../planner/components/schoolwork/SchoolworkPreferences';
import ViewSwitcher from '../../planner/components/schoolwork/ViewSwitcher';
import WorkNoteDialog from '../../planner/components/schoolwork/WorkNoteDialog';
import { usePlan } from '../../planner/hooks/usePlan';
import { useSchoolwork } from '../../planner/hooks/useSchoolwork';
import { useSchoolworkSettings } from '../../planner/hooks/useSchoolworkSettings';
import { blocksByDay } from '../../planner/planView';
import { eventsByDay } from '../../planner/schoolwork';
import '../../planner/planner.css';
import '../../planner/components/schoolwork/schoolwork.css';
import OwnTaskModal from '../components/home/OwnTaskModal';
import '../components/home/studentHome.css';
import PlanDayColumn from '../components/plan/PlanDayColumn';
import PlanMonthPicker from '../components/plan/PlanMonthPicker';
import { DueSoonCard, WeekSummaryCard } from '../components/plan/PlanSideCards';
import '../components/plan/studentPlan.css';
import focusService from '../services/focus.service';
import { useTodayTasks } from '../hooks/useTodayTasks';
import { addDaysToKey, formatDateKey, formatDateKeyRange, getDateKey, weekdayOfKey } from '../../../utils/date';

const byPlanOrder = (a, b) => Number(a.done) - Number(b.done) || a.title.localeCompare(b.title);

/**
 * Grade 6+ "My Schoolwork" (/student/calendar, nav "Plan") - the same server
 * plan three ways, one chosen on "Customize My Growing Focus" and switchable
 * any time:
 *
 *   Sticky notes  every piece of work as a note in its subject's colour, in
 *                 To Do / Doing / Done (moving one changes its real status);
 *                 open a note to see its steps
 *   List          a checklist, most urgent first (the plan's order: due date
 *                 and urgency); or Next 3 / by due date / by subject
 *   Calendar      the full calendar: the study times the planner placed
 *                 (open one to move or keep it) and personal activities, in
 *                 time order, plus what's due each day - week or day, with a
 *                 month jump
 *
 * Every date is a day key in the student's own zone; times come from the plan.
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
  const [order, setOrder] = useState('priority');
  const [customizing, setCustomizing] = useState(false);
  const [openWork, setOpenWork] = useState(null);

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
  const blocks = useMemo(() => blocksByDay(schedule.plan?.blocks ?? []), [schedule.plan]);
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
    map.forEach((list) => list.sort(byPlanOrder));
    return map;
  }, [plan.all]);

  const counts = useMemo(() => {
    const map = new Map();
    byDay.forEach((list, key) => {
      map.set(key, { total: list.length, overdue: key < todayKey && list.some((t) => !t.done) });
    });
    return map;
  }, [byDay, todayKey]);

  const week = Array.from({ length: 7 }, (_, i) => {
    const key = addDaysToKey(weekStartKey, i);
    return { key, items: byDay.get(key) ?? [] };
  });

  const weekItems = week.flatMap((d) => d.items);
  const weekDone = weekItems.filter((t) => t.done).length;
  const weekDue = weekItems.length - weekDone;
  const weekMinutes = (schedule.plan?.blocks ?? []).filter((b) => b.status !== 'missed').reduce((sum, b) => sum + (b.minutes ?? 0), 0);

  const dueSoon = useMemo(
    () =>
      plan.all
        .filter((t) => !t.done && t.dueDate)
        .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)) || a.title.localeCompare(b.title)),
    [plan.all]
  );

  // Subjects studied this week, for the calendar's colour key.
  const weekSubjects = useMemo(
    () => [...new Set((schedule.plan?.blocks ?? []).map((b) => b.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [schedule.plan]
  );

  const step = viewMode === 'week' ? 7 : 1;
  const shownDays = viewMode === 'week' ? week : week.filter((d) => d.key === selectedKey);
  const rangeLabel =
    viewMode === 'week'
      ? formatDateKeyRange(weekStartKey, weekEndKey)
      : formatDateKey(selectedKey, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const openOwnTask = (task) => setTaskDialog({ mode: 'edit', task: task.raw });
  const addTask = (dueDate) => setAdding({ dueDate });
  const openAssignment = (work) => navigate(`/student/assignments/${work.id}`);
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

  // The priority order and the week's plans come from the plan (today + 2 weeks).
  const priorities = plan.schedule?.priorities ?? schedule.plan?.priorities ?? [];
  const upcomingPersonal = plan.schedule?.personalEvents ?? schedule.plan?.personalEvents ?? [];
  const waitingForSettings = !settings.loaded && settings.isLoading;

  const workView = (content) =>
    schoolwork.error && !schoolwork.loaded ? (
      <ErrorState error={schoolwork.error} onRetry={schoolwork.reload} variant="compact" />
    ) : !schoolwork.loaded ? (
      <p className="pl-muted">Loading your schoolwork…</p>
    ) : (
      content
    );

  return (
    <div className="sh-page sp-page td-page">
      <header className="sp-header">
        <h1 className="sp-header__title">My Schoolwork</h1>
        <p className="sp-header__summary">Today · {formatDateKey(todayKey, { weekday: 'long', month: 'long', day: 'numeric', year: undefined })}</p>
      </header>

      <div className="sp-toolbar">
        <ViewSwitcher value={view} onChange={setChosenView} />
        <div className="sp-toolbar__actions">
          <button type="button" className="pl-link" onClick={() => setCustomizing(true)} aria-haspopup="dialog">
            <LuSlidersHorizontal size={15} aria-hidden="true" /> Customize
          </button>
          <Link className="pl-link" to="/student/study-times">
            <LuCalendarClock size={15} aria-hidden="true" /> Study & busy times
          </Link>
          <button type="button" className="sp-primary" onClick={() => addTask(selectedKey >= todayKey ? selectedKey : todayKey)}>
            <LuPlus size={16} aria-hidden="true" /> Add assignment
          </button>
        </div>
      </div>

      {view === 'calendar' && (
        <div className="sp-toolbar">
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
          <div className="sp-toolbar__actions">
            <div className="sp-segment" role="group" aria-label="Calendar range">
              {['week', 'day'].map((mode) => (
                <button key={mode} type="button" aria-pressed={viewMode === mode} onClick={() => setViewMode(mode)}>
                  {mode === 'week' ? 'Week' : 'Day'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <PlanNotices plan={schedule.plan} studyTimesHref="/student/study-times" />
      <PendingIntakes onChanged={refresh} />

      {waitingForSettings ? (
        <div className="sp-skeleton" aria-hidden="true" style={{ minHeight: 240 }} />
      ) : view === 'board' ? (
        <section className="pl-card" aria-label="Sticky notes">
          {workView(
            <SchoolworkBoard
              work={schoolwork.work}
              priorities={priorities}
              today={todayKey}
              colorOf={colorOf}
              preferences={preferences}
              personalEvents={upcomingPersonal}
              busyId={schoolwork.busyId}
              onOpen={setOpenWork}
              onMove={schoolwork.move}
              onHandIn={openAssignment}
            />
          )}
        </section>
      ) : (
        <div className="sp-grid">
          {view === 'list' ? (
            <section className="pl-card" aria-label="List">
              {workView(
                <SchoolworkList
                  work={schoolwork.work}
                  priorities={priorities}
                  today={todayKey}
                  colorOf={colorOf}
                  preferences={preferences}
                  personalEvents={upcomingPersonal}
                  order={order}
                  onOrderChange={setOrder}
                  busyId={schoolwork.busyId}
                  onOpen={setOpenWork}
                  onMove={schoolwork.move}
                  onHandIn={openAssignment}
                />
              )}
            </section>
          ) : plan.error && !plan.all.length ? (
            <ErrorState error={plan.error} onRetry={plan.reload} />
          ) : (
            <div>
              <div className="sp-board" data-view={viewMode}>
                {shownDays.map((day) => (
                  <PlanDayColumn
                    key={day.key}
                    day={day}
                    layout={viewMode}
                    todayKey={todayKey}
                    selectedKey={selectedKey}
                    isLoading={plan.isLoading}
                    blocks={blocks.get(day.key) ?? []}
                    events={events.get(day.key) ?? []}
                    timeZone={schedule.plan?.timezone}
                    colorOf={colorOf}
                    showTypeIcons={preferences.showTypeIcons}
                    onOpenBlock={setOpenBlock}
                    onPickDay={(key) => {
                      setSelectedKey(key);
                      setViewMode('day');
                    }}
                    onAdd={addTask}
                    onOpenOwn={openOwnTask}
                    onNextWeek={() => setSelectedKey(addDaysToKey(weekStartKey, 7))}
                  />
                ))}
              </div>
              {weekSubjects.length > 0 && (
                <ul className="sw-legend" aria-label="Subject colours this week">
                  {weekSubjects.map((subject) => (
                    <li key={subject}>
                      <span className="sw-legend__swatch" style={colorOf(subject) ? { '--subject-color': colorOf(subject) } : undefined} aria-hidden="true" />
                      {subject}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <aside className="sp-side">
            <WeekSummaryCard total={weekItems.length} done={weekDone} dueCount={weekDue} minutes={weekMinutes} isLoading={plan.isLoading} />
            <DueSoonCard tasks={dueSoon} isLoading={plan.isLoading} onOpenOwn={openOwnTask} />
          </aside>
        </div>
      )}

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
          navigate(`/student/focus?assignment=${w.id}`);
        }}
      />
      <OwnTaskModal
        mode={taskDialog?.mode ?? null}
        task={taskDialog?.task ?? null}
        onClose={() => setTaskDialog(null)}
        onChanged={refresh}
      />
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
