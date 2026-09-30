import { useState } from 'react';
import { Alert, Button, Checkbox, Input, Modal, Select } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { formatDateKey, formatTime, toTimeInputValue } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import planService from '../services/plan.service';

const LENGTHS = [10, 15, 20, 25, 30, 40, 45, 60, 75, 90, 120].map((m) => ({ value: String(m), label: `${m} minutes` }));

/**
 * Move, resize or keep (pin) one study time. A moved block is kept where the
 * person put it - replanning works around it (PDF Q6: intentional manual
 * constraints are preserved). A stale edit (the plan changed meanwhile) is
 * refused by the server and the person is asked to look again.
 */
function BlockForm({ block, plan, studentId, onDone, onCancel }) {
  const timeZone = plan?.timezone;
  const [date, setDate] = useState(block.date);
  const [start, setStart] = useState(() => toTimeInputValue(block.startAt, { timeZone }));
  const [minutes, setMinutes] = useState(String(block.minutes));
  const [pinned, setPinned] = useState(Boolean(block.pinned));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const changedTime = date !== block.date || start !== toTimeInputValue(block.startAt, { timeZone }) || Number(minutes) !== block.minutes;

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await planService.updateBlock(studentId, block.id, {
        ...(changedTime ? { date, start, minutes: Number(minutes) } : {}),
        pinned: changedTime ? true : pinned,
        expectedVersion: plan?.version,
      });
      toast.success(changedTime ? 'Study time moved - the rest of the plan will fit around it' : 'Saved');
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate>
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}
      <p className="pl-muted" style={{ marginTop: 0 }}>
        {block.assignmentTitle ? `${block.assignmentTitle} · ` : ''}
        {formatDateKey(block.date, { weekday: 'long', month: 'long', day: 'numeric', year: undefined })}, {formatTime(block.startAt, { timeZone })}
      </p>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Input label="Day" type="date" value={date} min={plan?.today} onChange={(e) => setDate(e.target.value)} required />
        <Input label="Start time" type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
      </div>
      <Select label="Length" value={minutes} onChange={(e) => setMinutes(e.target.value)} options={LENGTHS} />
      <Checkbox
        label="Keep this study time where it is"
        checked={changedTime || pinned}
        disabled={changedTime}
        onChange={(e) => setPinned(e.target.checked)}
        description="Kept study times aren't moved when the plan updates."
      />
      <div className="pl-actions">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={saving}>
          Save
        </Button>
      </div>
    </form>
  );
}

export function StudyBlockDialog({ block, plan, studentId = 'me', onClose, onSaved }) {
  return (
    <Modal isOpen={Boolean(block)} onClose={onClose} title={block?.title ?? 'Study time'} size="md">
      {block && (
        <BlockForm
          key={block.id}
          block={block}
          plan={plan}
          studentId={studentId}
          onCancel={onClose}
          onDone={() => {
            onSaved?.();
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

export default StudyBlockDialog;
