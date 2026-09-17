import { useCallback, useMemo, useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { ASSIGNMENT_RECIPIENT_STATUS as STATUS } from '../../../utils/constants';
import { daysUntilDateKey, isTodayInTimezone } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import assignmentService from '../../assignments/services/assignment.service';
import studentTaskService from '../services/studentTask.service';

/**
 * Grade 6+ Home's task data: teacher-assigned work (/assignments) and the
 * student's own tasks (/my-tasks), merged into one list the student can
 * reorder.
 *
 *   tasks      Today's Tasks - open work due today, overdue, or with no due
 *              date; then whatever was finished today (so the "2/5 complete"
 *              bar fills up over the day)
 *   upcoming   open tasks due after today, soonest first - kept out of
 *              Today's Tasks so the two cards never repeat each other
 *   all        every task, unfiltered (the Plan page buckets these by due date)
 *
 * A teacher task counts as done for the student once handed in (submitted,
 * reviewed or completed) - nothing is left for them to do on it.
 */

const OPEN = [STATUS.ASSIGNED, STATUS.IN_PROGRESS, STATUS.RETURNED];
const QUERY = { limit: 100 };

const keyOf = (type, id) => `${type}:${id}`;

function fromAssignment(item) {
  const a = item.assignment ?? {};
  const done = !OPEN.includes(item.status);
  return {
    key: keyOf('assignment', item.recipientId),
    type: 'assignment',
    id: item.recipientId,
    assignmentId: a.id,
    title: a.title ?? 'Assignment',
    subject: a.subject ?? null,
    kind: a.taskType?.name ?? null,
    estimatedMinutes: Number(a.estimatedMinutes) || 0,
    dueDate: a.dueDate ?? null,
    done,
    doneAt: done ? item.submission?.submittedAt ?? item.submission?.reviewedAt ?? null : null,
    sortOrder: item.sortOrder ?? null,
    status: item.status,
    raw: item,
  };
}

function fromOwn(task) {
  const done = task.status === 'completed';
  return {
    key: keyOf('own', task.id),
    type: 'own',
    id: task.id,
    assignmentId: null,
    title: task.title,
    subject: task.subject ?? null,
    kind: null,
    estimatedMinutes: Number(task.estimatedMinutes) || 0,
    dueDate: task.dueDate ?? null,
    done,
    doneAt: done ? task.completedAt : null,
    sortOrder: task.sortOrder ?? null,
    status: task.status,
    raw: task,
  };
}

const isUpcoming = (task) => Boolean(task.dueDate) && daysUntilDateKey(task.dueDate) > 0;

const nullsLast =(a, b) => (a == null ? (b == null ? 0 : 1) : b == null ? -1 : a < b ? -1 : a > b ? 1 : 0);

const startedFirst = (a, b) => (a.status === STATUS.IN_PROGRESS ? 0 : 1) - (b.status === STATUS.IN_PROGRESS ? 0 : 1);

/** Open work first; then the student's own saved order; then soonest due, started work ahead of new on a tie. */
function byPlan(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  return (
    nullsLast(a.sortOrder, b.sortOrder) ||
    nullsLast(a.dueDate, b.dueDate) ||
    startedFirst(a, b) ||
    a.title.localeCompare(b.title)
  );
}

export function useTodayTasks() {
  const assignments = useApi(assignmentService.listAssignments, { immediate: true, args: [QUERY] });
  const own = useApi(studentTaskService.list, { immediate: true });
  const { run: runAssignments } = assignments;
  const { run: runOwn } = own;

  // Keys in the order the student just dragged them, until the server copy catches up.
  const [pendingOrder, setPendingOrder] = useState(null);

  const all = useMemo(
    () => [
      ...(Array.isArray(assignments.data) ? assignments.data : []).map(fromAssignment),
      ...(Array.isArray(own.data) ? own.data : []).map(fromOwn),
    ],
    [assignments.data, own.data]
  );

  const tasks = useMemo(() => {
    const today = all.filter((t) => (t.done ? isTodayInTimezone(t.doneAt) : !isUpcoming(t))).sort(byPlan);
    if (!pendingOrder) return today;
    const position = new Map(pendingOrder.map((key, i) => [key, i]));
    return [...today].sort((a, b) => nullsLast(position.get(a.key), position.get(b.key)));
  }, [all, pendingOrder]);

  const upcoming = useMemo(
    () =>
      all
        .filter((t) => !t.done && isUpcoming(t))
        .sort((a, b) => nullsLast(a.dueDate, b.dueDate)),
    [all]
  );

  const reload = useCallback(
    () => Promise.all([runAssignments(QUERY).catch(() => {}), runOwn().catch(() => {})]),
    [runAssignments, runOwn]
  );

  /** Moves one row and saves the whole order. Rolls back (with a message) if the save fails. */
  const move = useCallback(
    async (fromIndex, toIndex) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      const next = [...tasks];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      setPendingOrder(next.map((t) => t.key));
      try {
        await studentTaskService.saveOrder(next.map((t) => ({ type: t.type, id: t.id })));
        await reload();
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setPendingOrder(null);
      }
    },
    [tasks, reload]
  );

  const setOwnDone = useCallback(
    async (task, done) => {
      try {
        await studentTaskService.update(task.id, { completed: done });
        await runOwn().catch(() => {});
        if (done) toast.success('Nice - task done!');
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [runOwn]
  );

  const open = tasks.filter((t) => !t.done);

  return {
    all,
    tasks,
    upcoming,
    openCount: open.length,
    doneCount: tasks.length - open.length,
    minutesLeft: open.reduce((sum, t) => sum + t.estimatedMinutes, 0),
    isLoading: (assignments.isLoading && !assignments.data) || (own.isLoading && !own.data),
    error: assignments.error ?? own.error,
    reload,
    move,
    setOwnDone,
  };
}

export default useTodayTasks;
