/**
 * Grade bands - which student experience a grade gets.
 *
 * Kindergarten through Grade 5 get the K-5 "My Learning Space" experience
 * (layouts/KidLayout.jsx); Grade 6 and up, and any student whose grade is
 * unknown, keep the standard student layout.
 *
 * Grades arrive as free text from the Master Management "grade_levels" list
 * ("Kindergarten", "Grade 1" ... "Grade 12"), so this also accepts the other
 * spellings Canadian schools use - Ontario's JK/SK, Quebec's "maternelle",
 * "1re année" - rather than assuming one naming scheme.
 */

/** The highest grade that gets the K-5 experience. */
export const JUNIOR_MAX_GRADE = 5;

const KINDERGARTEN_PATTERN =
  /^(k|kg|jk|sk|pre-?k|kindergarten|junior kindergarten|senior kindergarten|(pr[eé])?maternelle)$/i;

/**
 * "Grade 3" -> 3, "Kindergarten" / "JK" -> 0, "2e année" -> 2.
 * Returns null when the value is empty or unrecognised.
 */
export function parseGradeNumber(grade) {
  if (grade === null || grade === undefined) return null;

  const value = String(grade).trim();
  if (!value) return null;
  if (KINDERGARTEN_PATTERN.test(value)) return 0;

  const match = value.match(/\d{1,2}/);
  return match ? Number(match[0]) : null;
}

/** True for Kindergarten to Grade 5. Unknown grades are not junior. */
export function isJuniorGrade(grade) {
  const number = parseGradeNumber(grade);
  return number !== null && number <= JUNIOR_MAX_GRADE;
}

export default { JUNIOR_MAX_GRADE, parseGradeNumber, isJuniorGrade };
