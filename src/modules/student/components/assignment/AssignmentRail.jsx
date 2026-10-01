import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LuBookOpen,
  LuClock3,
  LuFileText,
  LuImage,
  LuInfo,
  LuPlay,
  LuPlus,
  LuStickyNote,
  LuTimer,
} from 'react-icons/lu';
import { toast } from '../../../../hooks/useToast';
import { formatDate, formatDateKey, formatDurationLong } from '../../../../utils/date';
import { formatFileSize } from '../../../../utils/format';
import { getErrorMessage } from '../../../../utils/errorHandler';
import assignmentService from '../../../assignments/services/assignment.service';
import { PRIORITY_LABELS, WORK_MODE_LABELS, personName } from './assignmentLabels';

/**
 * The right rail of the Grade 6+ assignment page: what the task asks for, the
 * next step (with a link straight into a focus session on it) - or, once the
 * work is handed in, its status - the files for it, the student's notes
 * about it, and the plain details.
 *
 * Everything here is real data: the overview is the teacher's own
 * instructions, resources are the teacher's files plus anything the student
 * attached, and notes are the student's sticky notes tied to this assignment.
 */

const FILE_KIND = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return { label: 'Image', icon: LuImage };
  if (mimeType === 'application/pdf') return { label: 'PDF', icon: LuFileText };
  return { label: 'Doc', icon: LuFileText };
};

export function OverviewCard({ assignment }) {
  const teacherName = personName(assignment.createdBy);

  return (
    <section className="ad-card" aria-labelledby="ad-overview-title">
      <h2 id="ad-overview-title" className="ad-card__title">
        <LuBookOpen size={15} aria-hidden="true" /> Assignment overview
      </h2>
      {assignment.description ? (
        <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{assignment.description}</p>
      ) : (
        <p className="ad-card__hint" style={{ marginTop: 10 }}>
          Your teacher didn&apos;t add instructions for this one. Ask them if you&apos;re unsure what to do.
        </p>
      )}
      {assignment.description && (
        <p className="ad-foot">
          From your teacher{teacherName ? `, ${teacherName}` : ''}.
        </p>
      )}
    </section>
  );
}

export function NextStepCard({ assignmentId, step, allDone, hasSteps }) {
  return (
    <section className="ad-card" aria-labelledby="ad-next-title">
      <h2 id="ad-next-title" className="ad-card__title">
        <LuClock3 size={15} aria-hidden="true" /> Next step
      </h2>

      {!hasSteps ? (
        <>
          <p className="ad-next__desc" style={{ marginTop: 10 }}>
            Break this into steps first, then start with the one at the top.
          </p>
          <Link className="ad-start" to={`/student/focus?assignment=${assignmentId}`}>
            <LuPlay size={14} aria-hidden="true" /> Open focus
          </Link>
        </>
      ) : allDone ? (
        <p className="ad-next__desc" style={{ marginTop: 10 }}>
          Every step is done. Nice work - hand it in when you&apos;re ready.
        </p>
      ) : (
        <>
          <p className="ad-next__title">{step.title}</p>
          {step.estimatedMinutes ? (
            <p className="ad-next__desc">
              <LuClock3 size={12} aria-hidden="true" /> Estimated {formatDurationLong(step.estimatedMinutes)}
            </p>
          ) : null}
          <Link className="ad-start" to={`/student/focus?assignment=${assignmentId}&step=${step.id}`}>
            <LuPlay size={14} aria-hidden="true" /> Start work
          </Link>
          <p className="ad-foot">Opens a focus session with this step selected.</p>
        </>
      )}
    </section>
  );
}

/** In place of "Next step" once the work is handed in: where it stands now. */
export function StatusCard({ reviewed, stepsDone }) {
  return (
    <section className="ad-card" aria-labelledby="ad-status-title">
      <h2 id="ad-status-title" className="ad-card__title">
        <LuTimer size={15} aria-hidden="true" /> Status
      </h2>
      <p className="ad-status__title">{reviewed ? 'All done!' : 'Handed in'}</p>
      <p className="ad-next__desc">
        {reviewed
          ? stepsDone
            ? 'Every step is finished and your work has been reviewed.'
            : 'Your work has been reviewed.'
          : 'Your teacher will check it soon. Nothing else to do for now.'}
      </p>
    </section>
  );
}

export function ResourcesCard({ assignmentId, teacherFiles = [], myFiles = [], canAttach, onUploaded }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const upload = async (event) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    if (!files.length) return;
    setBusy(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      await assignmentService.addAssignmentFiles(assignmentId, formData);
      toast.success(files.length === 1 ? 'File added' : 'Files added');
      await onUploaded?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const rows = [
    ...teacherFiles.map((f) => ({ ...f, mine: false })),
    ...myFiles.map((f) => ({ ...f, mine: true })),
  ];

  return (
    <section className="ad-card" aria-labelledby="ad-resources-title">
      <h2 id="ad-resources-title" className="ad-card__title">
        <LuFileText size={15} aria-hidden="true" /> Resources
      </h2>

      {rows.length === 0 ? (
        <p className="ad-card__hint" style={{ marginTop: 10 }}>
          No files yet.
        </p>
      ) : (
        <ul className="ad-resources">
          {rows.map((file) => {
            const kind = FILE_KIND(file.mimeType);
            const Icon = kind.icon;
            return (
              <li key={file.id}>
                <a className="ad-resource" href={file.url} target="_blank" rel="noopener noreferrer">
                  <Icon size={15} aria-hidden="true" />
                  <span className="ad-resource__name">
                    {file.originalFilename}
                    {file.mine ? ' (yours)' : ''}
                  </span>
                  <span className="ad-resource__kind">{kind.label}</span>
                  <span className="ui-hint" style={{ flex: 'none', fontSize: 10 }}>
                    {formatFileSize(file.fileSize)}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {canAttach && (
        <>
          <input ref={inputRef} type="file" multiple hidden onChange={upload} data-testid="ad-file-input" />
          <button type="button" className="ad-dropzone" onClick={() => inputRef.current?.click()} disabled={busy}>
            <LuPlus size={14} aria-hidden="true" /> {busy ? 'Adding…' : 'Add a file'}
          </button>
        </>
      )}
    </section>
  );
}

export function NotesCard({ notes, onAdd, onOpen }) {
  return (
    <section className="ad-card" aria-labelledby="ad-notes-title">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 id="ad-notes-title" className="ad-card__title">
          <LuStickyNote size={15} aria-hidden="true" /> Notes
        </h2>
        <button type="button" className="ad-textlink" onClick={onAdd} aria-label="Add a note">
          <LuPlus size={13} aria-hidden="true" /> Add
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="ad-card__hint" style={{ marginTop: 10 }}>
          Anything your teacher said, or something to remember - keep it here.
        </p>
      ) : (
        <ul className="ad-notes">
          {notes.map((note) => (
            <li key={note.id}>
              <button type="button" className="ad-note" data-tone={note.tone} data-done={note.done || undefined} onClick={() => onOpen(note)}>
                {note.title ? <strong style={{ display: 'block' }}>{note.title}</strong> : null}
                {note.content}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DetailsCard({ assignment }) {
  const rows = [
    ['Type', assignment.taskType?.name ?? '—'],
    ['Subject', assignment.subject ?? '—'],
    // A due date is a calendar day, not an instant.
    ['Due', assignment.dueDate ? formatDateKey(assignment.dueDate, { weekday: 'short', month: 'short', day: 'numeric', year: undefined }) : '—'],
    ['Priority', PRIORITY_LABELS[assignment.priority] ?? '—'],
    ['Doing it', WORK_MODE_LABELS[assignment.workMode] ?? '—'],
    ['Added by', personName(assignment.createdBy) || '—'],
    ['Date created', assignment.createdAt ? formatDate(assignment.createdAt) : '—'],
  ];

  return (
    <section className="ad-card" aria-labelledby="ad-details-title">
      <h2 id="ad-details-title" className="ad-card__title">
        <LuInfo size={15} aria-hidden="true" /> Details
      </h2>
      <dl className="ad-details">
        {rows.map(([label, value]) => (
          <div className="ad-detail" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
