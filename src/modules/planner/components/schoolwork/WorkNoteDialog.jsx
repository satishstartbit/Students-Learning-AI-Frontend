import { LuCheck } from 'react-icons/lu';
import { Button, Modal } from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { minutesLabel, sourceLabel } from '../../planView';
import BreakIntoSteps from '../BreakIntoSteps';
import { COLUMNS, moveActions } from '../../schoolwork';
import { SubjectChip, TypeTag } from './SchoolworkBits';
import { dueText, estimateOf } from './schoolworkFormat';
import './schoolwork.css';

const noSteps = async () => ({ data: [] });

/**
 * One piece of schoolwork opened from a sticky note, the list or the
 * calendar: what it is, when it's due, how long it should take, its steps
 * (subtasks) and what can be done with it from here.
 *
 *   loadSteps(workId)   the student's steps (planner / focus steps); left out
 *                       for a parent, who sees the counts
 *   stepsFor            'me': offer "Break into steps" with AI under the steps
 *                       (any unfinished work, teacher work included)
 *   kid                 Grades 4-5 wording for it
 *   onStepsChanged()    steps were kept: re-read the work (its step counts)
 *   onMove(work, to)    a board move the server allows
 *   onHandIn(work)      teacher work: open its page to hand it in
 *   onOpenPage(work)    the full page (teacher work) or the edit dialog (own work)
 *   onFocus(work)       start a focus session on it (student)
 *   onRemove(work)      a parent taking family-added work off the plan
 */
export function WorkNoteDialog({
  work,
  today,
  colorOf = () => null,
  preferences,
  viewer = 'student',
  movable = false,
  busy = false,
  loadSteps,
  stepsFor,
  kid = false,
  onStepsChanged,
  onClose,
  onMove,
  onHandIn,
  onOpenPage,
  onFocus,
  onRemove,
}) {
  const steps = useApi(loadSteps ?? noSteps, { immediate: Boolean(work && loadSteps), args: [work?.id] });
  if (!work) return null;

  const done = work.progress === 'done';
  const estimate = estimateOf(work);
  const actions = movable ? moveActions(work).filter((a) => a.to !== 'handIn') : [];
  const stepList = Array.isArray(steps.data) ? steps.data.filter((s) => s.status !== 'withdrawn') : [];
  const where = COLUMNS.find((c) => c.key === work.progress)?.label ?? 'To Do';

  return (
    <Modal isOpen={Boolean(work)} onClose={onClose} title={work.title} size="md">
      <div className="sw-dialog__labels">
        <SubjectChip subject={work.subject} color={colorOf(work.subject)} fallback="No subject" />
        <TypeTag name={work.typeName} icon={work.typeIcon} showIcon={preferences?.showTypeIcons ?? true} />
        <span>{sourceLabel(work.source, viewer)}</span>
      </div>
      {work.details && <p style={{ margin: 0 }}>{work.details}</p>}

      <div className="sw-dialog__facts">
        <div className="sw-fact">
          <span className="sw-fact__label">Due</span>
          <span className="sw-fact__value">{dueText(work.dueDate, today)}</span>
        </div>
        {estimate && (
          <div className="sw-fact">
            <span className="sw-fact__label">Estimated</span>
            <span className="sw-fact__value">{minutesLabel(estimate)}</span>
          </div>
        )}
        <div className="sw-fact">
          <span className="sw-fact__label">On the board</span>
          <span className="sw-fact__value">{where}</span>
        </div>
        {work.stepsTotal > 0 && (
          <div className="sw-fact">
            <span className="sw-fact__label">Steps</span>
            <span className="sw-fact__value">
              {work.stepsDone} of {work.stepsTotal} done
            </span>
          </div>
        )}
      </div>

      {loadSteps && (
        <section aria-label="Steps">
          <h3 className="sw-section__title">Steps</h3>
          {steps.isLoading && !steps.data ? (
            <p className="sw-muted">Loading steps…</p>
          ) : steps.error ? (
            <p className="sw-muted">The steps couldn’t load right now.</p>
          ) : stepList.length === 0 ? (
            <p className="sw-muted">No steps yet.</p>
          ) : (
            <ol className="sw-steps">
              {stepList.map((s) => (
                <li key={s.id} className="sw-step" data-done={s.done || undefined}>
                  <span className="sw-step__mark" aria-hidden="true">
                    {s.done && <LuCheck size={11} strokeWidth={3} />}
                  </span>
                  <span>
                    {s.title}
                    {s.done ? <span className="ui-sr-only"> (done)</span> : null}
                    {!s.done && s.estimatedMinutes ? <span className="sw-muted"> · {minutesLabel(s.estimatedMinutes)}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {stepsFor && !done && !(steps.isLoading && !steps.data) && !steps.error && (
            <BreakIntoSteps
              studentId={stepsFor}
              workId={work.id}
              hasSteps={stepList.length > 0}
              kid={kid}
              onSaved={() => {
                steps.run(work.id).catch(() => {});
                onStepsChanged?.();
              }}
            />
          )}
        </section>
      )}

      <div className="sw-dialog__actions">
        {onRemove && (
          <Button type="button" variant="secondary" size="sm" onClick={() => onRemove(work)}>
            Take it off the plan
          </Button>
        )}
        {onOpenPage && (
          <Button type="button" variant="secondary" size="sm" onClick={() => onOpenPage(work)}>
            {work.kind === 'teacher' ? 'Open assignment' : 'Edit'}
          </Button>
        )}
        {onFocus && !done && (
          <Button type="button" variant="secondary" size="sm" onClick={() => onFocus(work)}>
            Focus on this
          </Button>
        )}
        {actions.map((a) => (
          <Button key={a.to} type="button" size="sm" loading={busy} onClick={() => onMove(work, a.to)}>
            {a.label === 'Done' ? 'Mark done' : a.label}
          </Button>
        ))}
        {movable && work.kind === 'teacher' && !done && onHandIn && (
          <Button type="button" size="sm" onClick={() => onHandIn(work)}>
            Hand in
          </Button>
        )}
      </div>
    </Modal>
  );
}

export default WorkNoteDialog;
