import { useState } from 'react';
import { LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import { Alert, Button, Checkbox, ConfirmationModal, ErrorState, IconButton, Input, Modal, Select } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { addDaysToKey, formatDateKey, getDateKey } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useSchoolworkSettings } from '../hooks/useSchoolworkSettings';
import planService from '../services/plan.service';

const WEEKDAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7].map((d) => ({
  value: String(d),
  label: formatDateKey(addDaysToKey('2026-09-28', d - 1), { weekday: 'long', year: undefined, month: undefined, day: undefined }),
}));
const weekdayName = (d) => WEEKDAY_OPTIONS.find((o) => o.value === String(d))?.label ?? '';

function describe(c) {
  const when = c.repeat === 'weekly' ? `Every ${weekdayName(c.weekday)}` : formatDateKey(c.date, { weekday: 'short', month: 'short', day: 'numeric' });
  return `${when} · ${c.allDay ? 'All day' : `${c.start}–${c.end}`}`;
}

function CommitmentForm({ studentId, commitment, categories = [], onDone, onCancel }) {
  const [title, setTitle] = useState(commitment?.title ?? '');
  const [category, setCategory] = useState(commitment?.category ?? '');
  const [repeat, setRepeat] = useState(commitment?.repeat ?? 'weekly');
  const [weekday, setWeekday] = useState(String(commitment?.weekday ?? 1));
  const [date, setDate] = useState(commitment?.date ?? getDateKey());
  const [allDay, setAllDay] = useState(Boolean(commitment?.allDay));
  const [start, setStart] = useState(commitment?.start ?? '17:00');
  const [end, setEnd] = useState(commitment?.end ?? '18:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [attempted, setAttempted] = useState(false);

  const errors = {
    title: title.trim() ? null : 'Say what it is, e.g. Hockey practice',
    end: !allDay && start && end && end <= start ? 'Must end after it starts' : null,
  };

  const save = async (event) => {
    event.preventDefault();
    setAttempted(true);
    if (errors.title || errors.end) return;
    setSaving(true);
    setError(null);
    const values = {
      title: title.trim(),
      category: category || null,
      repeat,
      ...(repeat === 'weekly' ? { weekday: Number(weekday) } : { date }),
      allDay,
      ...(allDay ? {} : { start, end }),
    };
    try {
      if (commitment) await planService.updateCommitment(studentId, commitment.id, values);
      else await planService.addCommitment(studentId, values);
      toast.success('Busy time saved - study times will move around it');
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
      <Input label="What is it?" value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} error={attempted ? errors.title : undefined} autoFocus />
      {categories.length > 0 && (
        <Select
          label="What kind of activity?"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={categories.map((c) => ({ value: c.code, label: `${c.icon ? `${c.icon} ` : ''}${c.name}` }))}
          placeholder="Choose one (optional)"
          hint="Its colour on the calendar. It never becomes schoolwork."
        />
      )}
      <Select
        label="How often"
        value={repeat}
        onChange={(e) => setRepeat(e.target.value)}
        options={[
          { value: 'weekly', label: 'Every week' },
          { value: 'once', label: 'Just once' },
        ]}
      />
      {repeat === 'weekly' ? (
        <Select label="Day" value={weekday} onChange={(e) => setWeekday(e.target.value)} options={WEEKDAY_OPTIONS} />
      ) : (
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      )}
      <Checkbox label="All day" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
      {!allDay && (
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Input label="From" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <Input label="To" type="time" value={end} onChange={(e) => setEnd(e.target.value)} error={attempted ? errors.end : undefined} />
        </div>
      )}
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

/**
 * Busy times (practice, family dinner, plans with friends, appointments): the
 * planner never puts study time on top of them, and they show on the full
 * calendar in their activity category's colour - never as schoolwork.
 */
export function CommitmentsEditor({ studentId = 'me', onChanged }) {
  const availability = useApi(planService.getAvailability, { immediate: true, args: [studentId] });
  const { categories, categoryOf } = useSchoolworkSettings(studentId);
  const [editing, setEditing] = useState(undefined); // undefined closed · null new · object edit
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    availability.run(studentId).catch(() => {});
    onChanged?.();
  };

  const remove = async () => {
    setBusy(true);
    try {
      await planService.deleteCommitment(studentId, removing.id);
      toast.success('Busy time removed');
      setRemoving(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const list = availability.data?.commitments ?? [];

  return (
    <div>
      {availability.error && !availability.data ? (
        <ErrorState error={availability.error} onRetry={reload} variant="compact" />
      ) : !availability.data ? (
        <p className="pl-muted">Loading…</p>
      ) : list.length === 0 ? (
        <p className="pl-muted">No busy times yet.</p>
      ) : (
        <ul className="pl-list">
          {list.map((c) => {
            const kind = categoryOf(c.category);
            return (
              <li key={c.id} className="pl-item" style={kind?.color ? { borderLeft: `4px solid ${kind.color}` } : undefined}>
                <div className="pl-item__main">
                  <p className="pl-item__title">{c.title}</p>
                  <p className="pl-item__meta">
                    {kind ? `${kind.icon ? `${kind.icon} ` : ''}${kind.name} · ` : ''}
                    {describe(c)}
                  </p>
                </div>
                <div className="pl-row">
                  <IconButton icon={<LuPencil aria-hidden="true" />} label={`Edit ${c.title}`} onClick={() => setEditing(c)} />
                  <IconButton icon={<LuTrash2 aria-hidden="true" />} label={`Remove ${c.title}`} onClick={() => setRemoving(c)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="pl-actions" style={{ justifyContent: 'flex-start' }}>
        <Button type="button" variant="secondary" size="sm" startIcon={<LuPlus aria-hidden="true" />} onClick={() => setEditing(null)}>
          Add a busy time
        </Button>
      </div>

      <Modal isOpen={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? 'Edit busy time' : 'Add a busy time'} size="md">
        {editing !== undefined && (
          <CommitmentForm
            key={editing?.id ?? 'new'}
            studentId={studentId}
            commitment={editing}
            categories={categories}
            onCancel={() => setEditing(undefined)}
            onDone={() => {
              setEditing(undefined);
              reload();
            }}
          />
        )}
      </Modal>
      <ConfirmationModal
        isOpen={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        loading={busy}
        variant="danger"
        title="Remove this busy time?"
        message={removing ? `"${removing.title}" won't block study time any more.` : ''}
        confirmLabel="Remove"
      />
    </div>
  );
}

export default CommitmentsEditor;
