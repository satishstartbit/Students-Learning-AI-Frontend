import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Input,
  PasswordInput,
  Button,
  Alert,
  Radio,
  Checkbox,
  SectionHeader,
  EmptyState,
} from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import {
  required,
  email as emailRule,
  password as passwordRule,
  phone as phoneRule,
  matches,
} from '../../../utils/validation';
import { USER_ROLES } from '../../../utils/constants';
import authService from '../services/auth.service';
import RoleProfileFields from '../components/RoleProfileFields';
import { buildProfilePayload } from '../components/profilePayload';

/**
 * Public registration for Student, Teacher and Parent.
 *
 * The form changes with the selected role. SUPER_ADMIN is not offered here,
 * and the API rejects it too, so this is a convenience rather than the control.
 */
/**
 * Parent and Teacher only.
 *
 * A student does not sign themselves up - their parent adds them, which is
 * what creates the parent-child link. The API refuses a STUDENT registration
 * regardless, so this list only shapes the form.
 */
const ROLE_OPTIONS = [
  {
    value: USER_ROLES.PARENT,
    label: 'Parent',
    description: 'I want to support my child and add them to the platform',
  },
  {
    value: USER_ROLES.TEACHER,
    label: 'Teacher',
    description: 'I want to set work for my students',
  },
];

export default function RegisterPage() {
  const [done, setDone] = useState(false);

  const form = useForm({
    initialValues: {
      role: USER_ROLES.PARENT,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
    validationSchema: {
      role: [required('Choose how you will use the platform')],
      firstName: [required('Enter your first name')],
      email: [required('Enter your email address'), emailRule()],
      phone: [phoneRule()],
      password: [required('Choose a password'), passwordRule()],
      confirmPassword: [
        required('Confirm your password'),
        matches('password', 'Passwords do not match'),
      ],
      agreeToTerms: [(value) => (value ? null : 'You must agree to the terms and the privacy policy')],
    },
    async onSubmit(values) {
      const result = await authService.register({
        role: values.role,
        firstName: values.firstName,
        lastName: values.lastName || null,
        email: values.email,
        phone: values.phone || null,
        password: values.password,
        confirmPassword: values.confirmPassword,
        profile: buildProfilePayload(values.role, values),
      });

      setDone(true);
      return result;
    },
  });

  if (done) {
    return (
      <Card>
        <EmptyState
          icon="✉"
          title="Check your email"
          description="We have sent a verification link to your address. Open it to activate your account, then sign in."
          action={
            <Button as={Link} to="/login">
              Back to sign in
            </Button>
          }
        />
      </Card>
    );
  }

  const role = form.values.role;

  return (
    <>
      <Card title="Let's get you set up" subtitle="It takes about two minutes.">
        {form.submitError && (
          <Alert variant="error" className="ui-field">
            {form.submitError}
          </Alert>
        )}

        <form onSubmit={form.handleSubmit} noValidate>
          <Radio
            name="role"
            label="I am a"
            options={ROLE_OPTIONS}
            value={role}
            onChange={form.handleChange}
            error={form.touched.role ? form.errors.role : null}
            required
          />

          <SectionHeader title="Your details" as="h3" />

          <Input label="First name" required {...form.getFieldProps('firstName')} />
          <Input label="Last name" {...form.getFieldProps('lastName')} />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            {...form.getFieldProps('email')}
          />
          <Input label="Phone" type="tel" {...form.getFieldProps('phone')} />

          <PasswordInput
            label="Create a password"
            autoComplete="new-password"
            hint="At least 8 characters."
            required
            {...form.getFieldProps('password')}
          />
          <PasswordInput
            label="Confirm password"
            autoComplete="new-password"
            required
            {...form.getFieldProps('confirmPassword')}
          />

          <SectionHeader
            title={`About you as a ${role.toLowerCase()}`}
            description="All optional - you can fill these in later"
            as="h3"
          />

          {/*
            includeAdminOnly only for Teacher: it makes "Subjects taught" the
            same master-backed multi-select as everywhere else it appears
            (was free text - audit fix, see activeContext.md), via the public
            (unauthenticated) whitelist lookup. Deliberately NOT passed for
            Parent - includeAdminOnly also reveals an "Onboarding notes"
            field on that branch, meant for admin-entered internal notes, not
            something a person should be able to set on their own public
            signup form.
          */}
          <RoleProfileFields
            role={role}
            getProps={form.getFieldProps}
            includeAdminOnly={role === USER_ROLES.TEACHER}
            lookupFetcher={authService.masterOptionsFetcher}
          />

          {/* Plain text, not links - there's no terms/privacy page in this app yet
              to point to; add real links here once one exists. */}
          <Checkbox
            name="agreeToTerms"
            label="I agree to the terms and the privacy policy"
            checked={form.values.agreeToTerms}
            onChange={form.handleChange}
            error={form.touched.agreeToTerms ? form.errors.agreeToTerms : null}
          />

          <Button type="submit" fullWidth loading={form.isSubmitting}>
            Create account
          </Button>
        </form>
      </Card>

      <p className="ui-shell__public-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </>
  );
}
