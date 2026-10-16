import { useState } from 'react';
import { LuArrowDown, LuArrowUp, LuCheck, LuPlus, LuSparkles, LuTrash2 } from 'react-icons/lu';
import { Alert, Button, IconButton, Spinner } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import planService from '../services/plan.service';
import { addRow, durationText, moveRow, removeRow, rowProblems, toPayload, toRows, totalMinutes, updateRow, workloadFacts } from '../stepsReview';
import '../planner.css';

/**
 * "Break into steps" (2026-10-13): any work on the student's plan - their
 * own, a parent's or a teacher's - becomes their own small steps with AI,
 * sized to their free study time and the other work due before it. Inline
 * (it sits in the work dialog and on the assignment page, never a second
 * modal): the button → "Looking at your week…" → the steps to edit (rename,
 * minutes, order, remove, add) → "Keep these steps". Nothing reaches the
 * plan until they are kept.
 *
 *   studentId   'me' (the student) or a child's id (their parent)
 *   workId      the work
 *   hasSteps    the list already has steps (then the button offers a redo)
 *   kid         Grades 4-5 wording
 *   onSaved()   re-read the step list
 *
 * Hidden when the platform makes steps automatically (intake.policy).
 */
export function BreakIntoSteps({ studentId = 'me', workId, hasSteps = false, kid = false, onSaved }) {
  const help = useApi(planService.getStepHelp, { immediate: Boolean(workId), args: [studentId, workId] });
  const [phase, setPhase] = useState('idle'); // idle | thinking | review | saving
  const [suggestion, setSuggestion] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [tried, setTried] = useState(false);

  const status = help.data;
  if (!workId || !status?.available) return null;

  const start = async () => {
    setPhase('thinking');
    setError(null);
    setTried(false);
    try {
      const { data } = await planService.suggestSteps(studentId, workId);
      setSuggestion(data);
      setRows(toRows(data.steps));
      setPhase('review');
    } catch (err) {
      setError(getErrorMessage(err));
      setPhase('idle');
    }
  };

  const cancel = () => {
    setPhase('idle');
    setSuggestion(null);
    setRows([]);
    setError(null);
  };

  const problems = rowProblems(rows);
  const hasProblems = Object.keys(problems).length > 0;
  const total = totalMinutes(rows);
  const room = suggestion?.workload?.roomMinutes;
  const spaceLeft = Math.max(0, (suggestion?.maxSteps ?? 30) - rows.length);

  const keep = async () => {
    setTried(true);
    if (hasProblems || !rows.length) return;
    setPhase('saving');
    setError(null);
    try {
      await planService.keepSteps(studentId, workId, toPayload(suggestion.proposalId, rows));
      toast.success(kid ? 'Your steps are ready!' : 'Your steps are saved');
      cancel();
      help.run(studentId, workId).catch(() => {});
      onSaved?.();
    } catch (err) {
      // A suggestion already kept (another tab): start again from the button.
      if (err?.response?.status === 409) cancel();
      else setPhase('review');
      setError(getErrorMessage(err));
    }
  };

  if (phase === 'thinking') {
    return (
      <div className="pl-bis pl-bis--busy" role="status">
        <Spinner size="sm" />
        <span>{kid ? 'Looking at your week and making steps…' : 'Looking at your week and making steps that fit it…'}</span>
      </div>
    );
  }

  if (phase === 'idle') {
    const label = hasSteps ? (kid ? 'Make new steps' : 'Redo my steps with AI') : kid ? 'Help me make steps' : 'Break into steps';
    const canStart = !hasSteps || status.canRedo;
    return (
      <div className={`pl-bis ${hasSteps ? 'pl-bis--quiet' : ''}`.trim()}>
        {error && (
          <Alert variant="error" className="pl-bis__alert">
            {error}
          </Alert>
        )}
        {hasSteps && status.outOfDate && (
          <p className="pl-bis__note">
            {kid ? 'This work changed since your steps were made.' : 'This work changed (due date or instructions) since your steps were made.'}
          </p>
        )}
        {!hasSteps && (
          <p className="pl-bis__note">
            {kid ? 'Turn this into small steps that fit your week.' : 'AI turns this into small steps that fit your free time and the other work you have due.'}
          </p>
        )}
        {canStart && (
          <Button type="button" size="sm" variant={hasSteps ? 'secondary' : 'primary'} startIcon={<LuSparkles aria-hidden="true" />} onClick={start}>
            {label}
          </Button>
        )}
      </div>
    );
  }

  const facts = workloadFacts(suggestion.workload, { kid });
  const saving = phase === 'saving';
  return (
    <section className="pl-bis pl-bis--review" aria-label={kid ? 'Your new steps' : 'Suggested steps'}>
      <h4 className="pl-bis__title">{kid ? 'Here are your steps' : 'Your suggested steps'}</h4>
      {facts.length > 0 && (
        <ul className="pl-bis__facts" aria-label="Your week">
          {facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      {suggestion.workload?.tight && (
        <Alert variant="warning" className="pl-bis__alert">
          {kid
            ? 'Your week is busy, so the steps are short.'
            : 'Your week is full before this is due, so the steps are kept few and short. You might ask for more time.'}
        </Alert>
      )}
      {suggestion.source !== 'ai' && (
        <Alert variant="info" className="pl-bis__alert">
          {kid ? 'These are starter steps. Change them if you like.' : 'The AI couldn’t help this time, so these are starter steps. Change them to fit the work.'}
        </Alert>
      )}
      {error && (
        <Alert variant="error" className="pl-bis__alert">
          {error}
        </Alert>
      )}
      {suggestion.keeping?.length > 0 && (
        <div className="pl-bis__keeping">
          <p className="pl-bis__note">{kid ? 'These stay:' : `Staying as they are (finished or started):`}</p>
          <ul>
            {suggestion.keeping.map((s) => (
              <li key={s.id}>
                <LuCheck size={12} aria-hidden="true" /> {s.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ol className="pl-bis__list">
        {rows.map((r, i) => {
          const p = (tried && problems[r.key]) || {};
          return (
            <li key={r.key} className="pl-bis__row">
              <span className="pl-bis__num" aria-hidden="true">
                {i + 1}
              </span>
              <div className="pl-bis__fields">
                <input
                  className="pl-bis__title-input"
                  aria-label={`Step ${i + 1} name`}
                  aria-invalid={p.title ? true : undefined}
                  value={r.title}
                  maxLength={200}
                  disabled={saving}
                  onChange={(e) => setRows((rs) => updateRow(rs, r.key, { title: e.target.value }))}
                />
                <label className="pl-bis__mins">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={240}
                    aria-label={`Step ${i + 1} minutes`}
                    aria-invalid={p.minutes ? true : undefined}
                    value={r.minutes}
                    disabled={saving}
                    onChange={(e) => setRows((rs) => updateRow(rs, r.key, { minutes: e.target.value }))}
                  />
                  <span aria-hidden="true">min</span>
                </label>
                {(p.title || p.minutes) && <span className="pl-bis__error">{p.title ?? `Minutes: ${p.minutes}`}</span>}
              </div>
              <span className="pl-bis__tools">
                <IconButton size="sm" icon={<LuArrowUp />} label={`Move step ${i + 1} up`} disabled={saving || i === 0} onClick={() => setRows((rs) => moveRow(rs, r.key, -1))} />
                <IconButton
                  size="sm"
                  icon={<LuArrowDown />}
                  label={`Move step ${i + 1} down`}
                  disabled={saving || i === rows.length - 1}
                  onClick={() => setRows((rs) => moveRow(rs, r.key, 1))}
                />
                <IconButton size="sm" icon={<LuTrash2 />} label={`Remove step ${i + 1}`} disabled={saving} onClick={() => setRows((rs) => removeRow(rs, r.key))} />
              </span>
            </li>
          );
        })}
      </ol>
      {tried && !rows.length && <p className="pl-bis__error">{kid ? 'Keep at least one step.' : 'Keep at least one step, or cancel.'}</p>}

      <div className="pl-bis__foot">
        <Button type="button" size="sm" variant="ghost" startIcon={<LuPlus aria-hidden="true" />} disabled={saving || spaceLeft === 0} onClick={() => setRows(addRow)}>
          Add a step
        </Button>
        <span className="pl-bis__total">
          About {durationText(total)} in total
          {room != null && total > room && !kid ? ` - more than the ${durationText(room)} you have free before it’s due` : ''}
        </span>
      </div>
      <div className="pl-bis__actions">
        <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={cancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" loading={saving} onClick={keep}>
          {kid ? 'Use these steps' : 'Keep these steps'}
        </Button>
      </div>
    </section>
  );
}

export default BreakIntoSteps;
