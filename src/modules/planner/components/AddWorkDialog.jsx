import { useMemo, useRef, useState } from 'react';
import { LuCamera, LuCircleCheck, LuFileText, LuMic, LuPencil, LuX } from 'react-icons/lu';
import { Alert, Button, Modal, Spinner, Textarea } from '../../../components/common';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useStudentProfileOptions } from '../../profile/hooks/useStudentProfileOptions';
import { useIntakeProgress } from '../hooks/useIntakeProgress';
import { useWorkTypeOptions } from '../hooks/useWorkTypeOptions';
import intakeService from '../services/intake.service';
import { hasErrors, initialWorkValues, toIntakeFields, workFormErrors } from '../workForm';
import IntakeConfirm from './IntakeConfirm';
import WorkFormSections from './WorkFormSections';
import VoiceRecorder from './VoiceRecorder';
import '../planner.css';

const MAX_FILES = 4;
const PHOTO_TYPES = 'image/jpeg,image/png,image/webp,image/heic,image/heif';

/**
 * Grade 6+ and parents' quick-add (Q14), in the teacher form's look
 * (WorkFormSections, 2026-10-13): created at once with no reading. A parent
 * with more than one child picks who it is for.
 */
function QuickAddForm({ studentId, childOptions, defaultDueDate, onCreated, onBack }) {
  const [forId, setForId] = useState(studentId);
  const subjects = useStudentProfileOptions(forId);
  const workTypes = useWorkTypeOptions();
  const [values, setValues] = useState(() => initialWorkValues({ defaultDueDate }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const errors = workFormErrors(values);

  const onChange = (field, value) => setValues((v) => ({ ...v, [field]: value }));
  const pickChild = (id) => {
    setForId(id);
    // Subjects come from each child's own profile.
    setValues((v) => ({ ...v, subject: '' }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setAttempted(true);
    if (hasErrors(errors)) return;
    setSaving(true);
    setError(null);
    try {
      const { data } = await intakeService.createIntake({ method: 'typed', studentId: forId, fields: toIntakeFields(values) });
      onCreated(data, forId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}
      <WorkFormSections
        values={values}
        onChange={onChange}
        errors={attempted ? errors : {}}
        subjectOptions={subjects.subjectOptions}
        subjectsLoading={subjects.loading}
        subjectHint="Only subjects selected in the student profile."
        subjectError={subjects.error ? 'Could not load profile subjects' : undefined}
        workTypeOptions={workTypes.options}
        workTypesLoading={workTypes.loading}
        forOptions={childOptions}
        forValue={forId}
        onForChange={pickChild}
        titleLabel="What do you need to do?"
        autoFocus
      />
      <div className="pl-actions">
        <Button type="button" variant="secondary" size="sm" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button type="submit" size="sm" loading={saving}>
          Add
        </Button>
      </div>
    </form>
  );
}

/** Free words (typed by a younger student, or a checked voice transcript) - read, then asked about. */
function WordsForm({ method, studentId, guided, maxSeconds, onCreated, onBack }) {
  const [text, setText] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onRecorded = async ({ blob, seconds }) => {
    setTranscribing(true);
    setError(null);
    try {
      const { data } = await intakeService.transcribe({ blob, seconds, studentId });
      setText(data.text ?? '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTranscribing(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { data } = await intakeService.createIntake({ method, text: text.trim(), studentId });
      onCreated(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}
      {method === 'voice' && <VoiceRecorder maxSeconds={maxSeconds} guided={guided} onRecorded={onRecorded} />}
      {transcribing && (
        <p className="pl-updating" style={{ marginTop: 12 }}>
          <Spinner size="sm" /> Writing down what you said…
        </p>
      )}
      {(method === 'typed' || text) && (
        <Textarea
          label={method === 'voice' ? 'Check the words' : 'What’s the work? Say when it’s due if you know.'}
          rows={guided ? 3 : 4}
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={method === 'typed' ? 'e.g. Spelling list for Friday' : undefined}
          autoFocus={method === 'typed'}
        />
      )}
      <div className="pl-actions">
        <Button type="button" variant="secondary" size="sm" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button type="submit" size={guided ? 'lg' : 'sm'} loading={saving} disabled={!text.trim() || transcribing}>
          Add
        </Button>
      </div>
    </form>
  );
}

/** Photos of a worksheet or a PDF - uploaded, then read in the background. */
function FilesForm({ method, studentId, guided, onCreated, onBack }) {
  const input = useRef(null);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const pick = (list) => {
    const next = [...files, ...list].slice(0, MAX_FILES);
    if (files.length + list.length > MAX_FILES) setError(`Up to ${MAX_FILES} files at a time.`);
    else setError(null);
    setFiles(next);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!files.length) return;
    setProgress(0);
    setError(null);
    try {
      const { data } = await intakeService.createIntake({ method, files, studentId, onProgress: setProgress });
      onCreated(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setProgress(null);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}
      <input
        ref={input}
        type="file"
        hidden
        multiple
        accept={method === 'photo' ? PHOTO_TYPES : 'application/pdf'}
        capture={method === 'photo' ? 'environment' : undefined}
        data-testid="add-work-files"
        onChange={(e) => {
          pick([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant={files.length ? 'secondary' : 'primary'}
        size={guided ? 'lg' : 'md'}
        startIcon={method === 'photo' ? <LuCamera aria-hidden="true" /> : <LuFileText aria-hidden="true" />}
        onClick={() => input.current?.click()}
        disabled={files.length >= MAX_FILES || progress !== null}
      >
        {method === 'photo' ? (files.length ? 'Add another photo' : 'Take or choose a photo') : files.length ? 'Add another PDF' : 'Choose a PDF'}
      </Button>
      {files.length > 0 && (
        <ul className="pl-files">
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}-${f.lastModified}`}>
              {f.name}
              <button
                type="button"
                className="pl-link"
                aria-label={`Remove ${f.name}`}
                onClick={() => setFiles((list) => list.filter((_, j) => j !== i))}
                disabled={progress !== null}
              >
                <LuX size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="pl-muted">We read it for you and only ask about anything that isn’t clear.</p>
      <div className="pl-actions">
        <Button type="button" variant="secondary" size="sm" onClick={onBack} disabled={progress !== null}>
          Back
        </Button>
        <Button type="submit" size={guided ? 'lg' : 'sm'} loading={progress !== null} disabled={!files.length}>
          {progress !== null && progress < 100 ? `Uploading ${progress}%` : 'Add'}
        </Button>
      </div>
    </form>
  );
}

function Progress({ intake: initial, guided, onFinished, onClose }) {
  const { intake, setIntake, stillReading, timedOut, error } = useIntakeProgress(initial);

  if (intake.status === 'created') {
    return (
      <div className="pl-reading">
        <LuCircleCheck size={40} aria-hidden="true" style={{ color: 'var(--color-success-solid)' }} />
        <p className="pl-item__title">Added{intake.fields?.title?.value ? `: ${intake.fields.title.value}` : ''}</p>
        <p className="pl-muted">Steps and study times are being made for it. You can change them anytime.</p>
        <Button type="button" onClick={onFinished}>
          Done
        </Button>
      </div>
    );
  }
  if (intake.status === 'cancelled') {
    return (
      <div className="pl-reading">
        <p className="pl-muted">Not added.</p>
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }
  if (stillReading) {
    return (
      <div className="pl-reading" aria-live="polite">
        <Spinner />
        <p className="pl-item__title">{intake.method === 'photo' || intake.method === 'document' ? 'Reading it…' : 'Working out the details…'}</p>
        <p className="pl-muted">This usually takes a few seconds.</p>
      </div>
    );
  }
  if ((timedOut || error) && ['received', 'extracting'].includes(intake.status)) {
    return (
      <div className="pl-reading">
        <p className="pl-muted">This is taking longer than usual. It will keep going - check back in a minute, it will be waiting for you.</p>
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }
  return (
    <IntakeConfirm
      key={`${intake.id}-${intake.updatedAt}`}
      intake={intake}
      guided={guided}
      onConfirmed={setIntake}
      onCancelled={setIntake}
      onReread={setIntake}
    />
  );
}

/**
 * Add work, any way (PDF Q4, Q13, Q14): type it, say it, a photo, or a PDF.
 * Everything ends in the same place - one piece of work with personal steps
 * and study times, labelled as added by the student or parent.
 *
 *   studentId   a parent adding for their child (omit for the student)
 *   childOptions  a parent's children ([{ value, label }]): "Type it" lets
 *               them pick who it is for (defaults to studentId)
 *   guided      Grades 4-5: voice/photo first, big buttons, fewer words
 *   intake      resume an intake that is waiting for answers
 *   method      open straight on one way in ('quick' | 'voice' | 'photo' |
 *               'document' | 'typed'); remount (key) to change it
 */
export function AddWorkDialog({
  isOpen,
  onClose,
  onAdded,
  studentId,
  childName,
  childOptions,
  guided = false,
  defaultDueDate,
  intake: resumed,
  method: initialMethod = null,
  maxVoiceSeconds = 90,
}) {
  const [method, setMethod] = useState(initialMethod);
  const [intake, setIntake] = useState(resumed ?? null);
  const current = intake ?? resumed ?? null;

  const methods = useMemo(
    () =>
      guided
        ? [
            { key: 'voice', icon: LuMic, title: 'Say it', hint: 'Tell us about it' },
            { key: 'photo', icon: LuCamera, title: 'Take a photo', hint: 'Of the worksheet' },
            { key: 'typed', icon: LuPencil, title: 'Type it', hint: 'A few words' },
          ]
        : [
            { key: 'quick', icon: LuPencil, title: 'Type it', hint: 'Add it yourself' },
            { key: 'voice', icon: LuMic, title: 'Say it', hint: 'A short voice note' },
            { key: 'photo', icon: LuCamera, title: 'Photo', hint: 'Snap the worksheet' },
            { key: 'document', icon: LuFileText, title: 'PDF', hint: 'From your teacher or school' },
          ],
    [guided]
  );

  // However the dialog is closed, the caller refreshes once if anything was sent.
  const close = () => {
    if (current) onAdded?.();
    setMethod(initialMethod);
    setIntake(null);
    onClose?.();
  };
  const created = (data) => setIntake(data);

  const title = childName ? `Add work for ${childName}` : 'Add work';
  const back = () => setMethod(null);

  return (
    <Modal isOpen={isOpen} onClose={close} title={title} size="md">
      {isOpen &&
        (current ? (
          <Progress intake={current} guided={guided} onFinished={close} onClose={close} />
        ) : !method ? (
          <div className={`pl-methods${guided ? ' pl-methods--guided' : ''}`}>
            {methods.map(({ key, icon: Icon, title: t, hint }) => (
              <button key={key} type="button" className="pl-method" onClick={() => setMethod(key)}>
                <Icon size={guided ? 32 : 20} aria-hidden="true" />
                <span className="pl-method__title">{t}</span>
                <span className="pl-method__hint">{hint}</span>
              </button>
            ))}
          </div>
        ) : method === 'quick' ? (
          <QuickAddForm studentId={studentId} childOptions={childOptions} defaultDueDate={defaultDueDate} onCreated={created} onBack={back} />
        ) : method === 'photo' || method === 'document' ? (
          <FilesForm method={method} studentId={studentId} guided={guided} onCreated={created} onBack={back} />
        ) : (
          <WordsForm method={method} studentId={studentId} guided={guided} maxSeconds={maxVoiceSeconds} onCreated={created} onBack={back} />
        ))}
    </Modal>
  );
}

export default AddWorkDialog;
