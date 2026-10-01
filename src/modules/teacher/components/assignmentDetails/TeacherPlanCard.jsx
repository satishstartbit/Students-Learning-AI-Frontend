import { useCallback, useEffect, useRef, useState } from 'react';
import { LuArrowDown, LuArrowUp, LuPlus, LuTrash2 } from 'react-icons/lu';
import { Alert, Button, Card, ErrorState, IconButton, Input, Select } from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { formatDateKey } from '../../../../utils/date';
import { getErrorMessage } from '../../../../utils/errorHandler';
import assignmentService from '../../../assignments/services/assignment.service';

const rowStyle = { display: 'grid', gap: 8, gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'end' };

function CheckpointsEditor({ assignmentId, plan, disabled, onSaved }) {
  const [rows, setRows] = useState(() => plan.checkpoints.map((c) => ({ id: c.id, title: c.title, dueDate: c.dueDate })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const invalid = rows.some((r) => !r.title.trim() || !r.dueDate || (plan.dueDate && r.dueDate > plan.dueDate));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await assignmentService.setCheckpoints(
        assignmentId,
        rows.map((r) => ({ ...(r.id ? { id: r.id } : {}), title: r.title.trim(), dueDate: r.dueDate }))
      );
      toast.success('Checkpoints saved - every student’s plan will work around them');
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-field">
      <h3 className="ui-statcard__label">Checkpoints</h3>
      <p className="ui-hint" style={{ marginTop: 0 }}>
        Fixed dates along the way, like “Outline by Friday”. Plans never move them.
        {plan.dueDate ? ` Each must be on or before ${formatDateKey(plan.dueDate)}.` : ''}
      </p>
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}
      {rows.map((r, i) => (
        <div key={r.id ?? `new-${i}`} style={{ ...rowStyle, gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) auto' }}>
          <Input
            label={`Checkpoint ${i + 1}`}
            value={r.title}
            maxLength={200}
            disabled={disabled}
            onChange={(e) => setRows((list) => list.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
          />
          <Input
            label="By"
            type="date"
            value={r.dueDate}
            max={plan.dueDate ?? undefined}
            disabled={disabled}
            error={plan.dueDate && r.dueDate > plan.dueDate ? 'After the due date' : undefined}
            onChange={(e) => setRows((list) => list.map((x, j) => (j === i ? { ...x, dueDate: e.target.value } : x)))}
          />
          <IconButton
            icon={<LuTrash2 aria-hidden="true" />}
            label={`Remove checkpoint ${i + 1}`}
            disabled={disabled}
            onClick={() => setRows((list) => list.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      {!disabled && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            startIcon={<LuPlus aria-hidden="true" />}
            disabled={rows.length >= 10}
            onClick={() => setRows((list) => [...list, { title: '', dueDate: plan.dueDate ?? '' }])}
          >
            Add checkpoint
          </Button>
          <Button type="button" size="sm" onClick={save} loading={saving} disabled={invalid}>
            Save checkpoints
          </Button>
        </div>
      )}
    </div>
  );
}

const MISSING_LABEL = { title: 'a title', dueDate: 'a due date', gradeOrSubject: 'a grade or subject' };
const listWords = (words) => (words.length <= 1 ? words[0] ?? '' : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`);

/**
 * Where the breakdown stands, in one line above the steps. The steps are made
 * on Save (draft or publish); nothing here re-makes them on demand.
 */
function BreakdownStatus({ breakdown, live }) {
  if (breakdown.status === 'unavailable') {
    return (
      <Alert variant="warning" className="ui-field">
        Suggested steps aren&apos;t available on this server yet (it needs database update 113). You can still add your own.
      </Alert>
    );
  }
  if (breakdown.status === 'failed') {
    return (
      <Alert variant="warning" className="ui-field">
        We couldn&apos;t make suggested steps this time. Save the assignment again to try once more, or add your own below.
      </Alert>
    );
  }
  let text;
  if (breakdown.status === 'needs_fields') {
    text = `Suggested steps are made when you save this assignment with ${listWords(breakdown.missing.map((m) => MISSING_LABEL[m] ?? m))}.`;
  } else if (breakdown.status === 'making') {
    text = 'Making suggested steps…';
  } else if (breakdown.status === 'updating') {
    text = 'Updating the steps to match your latest changes…';
  } else if (breakdown.status === 'off') {
    text = 'Automatic steps are switched off (Platform settings). Add your own steps below.';
  } else if (live) {
    text = 'Every student has these steps. Changing the instructions or due date re-works the steps they haven’t finished - finished steps never change.';
  } else {
    text = 'Suggested from what you saved. Edit anything - students see these steps only once you publish.';
  }
  return (
    <p className="ui-hint" style={{ marginTop: 0 }} data-testid="breakdown-status" data-status={breakdown.status}>
      {text}
    </p>
  );
}

function StepsEditor({ assignmentId, plan, disabled, onSaved }) {
  const breakdown = plan.breakdown ?? { status: 'ready', steps: plan.steps ?? [], missing: [] };
  const live = Boolean(breakdown.live);
  const [rows, setRows] = useState(() =>
    breakdown.steps.map((s) => ({
      key: s.key ?? null,
      title: s.title,
      minutes: s.minutes ? String(s.minutes) : '',
      checkpointId: s.checkpointId ?? '',
      // Shown beside the step: the teacher's own, or a suggestion they haven't changed.
      edited: Boolean(s.edited || s.origin === 'teacher'),
      original: { title: s.title, minutes: s.minutes ? String(s.minutes) : '', checkpointId: s.checkpointId ?? '' },
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const checkpointOptions = plan.checkpoints.map((c) => ({ value: c.id, label: c.title }));
  const waiting = ['making', 'needs_fields'].includes(breakdown.status) && !rows.length;

  const invalid = rows.some((r) => !r.title.trim() || (r.minutes && !(Number(r.minutes) >= 1 && Number(r.minutes) <= 600)));
  const isYours = (r) =>
    r.edited || !r.original || r.title.trim() !== r.original.title || r.minutes !== r.original.minutes || (r.checkpointId || '') !== (r.original.checkpointId || '');

  const send = async () => {
    setSaving(true);
    setError(null);
    try {
      await assignmentService.setTeacherPlan(
        assignmentId,
        rows.map((r) => ({ key: r.key, title: r.title.trim(), minutes: r.minutes ? Number(r.minutes) : null, checkpointId: r.checkpointId || null }))
      );
      toast.success(live ? 'Every student’s unfinished steps now match. Finished steps didn’t change.' : 'Students see these steps once you publish.', {
        title: 'Steps saved',
      });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const move = (i, by) =>
    setRows((list) => {
      const next = [...list];
      const [row] = next.splice(i, 1);
      next.splice(i + by, 0, row);
      return next;
    });

  return (
    <div className="ui-field" data-testid="breakdown-steps">
      <h3 className="ui-statcard__label">Steps</h3>
      <BreakdownStatus breakdown={breakdown} live={live} />
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}
      {!waiting && rows.length > 0 && (
        <p className="ui-hint" style={{ marginTop: 0 }}>
          “Yours” steps are required for every student; suggested ones can be changed by each student.
        </p>
      )}
      {rows.map((r, i) => (
        <div
          key={r.key ?? `new-${i}`}
          style={{ ...rowStyle, gridTemplateColumns: checkpointOptions.length ? 'minmax(0, 2fr) 110px minmax(0, 1fr) auto' : 'minmax(0, 2fr) 110px auto' }}
        >
          <Input
            label={`Step ${i + 1} · ${isYours(r) ? 'Yours' : 'Suggested'}`}
            value={r.title}
            maxLength={200}
            disabled={disabled}
            onChange={(e) => setRows((list) => list.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
          />
          <Input
            label="Minutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            value={r.minutes}
            disabled={disabled}
            onChange={(e) => setRows((list) => list.map((x, j) => (j === i ? { ...x, minutes: e.target.value } : x)))}
          />
          {checkpointOptions.length > 0 && (
            <Select
              label="For checkpoint"
              value={r.checkpointId}
              placeholder="None"
              options={checkpointOptions}
              disabled={disabled}
              onChange={(e) => setRows((list) => list.map((x, j) => (j === i ? { ...x, checkpointId: e.target.value } : x)))}
            />
          )}
          <div style={{ display: 'flex', gap: 4 }}>
            <IconButton icon={<LuArrowUp aria-hidden="true" />} label={`Move step ${i + 1} up`} disabled={disabled || i === 0} onClick={() => move(i, -1)} />
            <IconButton
              icon={<LuArrowDown aria-hidden="true" />}
              label={`Move step ${i + 1} down`}
              disabled={disabled || i === rows.length - 1}
              onClick={() => move(i, 1)}
            />
            <IconButton
              icon={<LuTrash2 aria-hidden="true" />}
              label={`Remove step ${i + 1}`}
              disabled={disabled}
              onClick={() => setRows((list) => list.filter((_, j) => j !== i))}
            />
          </div>
        </div>
      ))}
      {!disabled && !waiting && breakdown.status !== 'unavailable' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            startIcon={<LuPlus aria-hidden="true" />}
            disabled={rows.length >= 20}
            onClick={() => setRows((list) => [...list, { key: null, title: '', minutes: '', checkpointId: '', edited: true, original: null }])}
          >
            Add step
          </Button>
          <Button type="button" size="sm" loading={saving} disabled={invalid || !rows.length || saving} onClick={send}>
            {live ? 'Save steps for every student' : 'Save steps'}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Checkpoints and the step breakdown for THEIR assignment (PDF Q3, Q5; the
 * "AI Breakdown Timing" spec, 2026-10-01). The steps are made when the
 * assignment is saved - draft or publish - and previewed and edited here;
 * a draft's are never shown to students. No regenerate button: a different
 * breakdown comes from editing the steps, or the assignment itself.
 */
export function TeacherPlanCard({ assignmentId, archived }) {
  const plan = useApi(assignmentService.getTeacherPlan, { immediate: true, args: [assignmentId] });
  const { run } = plan;
  const reload = useCallback(() => run(assignmentId).catch(() => {}), [run, assignmentId]);
  const status = plan.data?.breakdown?.status;

  // While the steps are being made (right after a save), look again every few seconds, for up to a minute.
  const polls = useRef(0);
  useEffect(() => {
    if (!['making', 'updating'].includes(status)) {
      polls.current = 0;
      return undefined;
    }
    if (polls.current >= 20) return undefined;
    const timer = setTimeout(() => {
      polls.current += 1;
      reload();
    }, 3000);
    return () => clearTimeout(timer);
  }, [status, plan.data, reload]);

  return (
    <Card
      title="Steps and checkpoints"
      subtitle="Steps are suggested when you save the assignment. Edit them here; students get them when it’s published."
      className="ui-field"
    >
      {plan.error && !plan.data ? (
        <ErrorState error={plan.error} onRetry={reload} variant="compact" />
      ) : !plan.data ? (
        <p className="ui-hint">Loading…</p>
      ) : (
        // Re-mounted only when the stored steps or checkpoints change (not on a status-only poll).
        <div key={JSON.stringify([plan.data.checkpoints, plan.data.breakdown?.steps ?? plan.data.steps])}>
          <CheckpointsEditor assignmentId={assignmentId} plan={plan.data} disabled={archived} onSaved={reload} />
          <StepsEditor assignmentId={assignmentId} plan={plan.data} disabled={archived} onSaved={reload} />
        </div>
      )}
    </Card>
  );
}

export default TeacherPlanCard;
