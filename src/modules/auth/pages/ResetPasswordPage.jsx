import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, PasswordInput, Button, Alert, EmptyState, ErrorState } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { required, password as passwordRule, matches } from '../../../utils/validation';
import authService from '../services/auth.service';

/**
 * Completes a password reset.
 *
 * The token arrives in the URL. On success every existing session for the
 * account has been revoked server-side, so the user must sign in again - the
 * page says so rather than logging them straight in.
 */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [done, setDone] = useState(false);

  const form = useForm({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: {
      password: [required('Choose a new password'), passwordRule()],
      confirmPassword: [
        required('Confirm your new password'),
        matches('password', 'Passwords do not match'),
      ],
    },
    async onSubmit(values) {
      await authService.resetPassword({ token, ...values });
      setDone(true);
    },
  });

  if (!token) {
    return (
      <Card>
        <ErrorState
          title="This link is incomplete"
          description="The reset link is missing its token. Request a new one and try again."
        />
        <Button as={Link} to="/forgot-password" fullWidth variant="secondary">
          Request a new link
        </Button>
      </Card>
    );
  }

  if (done) {
    return (
      <Card>
        <EmptyState
          icon="✅"
          title="Password updated"
          description="You have been signed out on every device. Sign in with your new password."
          action={
            <Button as={Link} to="/login">
              Go to sign in
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card title="Choose a new password">
      {form.submitError && (
        <Alert variant="error" className="ui-field">
          {form.submitError}
        </Alert>
      )}

      <form onSubmit={form.handleSubmit} noValidate>
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          hint="At least 8 characters, with upper case, lower case and a number"
          required
          {...form.getFieldProps('password')}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          required
          {...form.getFieldProps('confirmPassword')}
        />

        <Button type="submit" fullWidth loading={form.isSubmitting}>
          Update password
        </Button>
      </form>
    </Card>
  );
}
