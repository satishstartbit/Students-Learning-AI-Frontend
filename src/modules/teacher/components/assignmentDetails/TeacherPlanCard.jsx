import { useState } from 'react';
import { LuArrowDown, LuArrowUp, LuPlus, LuTrash2 } from 'react-icons/lu';
import { Alert, Button, Card, ConfirmationModal, ErrorState, IconButton, Input, Select } from '../../../../components/common';
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

function StepsEditor({ assignmentId, plan, disabled, onSaved }) {
  const [rows, setRows] = useState(() => plan.steps.map((s) => ({ title: s.title, minutes: s.minutes ? String(s.minutes) : '', checkpointId: s.checkpointId ?? '' })));
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);
  const checkpointOptions = plan.checkpoints.map((c) => ({ value: c.id, label: c.title }));

  const invalid = rows.some((r) => !r.title.trim() || (r.minutes && !(Number(r.minutes) >= 1 && Number(r.minutes) <= 600)));

  const send = async (steps, message) => {
    setSaving(true);
    setError(null);
    try {
      await assignmentService.setTeacherPlan(assignmentId, steps);
      toast.success(message);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setClearing(false);
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
    <div className="ui-field">
      <h3 className="ui-statcard__label">Your steps</h3>
      <p className="ui-hint" style={{ marginTop: 0 }}>
        Optional. Every student gets these as required steps instead of suggested ones. Steps a student already finished stay finished.
        Without your steps, each student gets personal suggested steps they can change.
      </p>
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}
      {rows.map((r, i) => (
        <div
          key={`step-${i}`}
          style={{ ...rowStyle, gridTemplateColumns: checkpointOptions.length ? 'minmax(0, 2fr) 110px minmax(0, 1fr) auto' : 'minmax(0, 2fr) 110px auto' }}
        >
          <Input
            label={`Step ${i + 1}`}
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
      {!disabled && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            startIcon={<LuPlus aria-hidden="true" />}
            disabled={rows.length >= 20}
            onClick={() => setRows((list) => [...list, { title: '', minutes: '', checkpointId: '' }])}
          >
            Add step
          </Button>
          <Button
            type="button"
            size="sm"
            loading={saving && !clearing}
            disabled={invalid || !rows.length || saving}
            onClick={() =>
              send(
                rows.map((r) => ({ title: r.title.trim(), minutes: r.minutes ? Number(r.minutes) : null, checkpointId: r.checkpointId || null })),
                'Steps saved for every student'
              )
            }
          >
            Save steps for every student
          </Button>
          {plan.steps.length > 0 && (
            <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => setClearing(true)}>
              Remove my steps
            </Button>
          )}
        </div>
      )}
      <ConfirmationModal
        isOpen={clearing}
        onClose={() => setClearing(false)}
        onConfirm={() => send(null, 'Your steps are no longer required - students can change them')}
        loading={saving}
        title="Remove your steps?"
        message="Students keep the steps they have, but they're no longer required, so each student can change them."
        confirmLabel="Remove"
      />
    </div>
  );
}

/**
 * Checkpoints and the teacher's own steps for THEIR assignment (PDF Q3, Q5).
 * No approval queue: students get plans straight away; this is optional
 * correction that supersedes suggested steps.
 */
export function TeacherPlanCard({ assignmentId, archived }) {
  const plan = useApi(assignmentService.getTeacherPlan, { immediate: true, args: [assignmentId] });
  const reload = () => plan.run(assignmentId).catch(() => {});

  return (
    <Card
      title="Steps and checkpoints"
      subtitle="Students get personal steps and study times automatically. Add your own to make them the same for everyone."
      className="ui-field"
    >
      {plan.error && !plan.data ? (
        <ErrorState error={plan.error} onRetry={reload} variant="compact" />
      ) : !plan.data ? (
        <p className="ui-hint">Loading…</p>
      ) : (
        <div key={JSON.stringify([plan.data.checkpoints, plan.data.steps])}>
          <CheckpointsEditor assignmentId={assignmentId} plan={plan.data} disabled={archived} onSaved={reload} />
          <StepsEditor assignmentId={assignmentId} plan={plan.data} disabled={archived} onSaved={reload} />
        </div>
      )}
    </Card>
  );
}

export default TeacherPlanCard;
