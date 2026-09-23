import { useEffect } from 'react';
import { Alert, Button, Input, Loader } from '../../../components/common';
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
import ParentFamilyForm from '../../onboarding/components/ParentFamilyForm';
import onboardingService from '../../onboarding/services/onboarding.service';
import { ProfileHeaderCard, ProfileSection } from '../../profile/components/ProfileParts';
import '../../profile/components/profile.css';
import { useProfilePhoto } from '../../profile/useProfilePhoto';

function valuesFromMe(me) {
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
  };
}

/** "Parent · 2 children" */
function metaLine(record) {
  const children = (record?.relationships ?? []).filter((r) => r.relationshipType === 'parent_child').length;
  return ['Parent', children ? `${children} ${children === 1 ? 'child' : 'children'}` : null].filter(Boolean).join(' · ');
}

/**
 * /parent/profile - the parent's own account, on the same design as the
 * teacher profile: photo header, Personal details + Address (saved together),
 * About your family, and Change password.
 *
 * Deliberately separate from /parent/children ("My Children") - editing your
 * own details and editing a child's are two different operations with two
 * different ownership models.
 */
export default function ParentProfilePage() {
  // GET /auth/me responds { user: {...} } - useApi's `data` is that whole envelope.
  const { data: me, isLoading, error, run } = useApi(authService.getMe, { immediate: true });
  const record = me?.user ?? null;
  const familyContext = useApi(onboardingService.getMyOnboarding, { immediate: true });
  const { user, setUser } = useAuth();
  const reload = () => run().catch(() => {});
  const photo = useProfilePhoto({ onChanged: reload });

  const form = useForm({
    initialValues: valuesFromMe(null),
    validationSchema: {
      firstName: [required('Enter your first name')],
      email: [required('Enter your email address'), emailRule()],
      phone: [phoneRule()],
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
        profile: buildProfilePayload('PARENT', values),
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
    <div className="pf-page td-page">
      <h1 className="pf-title">My Profile</h1>
      <p className="pf-subtitle">Your details, your family, and your password.</p>

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

          <form onSubmit={form.handleSubmit} noValidate data-testid="parent-profile-form">
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
              <div className="pf-actions">
                <Button type="submit" loading={form.isSubmitting}>
                  Save changes
                </Button>
              </div>
            </ProfileSection>
          </form>

          <ProfileSection title="About your family" hint="The answers from when you first signed in - change them any time.">
            {familyContext.data ? (
              <ParentFamilyForm
                key={familyContext.data.completedAt ?? 'new'}
                answers={familyContext.data.answers}
                submitLabel="Save family details"
                onSaved={() => toast.success('Family details saved')}
              />
            ) : familyContext.error ? (
              <Alert variant="error">{getErrorMessage(familyContext.error)}</Alert>
            ) : (
              <Loader message="Loading…" />
            )}
          </ProfileSection>

          <ProfileSection title="Change password">
            <ChangePasswordForm compact />
          </ProfileSection>
        </>
      )}
    </div>
  );
}
