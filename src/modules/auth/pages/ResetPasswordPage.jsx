import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/common';
import { AuthSplitLayout } from '../components/AuthSplitLayout';
import { NewPasswordStep, PasswordUpdatedStep } from '../components/PasswordResetSteps';
import authService from '../services/auth.service';

/**
 * /reset-password?token= - the emailed link (a Super Admin's "reset
 * password", or the set-a-password invite for an account someone else made).
 * The same "Choose a new password" and "Password updated" steps as the code
 * flow on /forgot-password.
 *
 * On success every existing session for the account has been revoked
 * server-side, so the user signs in again rather than being signed in here.
 */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <AuthSplitLayout
        title="This link is incomplete"
        lead="The reset link is missing part of its address. Ask for a new code and try again."
      >
        <Button as={Link} to="/forgot-password" fullWidth size="lg" className="lg-submit">
          Reset my password
        </Button>
      </AuthSplitLayout>
    );
  }

  if (done) return <PasswordUpdatedStep />;

  return (
    <NewPasswordStep
      restart={{ to: '/forgot-password' }}
      onSave={async (values) => {
        await authService.resetPassword({ token, ...values });
        setDone(true);
      }}
    />
  );
}
