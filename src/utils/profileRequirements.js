/**
 * Required details per role (user request 2026-10-21) - the same list and
 * messages as the backend's utils/profileRequirements.js, which refuses a
 * create or edit without them and tells GET /auth/me what is still missing
 * (`profileCompletion`). Keep the two in step.
 *
 * Keys are form field names: the account fields, a student's profile columns,
 * and a teacher's profile_data answers as the forms hold them.
 */
const MESSAGES = {
  lastName: 'Enter a last name',
  phone: 'Enter a phone number',
  grade: 'Choose a grade',
  date_of_birth: 'Enter the date of birth',
  gender: 'Choose a gender',
  subjects: 'Choose at least one subject',
  gradeLevels: 'Choose at least one grade you teach',
  yearsExperience: 'Enter the years of experience',
};

const TEACHER_SUBJECTS_MESSAGE = 'Choose at least one subject you teach';

export const REQUIRED_BY_ROLE = {
  STUDENT: ['lastName', 'grade', 'date_of_birth', 'gender', 'subjects'],
  TEACHER: ['lastName', 'phone', 'subjects', 'gradeLevels', 'yearsExperience'],
  PARENT: ['lastName', 'phone'],
};

export const requiredFields = (role) => REQUIRED_BY_ROLE[role] ?? [];

export const isRequiredField = (role, field) => requiredFields(role).includes(field);

export const requiredMessage = (role, field) =>
  role === 'TEACHER' && field === 'subjects' ? TEACHER_SUBJECTS_MESSAGE : MESSAGES[field];

// validation.js#required, repeated so this file loads under plain node:test (no bundler).
const isBlank = (value) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.filter((v) => !isBlank(v)).length === 0);
const requiredRule = (message) => (value) => (isBlank(value) ? message : null);

/** Years of experience: a whole number, 0 to 70 (the API's teacherProfile limit). */
export const yearsExperienceRule = (value) => {
  if (isBlank(value)) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 70 ? null : 'Enter whole years, 0 to 70';
};

/**
 * A useForm validationSchema with the role's required fields added in front of
 * the form's own rules: `withRequiredFields('PARENT', { phone: [phoneRule()] })`.
 * `fields` limits it to the ones this form shows (sign-up asks for the last
 * name only; the rest waits for "Complete your profile").
 */
export function withRequiredFields(role, schema = {}, { fields } = {}) {
  const merged = { ...schema };
  for (const field of requiredFields(role)) {
    if (fields && !fields.includes(field)) continue;
    merged[field] = [requiredRule(requiredMessage(role, field)), ...[schema[field] ?? []].flat()];
  }
  return merged;
}
