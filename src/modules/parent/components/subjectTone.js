/**
 * A stable tone per subject name, so "Math" is the same colour wherever a
 * parent sees it (Progress tasks, Learning Summary bars and activity rows).
 *
 * Hashed rather than mapped by name on purpose: subjects are admin-editable
 * master data, so a fixed lookup would leave every new subject uncoloured.
 * The tones are the sticky-note palette (theme/variables.css), applied via
 * `data-tone` in parentPanels.css.
 */
export const SUBJECT_TONES = ['blue', 'green', 'lavender', 'orange', 'pink', 'yellow'];

export function subjectTone(subject) {
  const text = String(subject ?? '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 997;
  return SUBJECT_TONES[hash % SUBJECT_TONES.length];
}

export default subjectTone;
