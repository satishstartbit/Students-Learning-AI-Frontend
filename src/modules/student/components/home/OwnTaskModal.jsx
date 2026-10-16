import { useEffect, useMemo, useRef, useState } from 'react';
import { LuCamera, LuCheck, LuRotateCcw, LuTrash2, LuX } from 'react-icons/lu';
import { Alert, Button, ConfirmationModal, Modal } from '../../../../components/common';
import { toast } from '../../../../hooks/useToast';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { useStudentProfileOptions } from '../../../profile/hooks/useStudentProfileOptions';
import ShareWithTeacher from '../../../planner/components/ShareWithTeacher';
import WorkFormSections from '../../../planner/components/WorkFormSections';
import { useWorkTypeOptions } from '../../../planner/hooks/useWorkTypeOptions';
import { initialWorkValues, toOwnTaskValues, workFormErrors } from '../../../planner/workForm';
import studentTaskService from '../../services/studentTask.service';

/**
 * Add / view / edit a task the student tracks for themselves (backend:
 * /my-tasks). `mode` is 'type' or 'photo' for a new task - photo leads with
 * the picture and makes the title optional - or 'edit' with `task` set.
 * The fields are the shared work form (planner WorkFormSections, the teacher
 * form's look): Details (title, instructions, priority) and Subject & dates.
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
  const subjects = useStudentProfileOptions();
  const workTypes = useWorkTypeOptions();

  const [values, setValues] = useState(() => initialWorkValues({ task, defaultDueDate }));
  const { subject, workType } = values;
  const [photoFile, setPhotoFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const existingPhotoUrl = removePhoto ? null : task?.photo?.url ?? null;
  const hasPhoto = Boolean(photoFile || existingPhotoUrl);

  const subjectOptions = [...subjects.subjectOptions];
  // Keep the old task's label readable without offering it for a new choice.
  if (isEdit && subject === task?.subject && subject && !subjectOptions.some((o) => o.value === subject)) {
    subjectOptions.unshift({ value: subject, label: `${subject} (saved on this task)`, disabled: true });
  }

  const workTypeOptions = useMemo(() => {
    const opts = [...workTypes.options];
    // Same for a kind of work an admin has since switched off.
    if (workType && !opts.some((o) => o.value === workType)) opts.unshift({ value: workType, label: workType });
    return opts;
  }, [workTypes.options, workType]);

  const errors = workFormErrors(values, { titleRequired: !hasPhoto, maxMinutes: 600 });
  if (errors.title) errors.title = 'Give your task a title';
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

    const body = {
      ...toOwnTaskValues(values),
      ...(photoFile ? { photoFile } : {}),
      ...(isEdit && removePhoto && !photoFile ? { removePhoto: true } : {}),
    };

    run(
      'save',
      () => (isEdit ? studentTaskService.update(task.id, body) : studentTaskService.create(body)),
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

      <WorkFormSections
        values={values}
        onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
        errors={attempted ? errors : {}}
        subjectOptions={subjectOptions}
        subjectsLoading={subjects.loading}
        subjectHint="Choose from the subjects selected in your learning profile."
        subjectError={subjects.error ? 'Could not load profile subjects' : undefined}
        workTypeOptions={workTypeOptions}
        workTypesLoading={workTypes.loading}
        titleLabel="What do you need to do?"
        titlePlaceholder={mode === 'photo' ? 'e.g. Worksheet from the board' : 'e.g. Finish worksheet 6.2'}
        titleRequired={!hasPhoto}
        autoFocus={mode !== 'photo'}
        maxMinutes={600}
      />

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
