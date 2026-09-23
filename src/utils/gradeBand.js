/**
 * Grade bands - which student experience a grade gets.
 *
 * Kindergarten up to and including the band's top grade get the kid
 * "My Learning Space" experience (layouts/KidLayout.jsx); the grades above
 * it, and any student whose grade is unknown, keep the standard student
 * layout.
 *
 * Where the band ends is configuration, not a constant: set VITE_KIDS_UI in
 * the frontend .env (the backend has the matching KIDS_UI - see
 * utils/gradeBand.js there, used by the reminder sweep). Keep the two in
 * step, or a student can get the kid UI while the server treats them as an
 * older student.
 *
 *   VITE_KIDS_UI=K-5   Kindergarten to Grade 5 (default)
 *   VITE_KIDS_UI=K-6   Kindergarten to Grade 6
 *   VITE_KIDS_UI=K     Kindergarten only
 *
 * "Grade 6", "6" and "K-6" all mean the same thing, so a value typed either
 * way works.
 *
 * Grades arrive as free text from the Master Management "grade_levels" list
 * ("Kindergarten", "Grade 1" ... "Grade 12"), so this also accepts the other
 * spellings Canadian schools use - Ontario's JK/SK, Quebec's "maternelle",
 * "1re année" - rather than assuming one naming scheme.
 */

const KINDERGARTEN_PATTERN =
  /^(k|kg|jk|sk|pre-?k|kindergarten|junior kindergarten|senior kindergarten|(pr[eé])?maternelle)$/i;

/** Used when KIDS_UI is missing or unreadable. */
export const DEFAULT_KIDS_UI = 'K-5';
const HIGHEST_GRADE = 12;

/**
 * "2e année" -> 2, "Kindergarten" / "JK" -> 0, "Grade 3" -> 3.
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

/**
 * The top grade of the kid band from a KIDS_UI value: "K-5" -> 5, "K-6" -> 6,
 * "K" -> 0. Falls back to the default (with a warning) when the value makes
 * no sense, so a typo can never leave the app with no student UI at all.
 */
export function parseKidsBand(value, { fallback = DEFAULT_KIDS_UI } = {}) {
  const raw = String(value ?? '').trim();
  const fallbackMax = fallback === DEFAULT_KIDS_UI ? 5 : parseKidsBand(fallback, { fallback: DEFAULT_KIDS_UI });

  if (!raw) return fallbackMax;
  if (KINDERGARTEN_PATTERN.test(raw)) return 0;

  // The last number wins, so "K-6", "Grade 6" and "6" all read as 6.
  const numbers = raw.match(/\d{1,2}/g);
  if (!numbers) {
    console.warn(`[gradeBand] KIDS_UI="${raw}" is not a grade band - falling back to ${fallback}.`);
    return fallbackMax;
  }

  const max = Number(numbers[numbers.length - 1]);
  if (!Number.isInteger(max) || max < 0 || max > HIGHEST_GRADE) {
    console.warn(`[gradeBand] KIDS_UI="${raw}" is outside Kindergarten-Grade ${HIGHEST_GRADE} - falling back to ${fallback}.`);
    return fallbackMax;
  }
  return max;
}

/** The highest grade that gets the kid experience, from VITE_KIDS_UI. */
export const JUNIOR_MAX_GRADE = parseKidsBand(import.meta.env.VITE_KIDS_UI);

/** "K-5" - the configured band, for copy and debugging. */
export const KIDS_UI_LABEL = JUNIOR_MAX_GRADE === 0 ? 'K' : `K-${JUNIOR_MAX_GRADE}`;

/**
 * True for Kindergarten up to `maxGrade` (the configured top grade by
 * default). Unknown grades are never junior.
 *
 * `maxGrade` is passed in when the server has reported its own band
 * (GET /auth/me -> gradeBand.juniorMaxGrade), so changing KIDS_UI on the
 * server takes effect without rebuilding the frontend; VITE_KIDS_UI is the
 * fallback for anything that has no server answer yet.
 */
export function isJuniorGrade(grade, maxGrade = JUNIOR_MAX_GRADE) {
  const number = parseGradeNumber(grade);
  const top = Number.isInteger(maxGrade) ? maxGrade : JUNIOR_MAX_GRADE;
  return number !== null && number <= top;
}

/**
 * Must this student check in before their work screens open?
 *
 * Mandatory inside the kid band, optional above it: the daily check-in is
 * part of how the K-5 day starts, while an older student decides for
 * themselves whether to record one - Assignments, Plan, Focus and the
 * assistant stay open either way (modules/checkIn/components/
 * RequireCheckIn.jsx).
 *
 * Which grades that covers is KIDS_UI, so moving the band moves this rule
 * with it. The server sends its own answer with GET /auth/me
 * (gradeBand.checkInRequired) and that wins; this is the VITE_KIDS_UI
 * fallback for before it arrives.
 */
export function isCheckInRequired(grade, maxGrade = JUNIOR_MAX_GRADE) {
  return isJuniorGrade(grade, maxGrade);
}

export default {
  JUNIOR_MAX_GRADE,
  KIDS_UI_LABEL,
  DEFAULT_KIDS_UI,
  parseGradeNumber,
  parseKidsBand,
  isJuniorGrade,
  isCheckInRequired,
};
