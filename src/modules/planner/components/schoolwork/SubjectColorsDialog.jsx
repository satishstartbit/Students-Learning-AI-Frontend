import { useState } from 'react';
import { Button, Modal } from '../../../../components/common';
import { subjectPaint } from '../../../../components/subjects/subjectColor';
import { toast } from '../../../../hooks/useToast';
import { getErrorMessage } from '../../../../utils/errorHandler';
import './schoolwork.css';

/**
 * "Customize subject colors": one colour per subject, used on every view and
 * every screen that shows the subject. Picks come from the palette (soft
 * enough for dark text on top) plus the school's own colours; Reset goes back
 * to the school's colour (Subjects master). Saved one subject at a time.
 *
 * `store` is useSchoolworkSettings(...) - the student's own or a child's.
 */
export function SubjectColorsEditor({ store }) {
  const [saving, setSaving] = useState(null);
  const { subjects, palette, update } = store;

  const choose = async (subject, color) => {
    setSaving(subject.key);
    try {
      await update({ subjectColors: { [subject.name]: color } });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  if (subjects.length === 0) return <p className="sw-muted">No subjects yet.</p>;

  return (
    <ul className="sw-colors">
      {subjects.map((subject) => (
        <li key={subject.key} className="sw-color-row" aria-busy={saving === subject.key || undefined}>
          <div className="sw-color-row__head">
            <span className="sw-chip" {...subjectPaint(subject.color)}>
              {subject.name}
            </span>
            {subject.custom && (
              <Button type="button" variant="secondary" size="sm" disabled={saving === subject.key} onClick={() => choose(subject, null)}>
                Reset
              </Button>
            )}
          </div>
          <div className="sw-swatches" role="radiogroup" aria-label={`Colour for ${subject.name}`}>
            {palette.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                className="sw-swatch"
                style={{ '--subject-color': color }}
                aria-checked={subject.color === color}
                aria-label={`${subject.name}: ${color}${color === subject.defaultColor ? ' (school colour)' : ''}`}
                disabled={saving === subject.key}
                onClick={() => subject.color !== color && choose(subject, color === subject.defaultColor ? null : color)}
              />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The editor in its own dialog (the Settings page). */
export function SubjectColorsDialog({ isOpen, onClose, store, whose = 'your' }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Subject colours"
      description={`Each subject keeps one colour on ${whose} sticky notes, list and calendar.`}
      size="md"
    >
      {isOpen && <SubjectColorsEditor store={store} />}
      <div className="sw-dialog__actions">
        <Button type="button" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}

export default SubjectColorsDialog;
