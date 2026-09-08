import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, Button, Loader, EmptyState, ErrorState } from '../../../components/common';
import authService from '../services/auth.service';
import { getErrorMessage } from '../../../utils/errorHandler';

/**
 * Consumes an email-verification link.
 *
 * Verification runs once on mount. The guard ref matters: React 18+ mounts
 * effects twice in development, and the token is single use - a second call
 * would report "already used" for a link that had just succeeded.
 */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState(token ? 'verifying' : 'missing');
  const [error, setError] = useState(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    authService
      .verifyEmail(token)
      .then(() => setState('verified'))
      .catch((err) => {
        setError(getErrorMessage(err));
        setState('failed');
      });
  }, [token]);

  if (state === 'verifying') {
    return (
      <Card>
        <Loader message="Verifying your email…" />
      </Card>
    );
  }

  if (state === 'verified') {
    return (
      <Card>
        <EmptyState
          icon="✅"
          title="Email verified"
          description="Your address is confirmed. You can sign in now."
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
    <Card>
      <ErrorState
        title={state === 'missing' ? 'This link is incomplete' : 'We could not verify that link'}
        description={
          state === 'missing'
            ? 'The verification link is missing its token.'
            : error ?? 'The link may have expired or already been used.'
        }
      />
      <Button as={Link} to="/login" fullWidth variant="secondary">
        Back to sign in
      </Button>
    </Card>
  );
}
