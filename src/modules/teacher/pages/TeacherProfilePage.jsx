import { useEffect, useState } from 'react';
import { Alert, Button, Input, Loader, Textarea } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import { email as emailRule, phone as phoneRule, required } from '../../../utils/validation';
import AddressFields from '../../auth/components/AddressFields';
import ChangePasswordForm from '../../auth/components/ChangePasswordForm';
import { buildProfilePayload } from '../../auth/components/profilePayload';
import authService from '../../auth/services/auth.service';
import { ChipMultiSelect, ProfileHeaderCard, ProfileSection } from '../../profile/components/ProfileParts';
import '../../profile/components/profile.css';
import { useProfilePhoto } from '../../profile/useProfilePhoto';
import teacherStudentService from '../services/teacherStudent.service';

function valuesFromMe(me) {
  const teacherData = me?.profile?.profile_data ?? {};
  return {
    firstName: me?.firstName ?? '',
    lastName: me?.lastName ?? '',
    email: me?.email ?? '',
    phone: me?.phone ?? '',
    address: me?.address ?? '',
    city: me?.city ?? '',
    state: me?.state ?? '',
    country: me?.country ?? '',
    postalCode: me?.postalCode ?? '',
    school: teacherData.school ?? '',
    subjects: Array.isArray(teacherData.subjects) ? teacherData.subjects : [],
    gradeLevels: Array.isArray(teacherData.gradeLevels) ? teacherData.gradeLevels : [],
    yearsExperience: teacherData.yearsExperience ?? '',
    bio: teacherData.bio ?? '',
  };
}

/** "Teacher · Central High · 4 years teaching" - only the parts that are filled in. */
function metaLine(record) {
  const data = record?.profile?.profile_data ?? {};
  const years = Number(data.yearsExperience);
  return [
    'Teacher',
    data.school,
    Number.isFinite(years) && data.yearsExperience !== '' && data.yearsExperience != null
      ? `${years} ${years === 1 ? 'year' : 'years'} teaching`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Subject / grade master options for the chip pickers ({ value, label }). */
function useMasterOptions(masterType) {
  const [state, setState] = useState({ options: [], loading: true });
  useEffect(() => {
    let live = true;
    teacherStudentService
      .masterOptionsFetcher(masterType)
      .then((options) => live && setState({ options: options ?? [], loading: false }))
      .catch(() => live && setState({ options: [], loading: false }));
    return () => {
      live = false;
    };
  }, [masterType]);
  return state;
}

const yearsRule = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 60 ? null : 'Enter whole years, 0 to 60';
};

/**
 * /teacher/profile - built to the teacher profile mockup: photo header, then
 * Personal details, Address and Teaching as cards saved together by
 * "Save changes", and Change password on its own. What a teacher teaches
 * (subjects + grades) is what the invite forms match them on, so it's worth
 * keeping current.
 */
export default function TeacherProfilePage() {
  // GET /auth/me responds { user: {...} } - useApi's `data` is that whole envelope.
  const { data: me, isLoading, error, run } = useApi(authService.getMe, { immediate: true });
  const record = me?.user ?? null;
  const { user, setUser } = useAuth();
  const subjects = useMasterOptions('subjects');
  const grades = useMasterOptions('grade_levels');
  const reload = () => run().catch(() => {});
  const photo = useProfilePhoto({ onChanged: reload });

  const form = useForm({
    initialValues: valuesFromMe(null),
    validationSchema: {
      firstName: [required('Enter your first name')],
      email: [required('Enter your email address'), emailRule()],
      phone: [phoneRule()],
      yearsExperience: [yearsRule],
    },
    async onSubmit(values) {
      const { data } = await authService.updateMe({
        firstName: values.firstName,
        lastName: values.lastName || null,
        email: values.email,
        phone: values.phone || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        country: values.country || null,
        postalCode: values.postalCode || null,
        profile: buildProfilePayload('TEACHER', values),
      });
      setUser({ ...user, firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone });
      toast.success('Profile saved');
      window.dispatchEvent(new Event('profile:updated'));
      reload();
    },
  });

  useEffect(() => {
    if (record) form.reset(valuesFromMe(record));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  if (isLoading && !record) return <Loader message="Loading your profile…" />;

  const emailChanged = record && form.values.email.trim().toLowerCase() !== String(record.email ?? '').toLowerCase();

  return (
    <div className="pf-page">
      <h1 className="pf-title">My Profile</h1>
      <p className="pf-subtitle">Your details, what you teach, and your password.</p>

      {error && !record && <Alert variant="error">{getErrorMessage(error)}</Alert>}

      {record && (
        <>
          <ProfileHeaderCard
            name={formatName(record)}
            meta={metaLine(record)}
            photoUrl={record.profile?.profileImageUrl ?? null}
            busy={photo.busy}
            onUpload={photo.upload}
            onRemove={photo.remove}
          />

          <form onSubmit={form.handleSubmit} noValidate data-testid="teacher-profile-form">
            {form.submitError && (
              <Alert variant="error" className="ui-field">
                {form.submitError}
              </Alert>
            )}

            <ProfileSection title="Personal details">
              <div className="pf-grid">
                <Input label="First name" required autoComplete="given-name" {...form.getFieldProps('firstName')} />
                <Input label="Last name" autoComplete="family-name" {...form.getFieldProps('lastName')} />
                <Input
                  label="Email"
                  type="email"
                  required
                  autoComplete="email"
                  hint={emailChanged ? "Saving signs you out - we'll email a link to confirm the new address." : undefined}
                  {...form.getFieldProps('email')}
                />
                <Input label="Phone" type="tel" autoComplete="tel" {...form.getFieldProps('phone')} />
              </div>
            </ProfileSection>

            <ProfileSection title="Address">
              <AddressFields layout="profile" values={form.values} getProps={form.getFieldProps} setFieldValue={form.setFieldValue} />
            </ProfileSection>

            <ProfileSection title="Teaching" hint="What you teach decides which students and subjects you see.">
              <Input label="School" {...form.getFieldProps('school')} />
              <ChipMultiSelect
                name="subjects"
                label="Subjects taught"
                addLabel="Add subject"
                options={subjects.options}
                loading={subjects.loading}
                value={form.values.subjects}
                onChange={(next) => form.setFieldValue('subjects', next)}
              />
              <ChipMultiSelect
                name="gradeLevels"
                label="Grades taught"
                addLabel="Add grade"
                options={grades.options}
                loading={grades.loading}
                value={form.values.gradeLevels}
                onChange={(next) => form.setFieldValue('gradeLevels', next)}
              />
              <div className="pf-half">
                <Input label="Years teaching" type="number" inputMode="numeric" min={0} max={60} {...form.getFieldProps('yearsExperience')} />
              </div>
              <Textarea label="Short bio" rows={4} maxLength={1000} {...form.getFieldProps('bio')} />
              <div className="pf-actions">
                <Button type="submit" loading={form.isSubmitting}>
                  Save changes
                </Button>
              </div>
            </ProfileSection>
          </form>

          <ProfileSection title="Change password">
            <ChangePasswordForm compact />
          </ProfileSection>
        </>
      )}
    </div>
  );
}
