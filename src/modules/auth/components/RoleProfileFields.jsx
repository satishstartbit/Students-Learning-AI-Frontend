import { useEffect, useState } from 'react';
import { Input, Textarea, Select, MultiSelect, ImageUpload, DatePicker } from '../../../components/common';
import masterGenericService from '../../masterManagement/services/masterGeneric.service';

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

/** The default lookup source: Master Management, for Super-Admin sessions only. */
const defaultLookupFetcher = (masterType) =>
  masterGenericService
    .listItems(masterType, { status: 'active', sortBy: 'display_order', sortOrder: 'asc', limit: 100 })
    .then((res) => (res?.data ?? []).map((item) => ({ value: item.name, label: item.name })));

/**
 * Options for one master lookup (Subjects, Grade Levels, ...).
 *
 * Defaults to `/admin/master`, which requires a Super Admin session. Callers
 * without one (the parent's Add Child form) pass `lookupFetcher` to read the
 * same data from a role-appropriate endpoint instead.
 */
function useMasterOptions(masterType, lookupFetcher = defaultLookupFetcher) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    lookupFetcher(masterType)
      .then((items) => {
        if (cancelled) return;
        setOptions(items ?? []);
      })
      .catch(() => {
        /* an empty list just means nothing to pick from */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [masterType, lookupFetcher]);

  return { options, loading };
}

/** A field that can hold several master values at once (subjects, grade levels, ...). */
function MasterMultiSelectField({ masterType, name, label, getProps, hint, lookupFetcher }) {
  const { options, loading } = useMasterOptions(masterType, lookupFetcher);
  const { value, onChange } = getProps(name);
  const selected = Array.isArray(value) ? value : [];

  return (
    <MultiSelect
      label={label}
      hint={loading ? 'Loading…' : hint}
      options={options}
      value={selected}
      onChange={(next) => onChange({ target: { name, value: next } })}
      disabled={loading}
    />
  );
}

/** A field that holds exactly one master value (a student's single grade). */
function MasterSelectField({ masterType, name, label, getProps, hint, required, lookupFetcher }) {
  const { options, loading } = useMasterOptions(masterType, lookupFetcher);

  return (
    <Select
      label={label}
      options={options}
      hint={loading ? 'Loading…' : hint}
      loading={loading}
      required={required}
      {...getProps(name)}
    />
  );
}

/**
 * The profile-photo picker, shared by every role. `photo` comes from
 * `hooks/usePhotoField.js`; the file travels alongside the request
 * separately from `profile` (see profilePayload.js), so it takes no part in
 * `getProps`.
 */
function ProfilePhotoField({ photo }) {
  return (
    <ImageUpload
      name="profileImage"
      label="Profile photo"
      hint="Optional - JPG, PNG, WEBP or HEIC"
      previews={photo.previewUrl ? [photo.previewUrl] : []}
      files={photo.file ? [photo.file] : []}
      error={photo.error}
      onSelect={(eventOrFiles) => {
        const file = Array.isArray(eventOrFiles) ? eventOrFiles[0] : eventOrFiles?.target?.files?.[0];
        if (file) photo.onSelect(file);
      }}
      onRemove={photo.onRemove}
    />
  );
}

/**
 * The profile fields that change with the selected role.
 *
 * Shared by public registration and the admin create/edit forms so the three
 * cannot drift. Field names match the profile table columns exactly, which is
 * what the API expects under `profile`.
 *
 * Fields backed by a Master Management lookup (Grade, Subjects, Strengths,
 * Challenges, Interests, Grade levels taught) only render as such when
 * `includeAdminOnly` is set - see useMasterOptions above. Elsewhere they fall
 * back to the original free-text input so public registration keeps working
 * without a Super Admin session.
 *
 * The value-shaping helper lives in ./profilePayload.js - this module exports
 * only a component so fast refresh keeps working.
 *
 * @param role      STUDENT | TEACHER | PARENT
 * @param getProps  useForm's getFieldProps
 * @param includeAdminOnly  admin-only fields, hidden on public signup
 * @param lookupFetcher  overrides the master-lookup source for Grade/Subjects/
 *                       etc. Defaults to `/admin/master` (Super Admin only) -
 *                       pass a role-appropriate fetcher for other callers
 *                       (e.g. the parent module's `/parent/lookups/*`).
 * @param photo     { file, previewUrl, onSelect, onRemove, error } - when
 *                  given, renders the Profile Image picker for a STUDENT.
 *                  The file travels alongside the request separately from
 *                  `profile` (see profilePayload.js), so it is not part of
 *                  `getProps`.
 * @param showFamilyContext  PARENT only - false where the family context is
 *                  edited by its own form instead (Parent My Profile's
 *                  onboarding card), so two forms never overwrite each other.
 * @param layout    STUDENT only - 'profile' lays the same fields out two to a
 *                  row in the My Profile grid (profile.css `pf-grid`), as the
 *                  parent's Edit child dialog does. The default 'stacked'
 *                  layout is unchanged for every other form.
 */
export default function RoleProfileFields({
  role,
  getProps,
  includeAdminOnly = false,
  lookupFetcher,
  photo,
  showFamilyContext = true,
  layout = 'stacked',
}) {
  if (role === 'STUDENT') {
    const grade = includeAdminOnly ? (
      <MasterSelectField
        masterType="grade_levels"
        name="grade"
        label="Grade"
        getProps={getProps}
        lookupFetcher={lookupFetcher}
      />
    ) : (
      <Input label="Grade" placeholder="e.g. Year 9" {...getProps('grade')} />
    );

    const dateOfBirth = (
      <DatePicker
        label="Date of birth"
        max={new Date().toISOString().slice(0, 10)}
        {...getProps('date_of_birth')}
      />
    );
    const gender = <Select label="Gender" options={GENDER_OPTIONS} {...getProps('gender')} />;

    const workingStyle = (
      <Textarea
        label="Preferred working style"
        rows={2}
        hint="How do you like to work? Quiet, music on, short bursts."
        {...getProps('preferred_working_style')}
      />
    );
    const focusHabits = <Textarea label="Focus habits" rows={2} {...getProps('focus_habits')} />;

    const lists = includeAdminOnly
      ? [
          <MasterMultiSelectField
            key="strengths"
            masterType="strength_areas"
            name="strengths"
            label="Strengths"
            getProps={getProps}
            lookupFetcher={lookupFetcher}
          />,
          <MasterMultiSelectField
            key="challenges"
            masterType="challenge_areas"
            name="challenges"
            label="Challenges"
            getProps={getProps}
            lookupFetcher={lookupFetcher}
          />,
          <MasterMultiSelectField
            key="interests"
            masterType="interest_categories"
            name="interests"
            label="Interests"
            getProps={getProps}
            lookupFetcher={lookupFetcher}
          />,
          <MasterMultiSelectField
            key="subjects"
            masterType="subjects"
            name="subjects"
            label="Subjects"
            getProps={getProps}
            lookupFetcher={lookupFetcher}
          />,
        ]
      : [
          <Textarea key="strengths" label="Strengths" rows={2} {...getProps('strengths')} />,
          <Textarea key="challenges" label="Challenges" rows={2} {...getProps('challenges')} />,
          <Textarea key="interests" label="Interests" rows={2} {...getProps('interests')} />,
          <Textarea key="subjects" label="Subjects" rows={2} {...getProps('subjects')} />,
        ];

    const notes = includeAdminOnly && (
      <Textarea
        label="Profile notes"
        rows={2}
        hint="Internal notes - not shown to the student"
        {...getProps('profile_notes')}
      />
    );

    if (layout === 'profile') {
      // Short fields pair up; free text runs the full width.
      return (
        <div className="pf-grid">
          {photo && (
            <div className="pf-span-2">
              <ProfilePhotoField photo={photo} />
            </div>
          )}
          {grade}
          {dateOfBirth}
          {gender}
          <div className="pf-span-2">{workingStyle}</div>
          <div className="pf-span-2">{focusHabits}</div>
          {lists}
          {notes && <div className="pf-span-2">{notes}</div>}
        </div>
      );
    }

    return (
      <>
        {photo && <ProfilePhotoField photo={photo} />}
        {grade}
        {dateOfBirth}
        {gender}
        {workingStyle}
        {focusHabits}
        {lists}
        {notes}
      </>
    );
  }

  if (role === 'PARENT') {
    return (
      <>
        {photo && <ProfilePhotoField photo={photo} />}

        {showFamilyContext && (
          <>
            <Textarea
              label="Family context"
              rows={3}
              hint="Anything about your family setup that helps us support your child"
              {...getProps('family_context')}
            />
            <Textarea label="About your child" rows={3} {...getProps('child_context')} />
          </>
        )}

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
        {photo && <ProfilePhotoField photo={photo} />}

        <Input label="School" {...getProps('school')} />

        {includeAdminOnly ? (
          <>
            <MasterMultiSelectField
              masterType="subjects"
              name="subjects"
              label="Subjects taught"
              hint="From the Subjects master"
              getProps={getProps}
              lookupFetcher={lookupFetcher}
            />
            <MasterMultiSelectField
              masterType="grade_levels"
              name="gradeLevels"
              label="Grade levels taught"
              hint="From the Grade Levels master"
              getProps={getProps}
              lookupFetcher={lookupFetcher}
            />
          </>
        ) : (
          <Input
            label="Subjects taught"
            hint="Comma separated"
            placeholder="Maths, Science"
            {...getProps('subjects')}
          />
        )}

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
