import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, Input, PasswordInput, Button, Alert, Checkbox } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { useAuth } from '../../../hooks/useAuth';
import { required } from '../../../utils/validation';
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
    initialValues: { identifier: '', password: '' },
    validationSchema: {
      identifier: [required('Enter your username, email, or phone number')],
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
    <>
      <Card title="Welcome back" subtitle="Sign in to pick up where you left off.">
        {form.submitError && (
          <Alert variant="error" className="ui-field">
            {form.submitError}
          </Alert>
        )}

        <form onSubmit={form.handleSubmit} noValidate>
          <Input
            label="Email"
            hint="Username or phone number also work"
            type="text"
            autoComplete="username"
            required
            {...form.getFieldProps('identifier')}
          />

          <PasswordInput label="Password" required {...form.getFieldProps('password')} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <Checkbox
              name="rememberMe"
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mb-0"
            />
            <Link to="/forgot-password" style={{ fontSize: 'var(--font-size-sm)' }}>
              Forgot your password?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={form.isSubmitting}>
            Sign in
          </Button>
        </form>
      </Card>

      <p className="ui-shell__public-footer">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </>
  );
}
