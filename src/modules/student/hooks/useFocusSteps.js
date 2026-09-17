import { useCallback } from 'react';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import focusService from '../services/focus.service';

/**
 * The student's step plan for one assignment (backend /focus/steps), for the
 * Focus page's "Your steps". Every mutation re-reads the list from the server,
 * so order/numbering always match what's stored; failures show a toast and
 * leave the list as it was.
 */
export function useFocusSteps(assignmentId) {
  const list = useApi((id) => (id ? focusService.listSteps(id) : Promise.resolve({ data: [] })), {
    immediate: true,
    args: [assignmentId ?? null],
  });
  const { run } = list;

  const reload = useCallback(() => run(assignmentId ?? null).catch(() => {}), [run, assignmentId]);

  const act = useCallback(
    async (fn, successMessage) => {
      try {
        const result = await fn();
        await reload();
        if (successMessage) toast.success(successMessage);
        return result?.data ?? null;
      } catch (err) {
        toast.error(getErrorMessage(err));
        return null;
      }
    },
    [reload]
  );

  const steps = Array.isArray(list.data) ? list.data : [];

  const move = (stepId, delta) => {
    const index = steps.findIndex((s) => s.id === stepId);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= steps.length) return null;
    const ids = steps.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    return act(() => focusService.reorderSteps(assignmentId, ids));
  };

  return {
    steps,
    doneCount: steps.filter((s) => s.done).length,
    isLoading: Boolean(assignmentId) && list.isLoading && !list.data,
    reload,
    add: (title, estimatedMinutes) => act(() => focusService.addStep(assignmentId, { title, estimatedMinutes })),
    suggest: () => act(() => focusService.suggestSteps(assignmentId), 'Here’s a plan to start from - change anything you like.'),
    rename: (stepId, title) => act(() => focusService.updateStep(stepId, { title })),
    toggleDone: (step) => act(() => focusService.updateStep(step.id, { done: !step.done })),
    remove: (stepId) => act(() => focusService.deleteStep(stepId)),
    moveUp: (stepId) => move(stepId, -1),
    moveDown: (stepId) => move(stepId, 1),
  };
}

export default useFocusSteps;
