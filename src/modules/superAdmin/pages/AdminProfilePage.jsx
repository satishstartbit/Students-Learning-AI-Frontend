import { useEffect } from 'react';
import { Alert, Button, Input, Loader, PhoneInput } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { formatDate, formatDateTime } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import { formatPhoneForDisplay } from '../../../utils/phone';
import { phone as phoneRule, required } from '../../../utils/validation';
import ChangePasswordForm from '../../auth/components/ChangePasswordForm';
import authService from '../../auth/services/auth.service';
import { ProfileHeaderCard, ProfilePageLayout, ProfileSection } from '../../profile/components/ProfileParts';
import '../../profile/components/profile.css';

function valuesFromMe(me) {
  return {
    firstName: me?.firstName ?? '',
    lastName: me?.lastName ?? '',
    phone: formatPhoneForDisplay(me?.phone),
  };
}

/**
 * /admin/profile - the Super Admin's own account, on the same frame as the
 * teacher and parent My Profile pages (ProfilePageLayout): name and phone,
 * plus Change password. No time zone field: it follows this device
 * (hooks/useDeviceTimezone.js).
 *
 * Deliberately narrower than the other roles: Super Admin has no profile
 * table (so no photo), and the sign-in email is read-only here - changing it
 * signs every session out until a verification link is clicked, which could
 * lock the platform's admin out. The backend enforces both
 * (user.service#updateUser, self-edit branch).
 */
export default function AdminProfilePage() {
  // GET /auth/me responds { user: {...} } - useApi's `data` is that whole envelope.
  const { data: me, isLoading, error, run } = useApi(authService.getMe, { immediate: true });
  const record = me?.user ?? null;
  const { user, setUser } = useAuth();

  const form = useForm({
    initialValues: valuesFromMe(null),
    validationSchema: {
      firstName: [required('Enter your first name')],
      phone: [phoneRule()],
    },
    async onSubmit(values) {
      const { data } = await authService.updateMe({
        firstName: values.firstName,
        lastName: values.lastName || null,
        phone: values.phone || null,
      });
      setUser({ ...user, firstName: data.firstName, lastName: data.lastName, phone: data.phone, timezone: data.timezone });
      toast.success('Profile saved');
      window.dispatchEvent(new Event('profile:updated'));
      run().catch(() => {});
    },
  });

  useEffect(() => {
    if (record) form.reset(valuesFromMe(record));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  if (isLoading && !record) return <Loader message="Loading your profile…" />;

  const description = 'Your details and password.';
  if (!record) {
    return (
      <ProfilePageLayout description={description}>
        {error && <Alert variant="error">{getErrorMessage(error)}</Alert>}
      </ProfilePageLayout>
    );
  }

  const lastLogin = record.lastLoginAt ? formatDateTime(record.lastLoginAt) : null;
  const memberSince = record.createdAt ? formatDate(record.createdAt) : null;

  return (
    <ProfilePageLayout
      description={description}
      head={<ProfileHeaderCard name={formatName(record)} meta="Super Admin" note={record.email} />}
      extra={
        <>
          {(lastLogin || memberSince) && (
            <ProfileSection title="Account">
              <dl className="pf-facts">
                <div>
                  <dt>Role</dt>
                  <dd>Super Admin</dd>
                </div>
                {lastLogin && (
                  <div>
                    <dt>Last signed in</dt>
                    <dd>{lastLogin}</dd>
                  </div>
                )}
                {memberSince && (
                  <div>
                    <dt>Account created</dt>
                    <dd>{memberSince}</dd>
                  </div>
                )}
              </dl>
            </ProfileSection>
          )}

          <ProfileSection title="Change password">
            <ChangePasswordForm compact />
          </ProfileSection>
        </>
      }
    >
      <form onSubmit={form.handleSubmit} noValidate data-testid="admin-profile-form">
        {form.submitError && (
          <Alert variant="error" className="ui-field">
            {form.submitError}
          </Alert>
        )}

        <ProfileSection title="Personal details">
          <div className="pf-grid">
            <Input label="First name" required autoComplete="given-name" {...form.getFieldProps('firstName')} />
            <Input label="Last name" autoComplete="family-name" {...form.getFieldProps('lastName')} />
            <Input label="Email" type="email" value={record.email} readOnly disabled hint="Your sign-in email - it can't be changed here." />
            <PhoneInput label="Phone" {...form.getFieldProps('phone')} />
          </div>
          <div className="pf-actions">
            <Button type="submit" loading={form.isSubmitting}>
              Save changes
            </Button>
          </div>
        </ProfileSection>
      </form>
    </ProfilePageLayout>
  );
}
