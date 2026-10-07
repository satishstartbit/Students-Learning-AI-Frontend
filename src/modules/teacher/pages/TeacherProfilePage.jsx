import { useEffect, useState } from 'react';
import AccentPicker from '../../../components/appearance/AccentPicker';
import { useAppSettings } from '../../../components/appearance/useAppSettings';
import { Alert, Button, EmailInput, Input, Loader, PhoneInput, Textarea } from '../../../components/common';
import { formatPhoneForDisplay } from '../../../utils/phone';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import { emailRules, phone as phoneRule, required } from '../../../utils/validation';
import AddressFields from '../../auth/components/AddressFields';
import ChangePasswordForm from '../../auth/components/ChangePasswordForm';
import { buildProfilePayload } from '../../auth/components/profilePayload';
import authService from '../../auth/services/auth.service';
import { ChipMultiSelect, ProfileHeaderCard, ProfilePageLayout, ProfileSection } from '../../profile/components/ProfileParts';
import '../../profile/components/profile.css';
import { useProfilePhoto } from '../../profile/useProfilePhoto';
import teacherStudentService from '../services/teacherStudent.service';

function valuesFromMe(me) {
  const teacherData = me?.profile?.profile_data ?? {};
  return {
    firstName: me?.firstName ?? '',
    lastName: me?.lastName ?? '',
    email: me?.email ?? '',
    // Shown the Canadian way, +1 (416) 555-1234; the API stores E.164 either way.
    phone: formatPhoneForDisplay(me?.phone),
    // No time zone field: it follows this device (hooks/useDeviceTimezone.js).
    addressLine2: me?.addressLine2 ?? '',
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
 * /teacher/profile - one column, like the parent's My Profile (user request
 * 2026-10-01): Colour theme on top, then Personal details with the photo row
 * inside it, Address and Teaching (all three saved together by "Save
 * changes"), and Change password at the bottom. What a teacher teaches
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
  // Colour theme - the shell provides it (layouts/TeacherLayout.jsx).
  const appSettings = useAppSettings();

  const form = useForm({
    initialValues: valuesFromMe(null),
    validationSchema: {
      firstName: [required('Enter your first name')],
      email: emailRules(),
      phone: [phoneRule()],
      yearsExperience: [yearsRule],
    },
    async onSubmit(values) {
      const { data } = await authService.updateMe({
        firstName: values.firstName,
        lastName: values.lastName || null,
        email: values.email,
        phone: values.phone || null,
        addressLine2: values.addressLine2 || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        country: values.country || null,
        postalCode: values.postalCode || null,
        profile: buildProfilePayload('TEACHER', values),
      });
      setUser({ ...user, firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone, timezone: data.timezone });
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

  if (!record) {
    return (
      <ProfilePageLayout description="Your colour theme, your details, what you teach, and your password.">
        {error &&<Alert variant="error">{getErrorMessage(error)}</Alert>}
      </ProfilePageLayout>
    );
  }

  // One column, top to bottom, like the parent's My Profile: Colour theme,
  // Personal details (with the photo), Address, Teaching, Change password.
  return (
    <ProfilePageLayout description="Your colour theme, your details, what you teach, and your password.">
      <ProfileSection title="Colour theme" hint="Changes the accent colour across your whole dashboard.">
        <AccentPicker
          value={appSettings.accent}
          disabled={appSettings.isLoading}
          onChange={(accent) =>
            appSettings.update({ accent }).catch((err) => {
              toast.error(getErrorMessage(err) || 'Couldn’t save that - please try again.');
            })
          }
        />
      </ProfileSection>

      <form onSubmit={form.handleSubmit} noValidate data-testid="teacher-profile-form">
        {form.submitError && (
          <Alert variant="error" className="ui-field">
            {form.submitError}
          </Alert>
        )}

        <ProfileSection title="Personal details">
          {/* The photo saves on its own, straight away (useProfilePhoto); the fields save with Save changes. */}
          <ProfileHeaderCard
            inline
            name={formatName(record)}
            meta={metaLine(record)}
            photoUrl={record.profile?.profileImageUrl ?? null}
            busy={photo.busy}
            onUpload={photo.upload}
            onRemove={photo.remove}
          />
          <div className="pf-grid">
            <Input label="First name" required autoComplete="given-name" {...form.getFieldProps('firstName')} />
            <Input label="Last name" autoComplete="family-name" {...form.getFieldProps('lastName')} />
            <EmailInput
              label="Email"
              required
              hint={emailChanged ? "Saving signs you out - we'll email a link to confirm the new address." : undefined}
              {...form.getFieldProps('email')}
            />
            <PhoneInput label="Phone" {...form.getFieldProps('phone')} />
          </div>
        </ProfileSection>

        <ProfileSection title="Address">
          <AddressFields
            layout="profile"
            values={form.values}
            getProps={form.getFieldProps}
            setFieldValue={form.setFieldValue}
            recipient={[form.values.firstName, form.values.lastName].filter(Boolean).join(' ')}
          />
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
        <ChangePasswordForm compact layout="profile" />
      </ProfileSection>
    </ProfilePageLayout>
  );
}
