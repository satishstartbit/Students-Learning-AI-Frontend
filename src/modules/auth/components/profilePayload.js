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
export function buildProfilePayload(role, values) {
  const pick = (keys) =>
    Object.fromEntries(
      keys.map((k) => [k, values[k]]).filter(([, v]) => v !== undefined && v !== '')
    );

  if (role === 'STUDENT') {
    return pick([
      'grade',
      'preferred_working_style',
      'focus_habits',
      'strengths',
      'challenges',
      'interests',
      'subjects',
      'profile_notes',
    ]);
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

    if (values.subjects) {
      data.subjects = String(values.subjects)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return { profile_data: data };
  }

  return {};
}

export default buildProfilePayload;
