import { LuCheck, LuX } from 'react-icons/lu';
import { formatDate } from '../../../utils/date';
import { invitationSteps } from '../invitationProgress';
import './invitationSteps.css';

/** The step the family should read: where it is now, or where it stopped / ended. */
const focusOf = (steps) => steps.find((s) => s.state === 'current') ?? steps.find((s) => s.state === 'stopped') ?? steps.filter((s) => s.state === 'done').at(-1);

/**
 * Where a teacher invitation has got to, as small steps a family can follow
 * (invitationProgress.js): Requested → Approved → Teacher's answer, or Sent by
 * the platform team → Teacher's answer.
 *   dates    adds when each step happened (the details list)
 *   compact  one dot per step + the step it is on (a narrow child card)
 */
export function InvitationSteps({ invitation, dates = false, compact = false, className = '' }) {
  const steps = invitationSteps(invitation);
  if (!steps.length) return null;

  if (compact) {
    const focus = focusOf(steps);
    const index = steps.indexOf(focus) + 1;
    return (
      <div className={`iv-steps iv-steps--compact ${className}`.trim()} aria-label={`Step ${index} of ${steps.length}: ${focus.label}`} role="img">
        <span className="iv-dots" aria-hidden="true">
          {steps.map((s) => (
            <span key={s.key} className="iv-step__dot" data-state={s.state} />
          ))}
        </span>
        <span className="iv-step__label" data-state={focus.state} aria-hidden="true">
          {focus.label}
        </span>
      </div>
    );
  }

  return (
    <ol className={`iv-steps ${className}`.trim()} aria-label="Progress">
      {steps.map((s) => (
        <li key={s.key} className="iv-step" data-state={s.state} aria-current={s.state === 'current' ? 'step' : undefined}>
          <span className="iv-step__dot" data-state={s.state} aria-hidden="true">
            {s.state === 'done' ? <LuCheck size={10} strokeWidth={3} /> : s.state === 'stopped' ? <LuX size={10} strokeWidth={3} /> : null}
          </span>
          <span className="iv-step__label">
            {s.label}
            {dates && s.at ? <span className="iv-step__at"> · {formatDate(s.at)}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default InvitationSteps;
