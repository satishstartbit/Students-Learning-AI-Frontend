import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Input, Button, Alert, EmptyState } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { required, email as emailRule } from '../../../utils/validation';
import authService from '../services/auth.service';

/**
 * Starts a password reset.
 *
 * The success screen is shown whether or not an account exists, matching the
 * API's deliberately generic response - neither the page nor the endpoint
 * reveals which addresses are registered.
 */
export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const form = useForm({
    initialValues: { email: '' },
    validationSchema: {
      email: [required('Enter your email address'), emailRule()],
    },
    async onSubmit(values) {
      await authService.forgotPassword(values.email);
      setSent(true);
    },
  });

  if (sent) {
    return (
      <Card>
        <EmptyState
          icon="✉"
          title="Check your email"
          description="If an account exists for that address, we have sent a link to reset your password. It expires in an hour."
          action={
            <Button as={Link} to="/login" variant="secondary">
              Back to sign in
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <Card
        title="Forgot your password?"
        subtitle="Give us your email and we will send a link to set a new one."
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

          <Button type="submit" fullWidth loading={form.isSubmitting}>
            Send the link
          </Button>
        </form>
      </Card>

      <p className="ui-shell__public-footer">
        <Link to="/login">Back to sign in</Link>
      </p>
    </>
  );
}
