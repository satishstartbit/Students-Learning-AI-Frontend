import { useCallback, useMemo } from 'react';
import { useApi } from '../../../hooks/useApi';
import { ASSIGNMENT_RECIPIENT_STATUS as STATUS } from '../../../utils/constants';
import { compareDates } from '../../../utils/date';
import assignmentService from '../../assignments/services/assignment.service';

/**
 * The signed-in student's assignments, grouped the way a young student thinks
 * about them:
 *
 *   toDo  still theirs to do - new, started, or handed back to fix
 *   sent  handed in, waiting for the teacher
 *   done  checked by the teacher
 *
 * One request for everything - the API caps a page at 100, far more open work
 * than one K-4 student has - so the groups and counts come from the same data.
 */
const TO_DO = [STATUS.ASSIGNED, STATUS.IN_PROGRESS, STATUS.RETURNED];
const SENT = [STATUS.SUBMITTED];
const DONE = [STATUS.REVIEWED, STATUS.COMPLETED];

const QUERY = { limit: 100 };

/** Soonest due first; undated work last; started work ahead of new work on a tie. */
function byUrgency(a, b) {
  const byDue = compareDates(a.assignment?.dueDate, b.assignment?.dueDate);
  if (byDue !== 0) return byDue;
  return (a.status === STATUS.IN_PROGRESS ? 0 : 1) - (b.status === STATUS.IN_PROGRESS ? 0 : 1);
}

export function useMyTasks() {
  const list = useApi(assignmentService.listAssignments, { immediate: true, args: [QUERY] });
  const { run } = list;

  const groups = useMemo(() => {
    const items = Array.isArray(list.data) ? list.data : [];
    return {
      toDo: items.filter((t) => TO_DO.includes(t.status)).sort(byUrgency),
      sent: items.filter((t) => SENT.includes(t.status)),
      done: items.filter((t) => DONE.includes(t.status)),
    };
  }, [list.data]);

  const reload = useCallback(() => run(QUERY).catch(() => {}), [run]);

  return { ...groups, isLoading: list.isLoading, error: list.error, reload };
}

export default useMyTasks;
