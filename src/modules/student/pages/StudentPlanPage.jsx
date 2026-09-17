import { useMemo, useState } from 'react';
import { LuChevronLeft, LuChevronRight, LuPlus } from 'react-icons/lu';
import { ErrorState } from '../../../components/common';
import OwnTaskModal from '../components/home/OwnTaskModal';
import '../components/home/studentHome.css';
import PlanDayColumn from '../components/plan/PlanDayColumn';
import PlanMonthPicker from '../components/plan/PlanMonthPicker';
import { DueSoonCard, WeekSummaryCard } from '../components/plan/PlanSideCards';
import '../components/plan/studentPlan.css';
import { useTodayTasks } from '../hooks/useTodayTasks';
import { addDaysToKey, formatDateKey, formatDateKeyRange, getDateKey, weekdayOfKey } from '../../../utils/date';

const byPlanOrder = (a, b) => Number(a.done) - Number(b.done) || a.title.localeCompare(b.title);

/**
 * Grade 6+ "Plan" - built to the Plan mockup. Teacher work (/assignments)
 * and the student's own tasks (/my-tasks) are laid out on the day they're
 * due (useTodayTasks().all), Monday to Sunday, with a Day view, a month
 * calendar to jump around, per-day Add (an own task pre-dated to that day),
 * the week's progress and what's due soon. Everything is dated in the
 * student's own timezone via getDateKey/daysUntilDateKey.
 */
export default function StudentPlanPage() {
  const plan = useTodayTasks();
  const todayKey = getDateKey();

  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [viewMode, setViewMode] = useState('week');
  // Own-task dialog: null = closed, else { mode: 'type' | 'edit', task?, dueDate? }.
  const [taskDialog, setTaskDialog] = useState(null);

  const weekStartKey = addDaysToKey(selectedKey, -weekdayOfKey(selectedKey));
  const weekEndKey = addDaysToKey(weekStartKey, 6);

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
  const weekMinutes = weekItems.reduce((sum, t) => sum + t.estimatedMinutes, 0);

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
  const addTask = (dueDate) => setTaskDialog({ mode: 'type', dueDate });

  return (
    <div className="sh-page sp-page">
      <header className="sp-header">
        <h1 className="sp-header__title">Plan</h1>
        <p className="sp-header__summary">Your week, one step at a time.</p>
      </header>

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
          <div className="sp-segment" role="group" aria-label="View">
            {['week', 'day'].map((mode) => (
              <button key={mode} type="button" aria-pressed={viewMode === mode} onClick={() => setViewMode(mode)}>
                {mode === 'week' ? 'Week' : 'Day'}
              </button>
            ))}
          </div>
          <button type="button" className="sp-primary" onClick={() => addTask(selectedKey >= todayKey ? selectedKey : todayKey)}>
            <LuPlus size={16} aria-hidden="true" /> Add assignment
          </button>
        </div>
      </div>

      <div className="sp-grid">
        {plan.error && !plan.all.length ? (
          <ErrorState onRetry={plan.reload} />
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
        )}

        <aside className="sp-side">
          <WeekSummaryCard total={weekItems.length} done={weekDone} dueCount={weekDue} minutes={weekMinutes} isLoading={plan.isLoading} />
          <DueSoonCard tasks={dueSoon} isLoading={plan.isLoading} onOpenOwn={openOwnTask} />
        </aside>
      </div>

      <OwnTaskModal
        mode={taskDialog?.mode ?? null}
        task={taskDialog?.task ?? null}
        defaultDueDate={taskDialog?.dueDate}
        onClose={() => setTaskDialog(null)}
        onChanged={plan.reload}
      />
    </div>
  );
}
