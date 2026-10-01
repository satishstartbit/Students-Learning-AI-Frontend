import { useCallback, useEffect, useRef } from 'react';
import { useApi } from '../../../hooks/useApi';
import planService from '../services/plan.service';

const POLL_MS = 3000;
const MAX_POLLS = 20;

/**
 * The student's plan (`studentId` 'me' or a child's id). While the server
 * says it is still catching up with a change (`updating`), it re-reads every
 * few seconds - at most a minute - so a new task's study times appear
 * without a manual refresh.
 */
export function usePlan(studentId = 'me', range = {}) {
  const { from, to } = range;
  const plan = useApi(planService.getPlan, { immediate: Boolean(studentId), args: [studentId, { from, to }] });
  const { run } = plan;
  const polls = useRef(0);

  const reload = useCallback(() => {
    polls.current = 0;
    return run(studentId, { from, to }).catch(() => {});
  }, [run, studentId, from, to]);

  const updating = Boolean(plan.data?.updating);
  useEffect(() => {
    if (!updating || polls.current >= MAX_POLLS) return undefined;
    const timer = setTimeout(() => {
      polls.current += 1;
      run(studentId, { from, to }).catch(() => {});
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [updating, plan.data, run, studentId, from, to]);

  return {
    plan: plan.data,
    isLoading: plan.isLoading && !plan.data,
    error: plan.error,
    reload,
  };
}

export default usePlan;
