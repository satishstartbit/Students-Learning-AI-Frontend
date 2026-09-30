import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuCalendarClock, LuChevronLeft, LuChevronRight, LuPlus } from 'react-icons/lu';
import { ErrorState } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import AddWorkDialog from '../../planner/components/AddWorkDialog';
import PendingIntakes from '../../planner/components/PendingIntakes';
import PlanNotices from '../../planner/components/PlanNotices';
import PriorityList from '../../planner/components/PriorityList';
import StudyBlockDialog from '../../planner/components/StudyBlockDialog';
import WorkList from '../../planner/components/WorkList';
import { usePlan } from '../../planner/hooks/usePlan';
import { blocksByDay } from '../../planner/planView';
import planService from '../../planner/services/plan.service';
import '../../planner/planner.css';
import OwnTaskModal from '../components/home/OwnTaskModal';
import '../components/home/studentHome.css';
import PlanDayColumn from '../components/plan/PlanDayColumn';
import PlanMonthPicker from '../components/plan/PlanMonthPicker';
import { DueSoonCard, WeekSummaryCard } from '../components/plan/PlanSideCards';
import '../components/plan/studentPlan.css';
import { useTodayTasks } from '../hooks/useTodayTasks';
import { addDaysToKey, formatDateKey, formatDateKeyRange, getDateKey, weekdayOfKey } from '../../../utils/date';

const byPlanOrder = (a, b) => Number(a.done) - Number(b.done) || a.title.localeCompare(b.title);

/** The ways to look at the same plan (PDF Q9). */
const VIEWS = [
  { key: 'calendar', label: 'Calendar' },
  { key: 'next3', label: 'Next 3' },
  { key: 'priority', label: 'Priority' },
  { key: 'due', label: 'Due date' },
  { key: 'subject', label: 'Subject' },
];

/**
 * Grade 6+ "Plan" - built to the Plan mockup, now driven by the server plan.
 *
 *   Calendar   Monday-Sunday (or one day): the study times the planner put on
 *              each day (open one to move it or keep it there), plus what is
 *              due that day. A month calendar jumps around.
 *   Next 3     the three most important things right now, with why.
 *   Priority   everything in priority order: Today / Next / Later.
 *   Due date   all open work by when it's due; Subject: by subject.
 * Every date is a day key in the student's own zone; times come from the plan.
 */
export default function StudentPlanPage() {
  const plan = useTodayTasks();
  const navigate = useNavigate();
  const todayKey = getDateKey();

  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [viewMode, setViewMode] = useState('week');
  const [view, setView] = useState('calendar');
  // Own-task details: null = closed, else { mode: 'edit', task }.
  const [taskDialog, setTaskDialog] = useState(null);
  // Add work: null = closed, else { dueDate }.
  const [adding, setAdding] = useState(null);
  const [openBlock, setOpenBlock] = useState(null);

  const weekStartKey = addDaysToKey(selectedKey, -weekdayOfKey(selectedKey));
  const weekEndKey = addDaysToKey(weekStartKey, 6);

  const schedule = usePlan('me', { from: weekStartKey, to: weekEndKey });
  const work = useApi(planService.listWork, { immediate: true, args: ['me'] });
  const blocks = useMemo(() => blocksByDay(schedule.plan?.blocks ?? []), [schedule.plan]);

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

  const step = viewMode === 'week' ? 7 : 1;
  const shownDays = viewMode === 'week' ? week : week.filter((d) => d.key === selectedKey);
  const rangeLabel =
    viewMode === 'week'
      ? formatDateKeyRange(weekStartKey, weekEndKey)
      : formatDateKey(selectedKey, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const openOwnTask = (task) => setTaskDialog({ mode: 'edit', task: task.raw });
  const addTask = (dueDate) => setAdding({ dueDate });
  const refresh = () => {
    plan.reload();
    schedule.reload();
    work.run('me').catch(() => {});
  };
  const openWork = (w) => {
    const task = plan.all.find((t) => (t.type === 'own' ? t.id : t.assignmentId) === (w.assignmentId ?? w.id));
    if (task?.type === 'own') openOwnTask(task);
    else if (task) navigate(`/student/assignments/${task.assignmentId}`);
  };

  return (
    <div className="sh-page sp-page td-page">
      <header className="sp-header">
        <h1 className="sp-header__title">Plan</h1>
        <p className="sp-header__summary">Your week, one step at a time.</p>
      </header>

      <div className="sp-toolbar">
        <div className="pl-segment" role="group" aria-label="Show plan as">
          {VIEWS.map((v) => (
            <button key={v.key} type="button" aria-pressed={view === v.key} onClick={() => setView(v.key)}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="sp-toolbar__actions">
          <Link className="pl-link" to="/student/study-times">
            <LuCalendarClock size={15} aria-hidden="true" /> Study times
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

      <div className="sp-grid">
        {view === 'calendar' ? (
          plan.error && !plan.all.length ? (
            <ErrorState error={plan.error} onRetry={plan.reload} />
          ) : (
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
                  timeZone={schedule.plan?.timezone}
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
          )
        ) : (
          <section className="pl-card" aria-label={VIEWS.find((v) => v.key === view)?.label}>
            {view === 'next3' || view === 'priority' ? (
              schedule.error && !plan.schedule ? (
                <ErrorState error={schedule.error} onRetry={schedule.reload} variant="compact" />
              ) : !plan.schedule ? (
                <p className="pl-muted">Loading your plan…</p>
              ) : (
                <PriorityList plan={plan.schedule} limit={view === 'next3' ? 3 : undefined} onOpen={openWork} />
              )
            ) : work.error && !work.data ? (
              <ErrorState error={work.error} onRetry={() => work.run('me').catch(() => {})} variant="compact" />
            ) : !work.data ? (
              <p className="pl-muted">Loading your work…</p>
            ) : (
              <WorkList work={work.data} today={todayKey} groupBy={view} onOpen={openWork} />
            )}
          </section>
        )}

        <aside className="sp-side">
          <WeekSummaryCard total={weekItems.length} done={weekDone} dueCount={weekDue} minutes={weekMinutes} isLoading={plan.isLoading} />
          <DueSoonCard tasks={dueSoon} isLoading={plan.isLoading} onOpenOwn={openOwnTask} />
        </aside>
      </div>

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
