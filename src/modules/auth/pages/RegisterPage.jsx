import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Input,
  PasswordInput,
  Button,
  Alert,
  Radio,
  SectionHeader,
  EmptyState,
} from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import {
  required,
  email as emailRule,
  password as passwordRule,
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
    },
    validationSchema: {
      role: [required('Choose how you will use the platform')],
      firstName: [required('Enter your first name')],
      email: [required('Enter your email address'), emailRule()],
      password: [required('Choose a password'), passwordRule()],
      confirmPassword: [
        required('Confirm your password'),
        matches('password', 'Passwords do not match'),
      ],
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
    <Card title="Create an account" subtitle="Tell us who you are">
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
          label="Password"
          autoComplete="new-password"
          hint="At least 8 characters, with upper case, lower case and a number"
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

        <RoleProfileFields role={role} getProps={form.getFieldProps} />

        <Button type="submit" fullWidth loading={form.isSubmitting}>
          Create account
        </Button>
      </form>

      <p style={{ marginTop: 'var(--spacing-lg)', fontSize: 'var(--font-size-sm)' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </Card>
  );
}
