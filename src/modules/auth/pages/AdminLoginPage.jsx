import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Input, PasswordInput, Button, Alert, Checkbox, Badge } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { useAuth } from '../../../hooks/useAuth';
import { required, email as emailRule } from '../../../utils/validation';
import authService from '../services/auth.service';

/**
 * Super Admin sign-in.
 *
 * A separate endpoint, not just a separate page: the API rejects Student,
 * Teacher and Parent accounts here regardless of what this form sends. There
 * is deliberately no role selector and no sign-up link - Super Admin accounts
 * are provisioned directly in the database.
 */
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validationSchema: {
      email: [required('Enter your email address'), emailRule()],
      password: [required('Enter your password')],
    },
    async onSubmit(values) {
      const session = await signIn({ ...values, rememberMe }, authService.adminLogin);
      navigate('/admin/dashboard', { replace: true });
      return session;
    },
  });

  return (
    <Card
      title="Admin sign in"
      subtitle="Administrative access only"
      actions={<Badge variant="primary">Super Admin</Badge>}
    >
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
    </Card>
  );
}
