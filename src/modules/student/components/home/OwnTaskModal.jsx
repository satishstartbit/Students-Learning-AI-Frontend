import { useEffect, useMemo, useRef, useState } from 'react';
import { LuCamera, LuCheck, LuRotateCcw, LuTrash2, LuX } from 'react-icons/lu';
import { Alert, Button, ConfirmationModal, Input, Modal, Select, Textarea } from '../../../../components/common';
import { toast } from '../../../../hooks/useToast';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { useOnboardingLookup } from '../../../onboarding/hooks/useOnboardingLookup';
import ShareWithTeacher from '../../../planner/components/ShareWithTeacher';
import studentTaskService from '../../services/studentTask.service';

/**
 * Add / view / edit a task the student tracks for themselves (backend:
 * /my-tasks). `mode` is 'type' or 'photo' for a new task - photo leads with
 * the picture and makes the title optional - or 'edit' with `task` set.
 */

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function PhotoField({ file, existingUrl, onPick, onClear, emphasis }) {
  const inputRef = useRef(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const shown = previewUrl ?? existingUrl;

  return (
    <div className="ui-field">
      <span className="ui-label">Photo{emphasis ? '' : ' (optional)'}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        hidden
        data-testid="own-task-photo-input"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = '';
          if (picked) onPick(picked);
        }}
      />
      {shown ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <img
            src={shown}
            alt="Task photo"
            style={{ width: 140, height: 104, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)' }}
          />
          <Button type="button" variant="secondary" size="sm" startIcon={<LuCamera aria-hidden="true" />} onClick={() => inputRef.current?.click()}>
            Replace
          </Button>
          <Button type="button" variant="ghost" size="sm" startIcon={<LuX aria-hidden="true" />} onClick={onClear}>
            Remove
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant={emphasis ? 'primary' : 'secondary'}
          size="sm"
          startIcon={<LuCamera aria-hidden="true" />}
          onClick={() => inputRef.current?.click()}
        >
          Take or choose a photo
        </Button>
      )}
    </div>
  );
}

function OwnTaskForm({ mode, task, defaultDueDate, onDone, onCancel }) {
  const isEdit = mode === 'edit';
  const subjects = useOnboardingLookup('subjects');

  const [title, setTitle] = useState(task?.title ?? '');
  const [subject, setSubject] = useState(task?.subject ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDueDate ?? '');
  const [minutes, setMinutes] = useState(task?.estimatedMinutes ? String(task.estimatedMinutes) : '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [photoFile, setPhotoFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const existingPhotoUrl = removePhoto ? null : task?.photo?.url ?? null;
  const hasPhoto = Boolean(photoFile || existingPhotoUrl);

  const subjectOptions = useMemo(() => {
    const opts = subjects.options.map((o) => ({ value: o.value, label: o.label }));
    // Keep a saved subject selectable even if it's since been removed from the list.
    if (subject && !opts.some((o) => o.value === subject)) opts.unshift({ value: subject, label: subject });
    return opts;
  }, [subjects.options, subject]);

  const minutesNumber = minutes === '' ? null : Number(minutes);
  const errors = {
    title: !title.trim() && !hasPhoto ? 'Give your task a title' : null,
    minutes:
      minutesNumber !== null && (!Number.isInteger(minutesNumber) || minutesNumber < 1 || minutesNumber > 600)
        ? 'Use a whole number from 1 to 600'
        : null,
  };
  const invalid = Object.values(errors).some(Boolean);

  const pickPhoto = (file) => {
    if (file.size > MAX_PHOTO_BYTES) {
      setError('That photo is too big - choose one under 10 MB.');
      return;
    }
    setError(null);
    setPhotoFile(file);
    setRemovePhoto(false);
  };

  const run = async (kind, fn, successMessage) => {
    setBusy(kind);
    setError(null);
    try {
      await fn();
      if (successMessage) toast.success(successMessage);
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAttempted(true);
    if (invalid || busy) return;

    const values = {
      title: title.trim(),
      subject,
      dueDate,
      estimatedMinutes: minutes === '' ? '' : minutesNumber,
      description: description.trim(),
      ...(photoFile ? { photoFile } : {}),
      ...(isEdit && removePhoto && !photoFile ? { removePhoto: true } : {}),
    };

    run(
      'save',
      () => (isEdit ? studentTaskService.update(task.id, values) : studentTaskService.create(values)),
      isEdit ? 'Task saved' : 'Task added to your day'
    );
  };

  const done = task?.status === 'completed';

  // A parent added this for the student (PDF Q15): they can finish it, not rewrite or delete it.
  if (isEdit && task?.canEdit === false) {
    return (
      <div>
        {error && (
          <Alert variant="error" className="ui-field">
            {error}
          </Alert>
        )}
        <Alert variant="info" className="ui-field">
          Your parent added this task. You can mark it done - ask them if something about it needs to change.
        </Alert>
        <p className="ui-label" style={{ marginBottom: 4 }}>
          {task.title}
        </p>
        {task.description && <p className="ui-hint" style={{ whiteSpace: 'pre-wrap' }}>{task.description}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={Boolean(busy)}>
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            loading={busy === 'toggle'}
            startIcon={done ? <LuRotateCcw aria-hidden="true" /> : <LuCheck aria-hidden="true" />}
            onClick={() => run('toggle', () => studentTaskService.update(task.id, { completed: !done }), done ? 'Moved back to your list' : 'Nice - task done!')}
          >
            {done ? 'Not done yet' : 'Mark done'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}

      {mode === 'photo' && (
        <PhotoField file={photoFile} existingUrl={null} onPick={pickPhoto} onClear={() => setPhotoFile(null)} emphasis />
      )}

      <Input
        label="What do you need to do?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={mode === 'photo' ? 'e.g. Worksheet from the board' : 'e.g. Finish worksheet 6.2'}
        maxLength={255}
        required={!hasPhoto}
        hint={hasPhoto && !title.trim() ? 'Optional with a photo' : undefined}
        error={attempted ? errors.title : undefined}
        autoFocus={mode !== 'photo'}
      />

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Select
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          options={subjectOptions}
          placeholder="No subject"
          loading={subjects.loading}
        />
        <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <Input
        label="How long will it take? (minutes)"
        type="number"
        inputMode="numeric"
        min={1}
        max={600}
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        error={attempted ? errors.minutes : undefined}
      />

      <Textarea label="Notes" rows={3} value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />

      {mode !== 'photo' && (
        <PhotoField
          file={photoFile}
          existingUrl={existingPhotoUrl}
          onPick={pickPhoto}
          onClear={() => {
            setPhotoFile(null);
            if (task?.photo) setRemovePhoto(true);
          }}
        />
      )}

      {isEdit && <ShareWithTeacher workId={task.id} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-sm)', flexWrap: 'wrap', marginTop: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          {isEdit && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={busy === 'toggle'}
                disabled={Boolean(busy)}
                startIcon={done ? <LuRotateCcw aria-hidden="true" /> : <LuCheck aria-hidden="true" />}
                onClick={() =>
                  run('toggle', () => studentTaskService.update(task.id, { completed: !done }), done ? 'Moved back to your list' : 'Nice - task done!')
                }
              >
                {done ? 'Not done yet' : 'Mark done'}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={busy === 'delete'}
                disabled={Boolean(busy)}
                startIcon={<LuTrash2 aria-hidden="true" />}
                onClick={() => setConfirmingDelete(true)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={Boolean(busy)}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={busy === 'save'} disabled={Boolean(busy) && busy !== 'save'}>
            {isEdit ? 'Save' : 'Add task'}
          </Button>
        </div>
      </div>

      {/* The app's own confirm dialog - never the browser's. */}
      <ConfirmationModal
        isOpen={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          run('delete', () => studentTaskService.remove(task.id), 'Task deleted');
        }}
        loading={busy === 'delete'}
        variant="danger"
        title="Delete this task?"
        message={task ? `"${task.title}" will be removed from your day. This can't be undone.` : ''}
        confirmLabel="Delete task"
      />
    </form>
  );
}

const TITLES = { type: 'Add a task', photo: 'Add a task from a photo', edit: 'Your task' };

export function OwnTaskModal({ mode, task, defaultDueDate, onClose, onChanged }) {
  const isOpen = Boolean(mode);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={TITLES[mode] ?? 'Task'}
      description={
        mode === 'edit'
          ? task?.canEdit === false
            ? 'Added by your parent.'
            : 'You and your parents can see tasks you add. A teacher sees one only if you share it.'
          : 'You and your parents can see this - it shows up in your day.'
      }
      size="md"
    >
      {isOpen && (
        <OwnTaskForm
          key={task?.id ?? mode}
          mode={mode}
          task={task}
          defaultDueDate={defaultDueDate}
          onCancel={onClose}
          onDone={() => {
            onChanged?.();
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

export default OwnTaskModal;
