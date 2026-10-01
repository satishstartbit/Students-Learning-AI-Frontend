import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import supportService from '../services/support.service';

/**
 * Doing the help a student chose (quick button or an idea), then showing
 * what happened. The server records every choice so "Did that help?" can
 * follow up and later ideas favour what worked.
 *
 *   ask(reasonCodes, { shared })  -> { eventId, ideas } | null (server down: caller shows its own list)
 *   run({ action | strategyCode, eventId? })  -> true when done
 */
export function useSupport({ studentId = 'me', assignmentId, stepId, onChanged } = {}) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);

  const ask = useCallback(
    async (reasonCodes, { shared = true } = {}) => {
      try {
        const { data } = await supportService.reportBarrier(studentId, { reasonCodes, assignmentId, stepId, shared });
        return { eventId: data.event.id, ideas: data.ideas, disclaimer: data.disclaimer };
      } catch {
        return null;
      }
    },
    [studentId, assignmentId, stepId]
  );

  const run = useCallback(
    async ({ action, strategyCode, eventId }) => {
      setBusy(strategyCode ?? action);
      try {
        const { data } = await supportService.act(studentId, { action, strategyCode, eventId, assignmentId, stepId });
        const done = data.event.action;
        const result = data.result ?? {};
        if (done === 'smaller_steps') {
          toast.success(`Made ${result.steps?.length ?? 'some'} smaller steps. Start with the first one.`);
          onChanged?.();
        } else if (done === 'replan') {
          toast.success('Your plan is being updated.');
          onChanged?.();
        } else if (done === 'ask_adult') {
          toast.success(result.notified ? 'We let your parent know you’d like some help.' : 'Ask a parent or teacher when you can.');
        } else if (done === 'no_longer_required') {
          toast.success('Removed from your plan.');
          onChanged?.();
        } else if (done === 'focus_short') {
          const q = new URLSearchParams({ minutes: String(result.focusMinutes ?? 5) });
          if (result.assignmentId) q.set('assignment', result.assignmentId);
          if (result.stepId) q.set('step', result.stepId);
          navigate(`/student/focus?${q}`);
        } else if (done === 'explain') {
          navigate('/student/assistant');
        } else if (done === 'toolkit') {
          navigate('/student/focus');
        }
        return true;
      } catch (err) {
        toast.error(getErrorMessage(err));
        return false;
      } finally {
        setBusy(null);
      }
    },
    [studentId, assignmentId, stepId, navigate, onChanged]
  );

  return { ask, run, busy };
}

export default useSupport;
