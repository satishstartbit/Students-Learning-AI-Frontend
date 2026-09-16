/**
 * Grade ranges on curriculum masters (task types, subjects, topics).
 *
 * A grade is its position on the Grade Levels master: Kindergarten = 0,
 * Grade 1 = 1 ... Grade 12 = 12. A null end is open, so null/null = all grades.
 */

const hasGrade = (value) => value !== null && value !== undefined && value !== '';

export const gradeShortLabel = (value) => (Number(value) === 0 ? 'K' : String(value));

export const gradeLongLabel = (value) => (Number(value) === 0 ? 'Kindergarten' : `Grade ${value}`);

/** "All grades", "K–5", "Grade 3 and up", "Up to Grade 2", "Grade 4". */
export function formatGradeRange(min, max) {
  if (!hasGrade(min) && !hasGrade(max)) return 'All grades';
  if (hasGrade(min) && hasGrade(max)) {
    return Number(min) === Number(max) ? gradeLongLabel(min) : `${gradeShortLabel(min)}–${gradeShortLabel(max)}`;
  }
  return hasGrade(min) ? `${gradeLongLabel(min)} and up` : `Up to ${gradeLongLabel(max)}`;
}

/** Form value ('' = open) -> API value (null = open). */
export const toGradeValue = (value) => (hasGrade(value) ? Number(value) : null);

/** useForm rule for a `maxGrade` field: not below the form's `minGrade`. */
export const gradeOrderRule = (value, values = {}) =>
  hasGrade(value) && hasGrade(values.minGrade) && Number(values.minGrade) > Number(value)
    ? 'Must be the same as or above "From grade"'
    : null;

/** API value -> form value. */
export const fromGradeValue = (value) => (hasGrade(value) ? String(value) : '');
