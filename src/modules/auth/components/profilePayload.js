/**
 * Shapes the flat role-profile form values into the `profile` object the API
 * expects.
 *
 * Kept out of RoleProfileFields.jsx so that file exports only a component -
 * mixing components and helpers in one module breaks fast refresh.
 *
 * Teacher fields nest under profile_data; Student and Parent map to flat
 * columns. Keys match the profile table columns exactly.
 */

/** A comma string ("Maths, Science") or an array from a master multi-select - always out as an array. */
function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * A master multi-select value ready to join back into the TEXT column
 * Student profiles have always used - so switching that field to a master
 * picker needed no migration.
 */
function toCsv(value) {
  return Array.isArray(value) ? value.filter(Boolean).join(', ') : value;
}

export function buildProfilePayload(role, values) {
  const pick = (keys) =>
    Object.fromEntries(
      keys.map((k) => [k, values[k]]).filter(([, v]) => v !== undefined && v !== '')
    );

  if (role === 'STUDENT') {
    // Strengths/Challenges/Interests/Subjects are TEXT columns, not arrays -
    // the master picker produces an array, so it is joined back to a string
    // here rather than migrating the schema.
    const shaped = {
      ...values,
      strengths: toCsv(values.strengths),
      challenges: toCsv(values.challenges),
      interests: toCsv(values.interests),
      subjects: toCsv(values.subjects),
    };

    return Object.fromEntries(
      [
        'grade',
        'preferred_working_style',
        'focus_habits',
        'strengths',
        'challenges',
        'interests',
        'subjects',
        'profile_notes',
        'date_of_birth',
        'gender',
      ]
        .map((k) => [k, shaped[k]])
        .filter(([, v]) => v !== undefined && v !== '')
    );
  }

  if (role === 'PARENT') {
    return pick(['family_context', 'child_context', 'onboarding_notes']);
  }

  if (role === 'TEACHER') {
    const data = {};

    if (values.school) data.school = values.school;
    if (values.bio) data.bio = values.bio;

    if (values.yearsExperience !== '' && values.yearsExperience !== undefined) {
      data.yearsExperience = Number(values.yearsExperience);
    }

    // The admin forms select subjects and grade levels from their masters
    // (arrays already); public registration still types a comma-separated
    // subjects list.
    const subjects = toArray(values.subjects);
    if (subjects.length) data.subjects = subjects;

    const gradeLevels = toArray(values.gradeLevels);
    if (gradeLevels.length) data.gradeLevels = gradeLevels;

    return { profile_data: data };
  }

  return {};
}

export default buildProfilePayload;
