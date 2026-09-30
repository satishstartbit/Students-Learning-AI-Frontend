import { useState } from 'react';
import { LuArrowRight, LuCalendarSync, LuCircleHelp, LuHandHelping, LuLayers, LuLifeBuoy, LuPlay, LuX } from 'react-icons/lu';
import { Button, ConfirmationModal, Modal } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import DifficultyPicker from '../../checkIn/components/DifficultyPicker';
import { useSupport } from '../hooks/useSupport';
import supportService from '../services/support.service';
import '../planner.css';

const QUICK = {
  continue: { icon: LuPlay, label: 'Keep going', hint: 'I’m fine, carry on' },
  smaller_steps: { icon: LuLayers, label: 'Smaller steps', hint: 'Break this step up' },
  explain: { icon: LuCircleHelp, label: 'Explain it', hint: 'Ask the learning assistant' },
  replan: { icon: LuCalendarSync, label: 'Re-plan', hint: 'Fit my time again' },
  ask_adult: { icon: LuHandHelping, label: 'Ask an adult', hint: 'Tell my parent I need help' },
  no_longer_required: { icon: LuX, label: 'No longer needed', hint: 'Take it off my plan' },
};

/**
 * "Need help?" for one piece of work (PDF Q1): Keep going, Smaller steps,
 * Explain, Re-plan, Ask an adult, No longer needed - which buttons show is
 * the admin's choice ("Help when work gets hard"), and "No longer needed"
 * only appears when this person may remove the work (never teacher work).
 * "Something's tricky…" opens the reasons picker with matched ideas.
 */
export function NeedHelpDialog({ target, onClose, onChanged }) {
  const options = useApi(supportService.getOptions, { immediate: Boolean(target), args: ['me'] });
  const support = useSupport({ assignmentId: target?.assignmentId, stepId: target?.stepId, onChanged });
  const [picker, setPicker] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const allowed = (options.data?.quickActions ?? []).filter((a) => a !== 'no_longer_required' || target?.canRemove);

  const choose = async (action) => {
    if (action === 'no_longer_required') {
      setConfirmRemove(true);
      return;
    }
    if (await support.run({ action })) onClose();
  };

  return (
    <>
      <Modal isOpen={Boolean(target) && !picker} onClose={onClose} title="Need help?" description={target?.title} size="md">
        <div className="pl-methods">
          {allowed.map((key) => {
            const q = QUICK[key];
            if (!q) return null;
            const Icon = q.icon;
            return (
              <button key={key} type="button" className="pl-method" onClick={() => choose(key)} disabled={Boolean(support.busy)}>
                <Icon size={20} aria-hidden="true" />
                <span className="pl-method__title">{q.label}</span>
                <span className="pl-method__hint">{q.hint}</span>
              </button>
            );
          })}
        </div>
        <div className="pl-actions" style={{ justifyContent: 'space-between' }}>
          <Button type="button" variant="secondary" startIcon={<LuLifeBuoy aria-hidden="true" />} onClick={() => setPicker(true)}>
            Something’s tricky…
          </Button>
          <Button type="button" variant="ghost" endIcon={<LuArrowRight aria-hidden="true" />} onClick={onClose}>
            Not now
          </Button>
        </div>
        {options.data?.disclaimer && <p className="pl-muted" style={{ marginBottom: 0 }}>{options.data.disclaimer}</p>}
      </Modal>

      <DifficultyPicker
        isOpen={picker}
        assignmentId={target?.assignmentId}
        stepId={target?.stepId}
        onChanged={onChanged}
        onClose={() => {
          setPicker(false);
          onClose();
        }}
      />

      <ConfirmationModal
        isOpen={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={async () => {
          setConfirmRemove(false);
          if (await support.run({ action: 'no_longer_required' })) onClose();
        }}
        title="Take this off your plan?"
        message="It won't be planned or shown in your list any more. Nothing you already did on it is lost."
        confirmLabel="Take it off"
      />
    </>
  );
}

export default NeedHelpDialog;
