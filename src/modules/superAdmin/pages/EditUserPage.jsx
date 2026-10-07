import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  PageHeader,
  Card,
  EmailInput,
  Input,
  PhoneInput,
  Button,
  ButtonGroup,
  Alert,
  SectionHeader,
  Loader,
  ErrorState,
  Toast,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useForm } from '../../../hooks/useForm';
import { usePhotoField } from '../../../hooks/usePhotoField';
import { toast } from '../../../hooks/useToast';
import { required, emailRules, phone as phoneRule } from '../../../utils/validation';
import { formatPhoneForDisplay } from '../../../utils/phone';
import { ROLE_LABELS, listPathForRole } from '../../../utils/constants';
import adminUserService from '../services/adminUser.service';
import RoleProfileFields from '../../auth/components/RoleProfileFields';
import { buildProfilePayload } from '../../auth/components/profilePayload';

/**
 * Edit an existing user.
 *
 * Role and status are absent on purpose. Role is never changeable through
 * this path, and status moves through the suspend/reactivate actions so the
 * session revocation that must accompany a suspension cannot be bypassed.
 *
 * Changing the email clears verification server-side and re-sends a link, so
 * the form warns before that happens.
 *
 * No time zone field: each user's own device sets it (hooks/useDeviceTimezone.js).
 *
 * Students have no email or phone - they sign in with their username - so
 * neither field is shown or sent for them (the API ignores both anyway).
 */

export default function EditUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, error, isLoading, run } = useApi(adminUserService.getUser);
  const photo = usePhotoField(user?.profile?.profileImageUrl ?? null);

  useEffect(() => {
    run(id).catch(() => {
      /* surfaced through `error` */
    });
  }, [run, id]);

  const isStudent = user?.role === 'STUDENT';

  const form = useForm({
    initialValues: {},
    validationSchema: {
      firstName: [required('Enter a first name')],
      ...(isStudent
        ? {}
        : { email: emailRules(), phone: [phoneRule()] }),
    },
    async onSubmit(values) {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName || null,
        ...(isStudent ? {} : { email: values.email, phone: values.phone || null }),
        profile: buildProfilePayload(user.role, values),
        photoFile: photo.file,
      };

      await adminUserService.updateUser(id, payload);
      toast.success('User updated');
      navigate(`/admin/users/${id}`);
    },
  });

  const { reset } = form;

  // Seed the form once the record arrives. Teacher fields are stored nested
  // under profile_data, so they are flattened back out for the inputs.
  useEffect(() => {
    if (!user) return;

    const profile = user.profile ?? {};
    const teacherData = profile.profile_data ?? {};
    const isStudent = user.role === 'STUDENT';

    // Strengths/Challenges/Interests/Subjects are stored as a TEXT column for
    // students - split back into an array for the master multi-select.
    const splitCsv = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);

    reset({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      phone: formatPhoneForDisplay(user.phone),
      grade: profile.grade ?? '',
      date_of_birth: isStudent ? profile.date_of_birth ?? '' : '',
      gender: isStudent ? profile.gender ?? '' : '',
      preferred_working_style: profile.preferred_working_style ?? '',
      focus_habits: profile.focus_habits ?? '',
      strengths: isStudent ? splitCsv(profile.strengths) : '',
      challenges: isStudent ? splitCsv(profile.challenges) : '',
      interests: isStudent ? splitCsv(profile.interests) : '',
      subjects: user.role === 'TEACHER' ? teacherData.subjects ?? [] : isStudent ? splitCsv(profile.subjects) : '',
      profile_notes: profile.profile_notes ?? '',
      family_context: profile.family_context ?? '',
      child_context: profile.child_context ?? '',
      onboarding_notes: profile.onboarding_notes ?? '',
      school: teacherData.school ?? '',
      gradeLevels: teacherData.gradeLevels ?? [],
      yearsExperience: teacherData.yearsExperience ?? '',
      bio: teacherData.bio ?? '',
    });
  }, [user, reset]);

  if (isLoading && !user) return <Loader message="Loading user…" />;
  if (error) return <ErrorState error={error} onRetry={() => run(id)} />;
  if (!user) return null;

  const emailChanged =
    !isStudent && form.values.email && form.values.email.toLowerCase() !== String(user.email ?? '').toLowerCase();

  return (
    <div className="td-page">
      <PageHeader
        title={`Edit ${user.firstName ?? 'user'}`}
        description={`${ROLE_LABELS[user.role] ?? user.role} · ${user.email ?? `@${user.username}`}`}
        breadcrumbs={[
          { label: `${ROLE_LABELS[user.role] ?? 'User'}s`, to: listPathForRole(user.role) },
          { label: user.firstName ?? 'User', to: `/admin/users/${id}` },
          { label: 'Edit' },
        ]}
      />

      <Card>
        {form.submitError && (
          <Alert variant="error" className="ui-field">
            {form.submitError}
          </Alert>
        )}

        {emailChanged && (
          <Alert variant="warning" title="Changing the email" className="ui-field">
            The account will be marked unverified, a new verification link will be sent to the new
            address, and all current sessions will be revoked.
          </Alert>
        )}

        <form onSubmit={form.handleSubmit} noValidate>
          <SectionHeader title="Account details" as="h3" />

          <Input label="First name" required {...form.getFieldProps('firstName')} />
          <Input label="Last name" {...form.getFieldProps('lastName')} />
          {!isStudent && (
            <>
              <EmailInput label="Email" required autoComplete="off" {...form.getFieldProps('email')} />
              <PhoneInput label="Phone" {...form.getFieldProps('phone')} />
            </>
          )}

          <SectionHeader title={`${ROLE_LABELS[user.role]} profile`} as="h3" />

          <RoleProfileFields
            role={user.role}
            getProps={form.getFieldProps}
            includeAdminOnly
            photo={user.role === 'STUDENT' ? photo : undefined}
          />

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting} disabled={!form.isDirty}>
              Save changes
            </Button>
            <Button as={Link} to={`/admin/users/${id}`} variant="secondary">
              Cancel
            </Button>
          </ButtonGroup>
        </form>
      </Card>

      <Toast />
    </div>
  );
}

