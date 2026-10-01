import { useState } from 'react';
import { Button } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useDifficultyPicker } from '../../checkIn/hooks/useDifficultyPicker';
import supportService from '../services/support.service';

const ACTION_LABEL = {
  smaller_steps: 'Making smaller steps',
  explain: 'Getting it explained',
  focus_short: 'A short focus timer',
  toolkit: 'A calm-down break',
  replan: 'Re-planning your time',
  ask_adult: 'Asking an adult',
};

/**
 * "Did that help?" for ideas tried in the last few days (the outcome half of
 * the support loop). The answer only changes which ideas come first next
 * time. Renders nothing when there's nothing to ask.
 */
export function SupportCheckBack({ studentId = 'me', compact = false }) {
  const pending = useApi(supportService.pendingOutcomes, { immediate: true, args: [studentId] });
  const { strategies } = useDifficultyPicker({ immediate: true });
  const [answered, setAnswered] = useState(() => new Set());
  const items = (pending.data?.items ?? []).filter((i) => !answered.has(i.id));
  if (!items.length) return null;
  const item = items[0];
  const name = strategies.find((s) => s.code === item.strategyCode)?.name ?? ACTION_LABEL[item.action] ?? 'The idea you tried';

  const answer = async (outcome) => {
    try {
      await supportService.recordOutcome(studentId, item.id, outcome);
      setAnswered((prev) => new Set(prev).add(item.id));
      if (outcome !== 'skipped') toast.success('Thanks - that helps us suggest better ideas.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <section className="pl-card" aria-labelledby="pl-checkback-title" style={compact ? { padding: 14 } : undefined}>
      <h2 id="pl-checkback-title" className="pl-card__title">
        {pending.data?.question ?? 'Did that help?'}
      </h2>
      <p className="pl-card__sub" style={{ marginBottom: 10 }}>{name}</p>
      <div className="pl-row">
        <Button type="button" size="sm" onClick={() => answer('helped')}>
          Yes
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => answer('somewhat')}>
          A bit
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => answer('not_helped')}>
          Not really
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => answer('skipped')}>
          Skip
        </Button>
      </div>
    </section>
  );
}

export default SupportCheckBack;
