import { useRef, useState } from 'react';
import { LuCamera, LuFileText } from 'react-icons/lu';
import { Alert, Button } from '../../../../components/common';
import { getErrorMessage } from '../../../../utils/errorHandler';
import assignmentService from '../../../assignments/services/assignment.service';

/** Friendly names for the fields the reader wasn't sure about. */
const FIELD_NAMES = { title: 'title', subject: 'subject', taskType: 'task type', dueDate: 'due date', estimatedMinutes: 'time needed' };

/**
 * "Have it on paper?" - fill a new assignment from a photo or PDF of it
 * (Phase 1, Teacher "Assigning work"). The server reads it (nothing is
 * stored) and suggests values; `onFill(result)` puts them in the form, where
 * the teacher checks and edits them as usual. Says which ones to check.
 */
export default function PhotoFillCard({ grade, onFill }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(null);

  const read = async (file) => {
    if (!file) return;
    setBusy(true);
    setOutcome(null);
    try {
      const { data } = await assignmentService.readAssignmentPhoto(file, { grade });
      if (data.readFailed) {
        setOutcome({ tone: 'warning', title: "We couldn't read that file", text: 'Try a clearer photo, or type the details below.' });
        return;
      }
      const filled = onFill(data);
      const check = (data.uncertain ?? []).map((n) => FIELD_NAMES[n]).filter(Boolean);
      setOutcome({
        tone: 'success',
        title: filled ? 'Filled from your file' : 'Read your file',
        text: check.length
          ? `Check every field before you publish - especially the ${check.join(', ')}.`
          : 'Check every field before you publish.',
      });
    } catch (err) {
      setOutcome({ tone: 'error', title: "We couldn't read that file", text: getErrorMessage(err) });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="af-photofill">
      <div className="af-photofill__row">
        <span className="af-photofill__icon" aria-hidden="true">
          <LuFileText />
        </span>
        <div className="af-photofill__text">
          <p className="af-photofill__title">Have it on paper?</p>
          <p className="af-photofill__hint">Take a photo or upload a PDF of the assignment - we&apos;ll fill in what we can read.</p>
        </div>
        <Button type="button" variant="secondary" size="sm" startIcon={<LuCamera />} loading={busy} onClick={() => input.current?.click()}>
          {busy ? 'Reading…' : 'Fill from a photo or PDF'}
        </Button>
        <input
          ref={input}
          type="file"
          accept="image/*,application/pdf"
          className="ui-sr-only"
          aria-label="Photo or PDF of the assignment"
          onChange={(e) => read(e.target.files?.[0])}
        />
      </div>
      {outcome && (
        <Alert variant={outcome.tone} title={outcome.title} onDismiss={() => setOutcome(null)} className="af-photofill__alert">
          {outcome.text}
        </Alert>
      )}
    </div>
  );
}
