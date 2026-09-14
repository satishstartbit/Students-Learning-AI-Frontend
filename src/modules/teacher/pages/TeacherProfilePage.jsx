import { useEffect } from 'react';
import { Alert, Button, Card, Input, Loader, PageHeader, SectionHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useForm } from '../../../hooks/useForm';
import { usePhotoField } from '../../../hooks/usePhotoField';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { required, email as emailRule, phone as phoneRule } from '../../../utils/validation';
import authService from '../../auth/services/auth.service';
import AddressFields from '../../auth/components/AddressFields';
import ChangePasswordForm from '../../auth/components/ChangePasswordForm';
import RoleProfileFields from '../../auth/components/RoleProfileFields';
import { buildProfilePayload } from '../../auth/components/profilePayload';
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
    // profile_data.subjects is stored as an array (see buildProfilePayload) -
    // the master multi-select below needs an array, not the '' a plain text
    // field used to default to.
    subjects: teacherData.subjects ?? [],
    // Not previously shown on this page at all (only Super Admin could set
    // it) - included now that includeAdminOnly renders the field below.
    gradeLevels: teacherData.gradeLevels ?? [],
    yearsExperience: teacherData.yearsExperience ?? '',
    bio: teacherData.bio ?? '',
  };
}

/** /teacher/profile - the teacher's own account details. */
export default function TeacherProfilePage() {
  // GET /auth/me responds { user: {...} } - useApi's `data` is that whole
  // envelope, so the actual record is `me.user`.
  const { data: me, isLoading, error, run } = useApi(authService.getMe);
  const record = me?.user ?? null;

  const { user, setUser } = useAuth();
  const photo = usePhotoField(record?.profile?.profileImageUrl ?? null);

  useEffect(() => {
    run().catch(() => {});
  }, [run]);

  const form = useForm({
    initialValues: valuesFromMe(null),
    validationSchema: {
      firstName: [required('Enter a first name')],
      email: [required('Enter an email address'), emailRule()],
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
        profile: buildProfilePayload('TEACHER', values),
        photoFile: photo.file,
      });

      setUser({ ...user, firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone });
      toast.success('Profile updated');
      run().catch(() => {});
    },
  });

  useEffect(() => {
    if (record) form.reset(valuesFromMe(record));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  if (isLoading && !record) return <Loader message="Loading your profile…" />;

  return (
    <>
      <PageHeader title="My Profile" description="View and update your own account details." />

      {error && <Alert variant="error">{getErrorMessage(error)}</Alert>}

      {record && (
        <>
          <Card className="ui-field">
            {form.submitError && (
              <Alert variant="error" className="ui-field">
                {form.submitError}
              </Alert>
            )}

            <form onSubmit={form.handleSubmit} noValidate>
              <Input label="First name" required {...form.getFieldProps('firstName')} />
              <Input label="Last name" {...form.getFieldProps('lastName')} />
              <Input label="Email" type="email" required {...form.getFieldProps('email')} />
              <Input label="Phone" type="tel" {...form.getFieldProps('phone')} />

              <SectionHeader title="Address" as="h3" />
              <AddressFields
                values={form.values}
                getProps={form.getFieldProps}
                setFieldValue={form.setFieldValue}
              />

              <SectionHeader title="Teacher profile" as="h3" />
              {/* includeAdminOnly + lookupFetcher: "Subjects taught" is a
                  master-backed multi-select here too now, matching the Super
                  Admin edit form - was free text (audit fix, see
                  activeContext.md). "Grade levels taught" comes along with
                  the same flag - it was already missing on this page. */}
              <RoleProfileFields
                role="TEACHER"
                getProps={form.getFieldProps}
                photo={photo}
                includeAdminOnly
                lookupFetcher={teacherStudentService.masterOptionsFetcher}
              />

              <Button type="submit" loading={form.isSubmitting}>
                Save changes
              </Button>
            </form>
          </Card>

          <Card>
            <SectionHeader title="Change password" as="h3" />
            <ChangePasswordForm />
          </Card>
        </>
      )}
    </>
  );
}
