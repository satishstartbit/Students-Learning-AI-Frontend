import { Input, Textarea } from '../../../components/common';

/**
 * The profile fields that change with the selected role.
 *
 * Shared by public registration and the admin create/edit forms so the three
 * cannot drift. Field names match the profile table columns exactly, which is
 * what the API expects under `profile`.
 *
 * The value-shaping helper lives in ./profilePayload.js - this module exports
 * only a component so fast refresh keeps working.
 *
 * @param role      STUDENT | TEACHER | PARENT
 * @param getProps  useForm's getFieldProps
 * @param includeAdminOnly  admin-only notes fields, hidden on public signup
 */
export default function RoleProfileFields({ role, getProps, includeAdminOnly = false }) {
  if (role === 'STUDENT') {
    return (
      <>
        <Input label="Grade" placeholder="e.g. Year 9" {...getProps('grade')} />
        <Textarea
          label="Preferred working style"
          rows={2}
          hint="How do you like to work? Quiet, music on, short bursts."
          {...getProps('preferred_working_style')}
        />
        <Textarea label="Focus habits" rows={2} {...getProps('focus_habits')} />
        <Textarea label="Strengths" rows={2} {...getProps('strengths')} />
        <Textarea label="Challenges" rows={2} {...getProps('challenges')} />
        <Textarea label="Interests" rows={2} {...getProps('interests')} />
        <Textarea label="Subjects" rows={2} {...getProps('subjects')} />

        {includeAdminOnly && (
          <Textarea
            label="Profile notes"
            rows={2}
            hint="Internal notes - not shown to the student"
            {...getProps('profile_notes')}
          />
        )}
      </>
    );
  }

  if (role === 'PARENT') {
    return (
      <>
        <Textarea
          label="Family context"
          rows={3}
          hint="Anything about your family setup that helps us support your child"
          {...getProps('family_context')}
        />
        <Textarea label="About your child" rows={3} {...getProps('child_context')} />

        {includeAdminOnly && (
          <Textarea label="Onboarding notes" rows={2} {...getProps('onboarding_notes')} />
        )}
      </>
    );
  }

  if (role === 'TEACHER') {
    // Structured fields rather than a free-form JSON blob - the API validates
    // these keys and rejects anything else.
    return (
      <>
        <Input label="School" {...getProps('school')} />
        <Input
          label="Subjects taught"
          hint="Comma separated"
          placeholder="Maths, Science"
          {...getProps('subjects')}
        />
        <Input
          label="Years of experience"
          type="number"
          min="0"
          max="70"
          {...getProps('yearsExperience')}
        />
        <Textarea label="Short bio" rows={3} {...getProps('bio')} />
      </>
    );
  }

  return null;
}
