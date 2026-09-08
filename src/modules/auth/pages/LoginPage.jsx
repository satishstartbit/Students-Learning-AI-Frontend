import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, Input, PasswordInput, Button, Alert, Checkbox } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { useAuth } from '../../../hooks/useAuth';
import { required, email as emailRule } from '../../../utils/validation';
import authService from '../services/auth.service';

/**
 * Shared sign-in for Student, Teacher and Parent.
 *
 * One page for all three roles - the role comes from the authenticated
 * account, never from a selector on the form. The backend decides where the
 * user lands; this only follows it.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validationSchema: {
      email: [required('Enter your email address'), emailRule()],
      password: [required('Enter your password')],
    },
    async onSubmit(values) {
      const session = await signIn({ ...values, rememberMe }, authService.login);

      // Return the user where they were headed, or to their role's home.
      const target = location.state?.from?.pathname;
      navigate(target ?? '/', { replace: true });
      return session;
    },
  });

  return (
    <Card title="Sign in" subtitle="Welcome back">
      {form.submitError && (
        <Alert variant="error" className="ui-field">
          {form.submitError}
        </Alert>
      )}

      <form onSubmit={form.handleSubmit} noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          {...form.getFieldProps('email')}
        />

        <PasswordInput label="Password" required {...form.getFieldProps('password')} />

        <Checkbox
          name="rememberMe"
          label="Remember me"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />

        <Button type="submit" fullWidth loading={form.isSubmitting}>
          Sign in
        </Button>
      </form>

      <p style={{ marginTop: 'var(--spacing-lg)', fontSize: 'var(--font-size-sm)' }}>
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
      <p style={{ marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </Card>
  );
}
