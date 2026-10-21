import { useState } from 'react';
import { LuLogOut } from 'react-icons/lu';
import { Alert, BrandMark, Button, Input, Loader, PhoneInput } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { useForm } from '../../../hooks/useForm';
import { APP_NAME } from '../../../utils/constants';
import { formatPhoneForDisplay } from '../../../utils/phone';
import { withRequiredFields, yearsExperienceRule } from '../../../utils/profileRequirements';
import { phone as phoneRule } from '../../../utils/validation';
import { ChipMultiSelect, ProfileSection } from '../../profile/components/ProfileParts';
import '../../profile/components/profile.css';
import authService from '../services/auth.service';
import { useMasterOptions } from './useMasterOptions';
import './profileCompletion.css';

const TEACHING_FIELDS = ['subjects', 'gradeLevels', 'yearsExperience'];

/**
 * "Complete your profile" (user request 2026-10-21). Wraps the Teacher and
 * Parent areas: while GET /auth/me says required details are still empty
 * (`profileCompletion`, backend utils/profileRequirements.js) - someone who
 * signed up on /register with only a name, email and password, or an older
 * account - this full page shows just those fields instead of the portal.
 * There is no navigation on it, so no other page opens until they are saved
 * (or the person signs out).
 *
 * If /auth/me can't be read the area opens anyway - never trap someone out of
 * their account over a lookup; the API still refuses to blank a required field.
 */
export default function ProfileCompletionGate({ role, children }) {
  const me = useApi(authService.getMe, { immediate: true });
  const [completed, setCompleted] = useState(false);

  if (me.isLoading && !me.data) {
    return (
      <div className="cp-page cp-page--loading">
        <Loader message="Loading…" />
      </div>
    );
  }

  const completion = me.data?.profileCompletion;
  if (completed || !completion?.required) return children;

  return (
    <CompleteProfileScreen
      role={role}
      record={me.data.user}
      missing={completion.missing ?? []}
      onDone={() => setCompleted(true)}
    />
  );
}

function CompleteProfileScreen({ role, record, missing, onDone }) {
  const { user, setUser, signOut } = useAuth();
  const asks = (field) => missing.includes(field);
  const teacherData = record?.profile?.profile_data ?? {};
  const teaching = role === 'TEACHER' ? TEACHING_FIELDS.filter(asks) : [];
  const count = missing.length;

  const form = useForm({
    initialValues: {
      lastName: record?.lastName ?? '',
      phone: formatPhoneForDisplay(record?.phone),
      subjects: Array.isArray(teacherData.subjects) ? teacherData.subjects : [],
      gradeLevels: Array.isArray(teacherData.gradeLevels) ? teacherData.gradeLevels : [],
      yearsExperience: teacherData.yearsExperience ?? '',
    },
    validationSchema: withRequiredFields(
      role,
      { phone: [phoneRule()], yearsExperience: [yearsExperienceRule] },
      { fields: missing }
    ),
    async onSubmit(values) {
      const payload = {};
      if (asks('lastName')) payload.lastName = values.lastName.trim();
      if (asks('phone')) payload.phone = values.phone;
      if (teaching.length) {
        // profile_data is saved whole, so the answers already there go back with the new ones.
        payload.profile = {
          profile_data: {
            ...teacherData,
            ...(asks('subjects') ? { subjects: values.subjects } : {}),
            ...(asks('gradeLevels') ? { gradeLevels: values.gradeLevels } : {}),
            ...(asks('yearsExperience') ? { yearsExperience: Number(values.yearsExperience) } : {}),
          },
        };
      }

      const { data } = await authService.updateMe(payload);
      setUser({ ...user, lastName: data.lastName, phone: data.phone });
      // The shell re-reads the profile (the teacher's school under their name).
      window.dispatchEvent(new Event('profile:updated'));
      onDone();
    },
  });

  return (
    <div className="cp-page">
      <header className="cp-top">
        <BrandMark name={APP_NAME} size="md" />
        <Button variant="ghost" size="sm" onClick={() => signOut()} disabled={form.isSubmitting} startIcon={<LuLogOut aria-hidden="true" />}>
          Sign out
        </Button>
      </header>

      <main className="cp-main">
        <h1 className="cp-title">Complete your profile</h1>
        <p className="cp-lead">
          {record?.firstName ? `Hi ${record.firstName}, we` : 'We'} need {count === 1 ? 'one more detail' : `${count} more details`}{' '}
          before you start.{' '}
          {role === 'TEACHER'
            ? 'What you teach decides which students and invitations reach you.'
            : 'Your children’s teachers and our team use them to reach you.'}
        </p>

        <form onSubmit={form.handleSubmit} noValidate data-testid="complete-profile-form">
          {form.submitError && (
            <Alert variant="error" className="ui-field">
              {form.submitError}
            </Alert>
          )}

          {(asks('lastName') || asks('phone')) && (
            <ProfileSection title="Your details">
              <div className="pf-grid">
                {asks('lastName') && <Input label="Last name" required autoComplete="family-name" {...form.getFieldProps('lastName')} />}
                {asks('phone') && <PhoneInput label="Phone" required {...form.getFieldProps('phone')} />}
              </div>
            </ProfileSection>
          )}

          {teaching.length > 0 && <TeachingSection form={form} asks={asks} />}

          <div className="cp-actions">
            <Button type="submit" loading={form.isSubmitting}>
              Save and continue
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

/** Subjects, grades and years - the same chip pickers as the teacher's My Profile. */
function TeachingSection({ form, asks }) {
  const subjects = useMasterOptions('subjects', authService.masterOptionsFetcher);
  const grades = useMasterOptions('grade_levels', authService.masterOptionsFetcher);

  return (
    <ProfileSection title="What you teach" hint="You can change these later on My Profile.">
      {asks('subjects') && (
        <ChipMultiSelect
          name="subjects"
          label="Subjects taught"
          addLabel="Add subject"
          required
          error={form.getFieldProps('subjects').error}
          options={subjects.options}
          loading={subjects.loading}
          value={form.values.subjects}
          onChange={(next) => form.setFieldValue('subjects', next)}
        />
      )}
      {asks('gradeLevels') && (
        <ChipMultiSelect
          name="gradeLevels"
          label="Grades taught"
          addLabel="Add grade"
          required
          error={form.getFieldProps('gradeLevels').error}
          options={grades.options}
          loading={grades.loading}
          value={form.values.gradeLevels}
          onChange={(next) => form.setFieldValue('gradeLevels', next)}
        />
      )}
      {asks('yearsExperience') && (
        <div className="pf-half">
          <Input
            label="Years of experience"
            type="number"
            inputMode="numeric"
            min={0}
            max={70}
            required
            {...form.getFieldProps('yearsExperience')}
          />
        </div>
      )}
    </ProfileSection>
  );
}
