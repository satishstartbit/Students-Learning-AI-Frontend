import { useMemo, useState } from 'react';
import { Alert, Button, Checkbox, Input, Select } from '../../../components/common';
import { formatDateKey } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useOnboardingLookup } from '../../onboarding/hooks/useOnboardingLookup';
import intakeService from '../services/intake.service';

const longDate = (key) => formatDateKey(key, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const QUESTION = {
  title: 'What should we call it?',
  dueDate: 'When is it due?',
  subject: 'Which subject?',
};

/**
 * Asks only about what wasn't clear (PDF Q4): the uncertain facts are
 * highlighted with the words they came from; everything else is shown
 * pre-filled and can still be changed (Grade 6+). Grades 4-5 see only the
 * questions, with big one-tap date choices (Q14). Answers are saved as the
 * person's own and are never overwritten by a re-read.
 */
export function IntakeConfirm({ intake, guided = false, onConfirmed, onCancelled, onReread }) {
  const f = intake.fields;
  const subjects = useOnboardingLookup('subjects');
  const ask = new Set(intake.uncertain);
  const [title, setTitle] = useState(f.title.value ?? '');
  const [dueDate, setDueDate] = useState(f.dueDate.value ?? '');
  const [noDueDate, setNoDueDate] = useState(!ask.has('dueDate') && !f.dueDate.value);
  const [subject, setSubject] = useState(f.subject.value ?? '');
  const [minutes, setMinutes] = useState(f.estimatedMinutes.value ? String(f.estimatedMinutes.value) : '');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [attempted, setAttempted] = useState(false);

  const dateChoices = useMemo(() => [...new Set([...(f.dueDate.options ?? []), f.dueDate.value].filter(Boolean))], [f.dueDate]);
  const subjectOptions = useMemo(() => {
    const opts = subjects.options.map((o) => ({ value: o.value, label: o.label }));
    if (subject && !opts.some((o) => o.value === subject)) opts.unshift({ value: subject, label: subject });
    return opts;
  }, [subjects.options, subject]);

  const errors = {
    title: title.trim() ? null : 'Give the work a name',
    dueDate: !noDueDate && !dueDate ? 'Choose a date, or “No due date”' : null,
    minutes: minutes && !(Number.isInteger(Number(minutes)) && Number(minutes) >= 1 && Number(minutes) <= 1440) ? 'Whole minutes, 1 to 1440' : null,
  };

  const confirm = async (event) => {
    event.preventDefault();
    setAttempted(true);
    if (Object.values(errors).some(Boolean)) return;
    setBusy('save');
    setError(null);
    try {
      const { data } = await intakeService.confirmIntake(intake.id, {
        title: title.trim(),
        dueDate: noDueDate ? null : dueDate,
        subject: subject || null,
        estimatedMinutes: minutes ? Number(minutes) : null,
      });
      onConfirmed?.(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const act = async (kind, fn, after) => {
    setBusy(kind);
    setError(null);
    try {
      const { data } = await fn();
      after?.(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const found = (field) =>
    field.evidence && !field.confirmed ? <p className="pl-field-found">Found: “{field.evidence.slice(0, 120)}”</p> : null;
  const wrap = (name, children) =>
    ask.has(name) ? (
      <div className="pl-field--ask">
        <strong style={{ display: 'block', marginBottom: 6 }}>{QUESTION[name] ?? 'Please check this'}</strong>
        {children}
      </div>
    ) : (
      children
    );

  const showAll = !guided;
  const canReread = (intake.method === 'photo' || intake.method === 'document') && intake.reading?.failed;

  return (
    <form onSubmit={confirm} noValidate>
      {error && (
        <Alert variant="error" className="ui-field">
          {error}
        </Alert>
      )}
      {intake.screening === 'blocked' && (
        <Alert variant="info" className="ui-field">
          We couldn’t use those words to fill this in. Please type the details yourself.
        </Alert>
      )}
      {intake.lastError && intake.screening !== 'blocked' && (
        <Alert variant="info" className="ui-field">
          {intake.lastError}
        </Alert>
      )}
      {!intake.uncertain.length && !intake.lastError && <p className="pl-muted">Here’s what we found. Check it, then add it.</p>}

      {(showAll || ask.has('title')) &&
        wrap(
          'title',
          <>
            <Input label="Title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} error={attempted ? errors.title : undefined} />
            {found(f.title)}
          </>
        )}
      {guided && !ask.has('title') && title && <p className="pl-item__title" style={{ marginBottom: 12 }}>{title}</p>}

      {(showAll || ask.has('dueDate')) &&
        wrap(
          'dueDate',
          <>
            {dateChoices.length > 0 && (
              <div className="pl-choices" role="group" aria-label="Due date choices">
                {dateChoices.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="pl-choice"
                    aria-pressed={!noDueDate && dueDate === key}
                    onClick={() => {
                      setDueDate(key);
                      setNoDueDate(false);
                    }}
                  >
                    {longDate(key)}
                  </button>
                ))}
              </div>
            )}
            {!noDueDate && (
              <Input
                label={dateChoices.length ? 'Or pick another day' : 'Due date'}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                error={attempted ? errors.dueDate : undefined}
              />
            )}
            <Checkbox label="No due date" checked={noDueDate} onChange={(e) => setNoDueDate(e.target.checked)} />
            {found(f.dueDate)}
          </>
        )}

      {showAll && (
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Select
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            options={subjectOptions}
            placeholder="No subject"
            loading={subjects.loading}
          />
          <Input
            label="About how long? (minutes)"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            error={attempted ? errors.minutes : undefined}
          />
        </div>
      )}

      <div className="pl-actions">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={Boolean(busy)}
          loading={busy === 'cancel'}
          onClick={() => act('cancel', () => intakeService.cancelIntake(intake.id), onCancelled)}
        >
          Don’t add
        </Button>
        {canReread && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={Boolean(busy)}
            loading={busy === 'reread'}
            onClick={() => act('reread', () => intakeService.reextract(intake.id), onReread)}
          >
            Try reading again
          </Button>
        )}
        <Button type="submit" size={guided ? 'lg' : 'sm'} loading={busy === 'save'} disabled={Boolean(busy) && busy !== 'save'}>
          Add it
        </Button>
      </div>
    </form>
  );
}

export default IntakeConfirm;
