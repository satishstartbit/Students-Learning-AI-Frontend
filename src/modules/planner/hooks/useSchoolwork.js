import { useCallback, useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import planService from '../services/plan.service';

const QUERY = { includeDone: true };

const MOVED = {
  todo: (w) => `“${w.title}” is back in To Do`,
  doing: (w) => `“${w.title}” is in Doing`,
  done: () => 'Nice - done!',
};

/**
 * The schoolwork the sticky notes and the list show: every open piece of
 * work (all sources) plus what was finished in the last two weeks, each with
 * its board column (GET /students/:id/work?includeDone=true).
 *
 * `move(work, to)` changes the work's real status (PATCH .../progress) - the
 * plan updates on the server - then reloads, and calls `onChanged` so the
 * page can refresh its plan and other lists.
 */
export function useSchoolwork(studentId = 'me', { onChanged } = {}) {
  const api = useApi(planService.listWork, { immediate: Boolean(studentId), args: [studentId, QUERY] });
  const { run } = api;
  const [busyId, setBusyId] = useState(null);

  const reload = useCallback(() => run(studentId, QUERY).catch(() => {}), [run, studentId]);

  const move = useCallback(
    async (work, to) => {
      setBusyId(work.id);
      try {
        await planService.setProgress(studentId, work.id, to);
        toast.success((MOVED[to] ?? MOVED.doing)(work));
        await reload();
        onChanged?.();
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setBusyId(null);
      }
    },
    [studentId, reload, onChanged]
  );

  return {
    work: Array.isArray(api.data) ? api.data : [],
    loaded: Array.isArray(api.data),
    isLoading: api.isLoading && !api.data,
    error: api.error,
    reload,
    busyId,
    move,
  };
}

export default useSchoolwork;
