import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LuClock3, LuInfo, LuLock, LuTriangleAlert, LuUser } from 'react-icons/lu';
import { Button, Checkbox, Input, PasswordInput } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { useForm } from '../../../hooks/useForm';
import { APP_NAME } from '../../../utils/constants';
import { required } from '../../../utils/validation';
import { AuthSplitLayout } from '../components/AuthSplitLayout';
import { VerifyEmailStep } from '../components/VerifyEmailStep';
import authService from '../services/auth.service';

/** "9:42" */
const clock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/**
 * What went wrong with the last try, from the API error (backend
 * auth.service "sign-in pause"): a wrong password with N tries left, a
 * paused account with the time it opens again, a teacher/parent whose email
 * isn't verified yet (right password), or anything else.
 */
function toProblem(error) {
  const detail = (error?.errors ?? [])[0] ?? {};
  if (detail.code === 'EMAIL_NOT_VERIFIED' && detail.email) {
    return { kind: 'unverified', email: detail.email };
  }
  if (detail.code === 'SIGNIN_PAUSED' || error?.status === 429) {
    const until = detail.lockedUntil ? new Date(detail.lockedUntil).getTime() : Date.now() + 10 * 60 * 1000;
    return { kind: 'paused', until, minutes: detail.pauseMinutes ?? 10 };
  }
  if (detail.code === 'INVALID_CREDENTIALS' || error?.status === 401) {
    return { kind: 'mismatch', attemptsLeft: Number.isFinite(detail.attemptsLeft) ? detail.attemptsLeft : null };
  }
  return { kind: 'other', message: error?.message || 'Something went wrong. Please try again.' };
}

/**
 * Shared sign-in for Student, Teacher and Parent, built to the sign-in
 * mockups on AuthSplitLayout (photo hero left, form right; a banner on
 * phones), in the Forest green.
 *
 * One page for all three roles - the role comes from the account, never from
 * a selector. Wrong passwords show how many tries are left; after too many
 * the backend pauses sign-in and this page counts down to when it reopens,
 * with the fields locked and a way to reset the password.
 *
 * A teacher or parent who never verified their email (the code didn't
 * arrive, or they left the sign-up page) gets "Check your email" here with a
 * fresh code, and is signed in as soon as it's entered.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const [problem, setProblem] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const paused = problem?.kind === 'paused' && problem.until > now;

  // Tick once a second while paused; the pause ends on its own at zero.
  useEffect(() => {
    if (problem?.kind !== 'paused') return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [problem]);

  const form = useForm({
    initialValues: { identifier: '', password: '' },
    validationSchema: {
      identifier: [required('Enter your username or email')],
      password: [required('Enter your password')],
    },
    async onSubmit(values) {
      setProblem(null);
      try {
        const session = await signIn({ ...values, rememberMe }, authService.login);
        // Return the user where they were headed, or to their role's home.
        navigate(location.state?.from?.pathname ?? '/', { replace: true });
        return session;
      } catch (error) {
        setNow(Date.now());
        setProblem(toProblem(error));
        return null;
      }
    },
  });

  if (problem?.kind === 'unverified') {
    return (
      <VerifyEmailStep
        email={problem.email}
        sendOnOpen
        lead={`Your email isn't verified yet. We've sent a new 6-digit code to ${problem.email}. Enter it to finish signing in.`}
        onBack={() => setProblem(null)}
        onVerified={async () => {
          try {
            await signIn({ ...form.values, rememberMe }, authService.login);
            navigate(location.state?.from?.pathname ?? '/', { replace: true });
            return true;
          } catch {
            return false;
          }
        }}
      />
    );
  }

  const passwordProps = form.getFieldProps('password');
  const mismatch = problem?.kind === 'mismatch';
  const triesLine =
    mismatch && problem.attemptsLeft != null
      ? `Wrong password. You have ${problem.attemptsLeft} ${problem.attemptsLeft === 1 ? 'try' : 'tries'} left before sign-in pauses.`
      : null;

  return (
    <AuthSplitLayout
      title={
        <>
          Welcome back <span aria-hidden="true">👋</span>
        </>
      }
      lead="Sign in with your username or email."
    >
      {paused && (
        <div className="lg-alert lg-alert--paused" role="alert">
          <LuClock3 className="lg-alert__icon" aria-hidden="true" />
          <div>
            <p className="lg-alert__title">Sign-in is paused for {problem.minutes} minutes</p>
            <p className="lg-alert__text">
              There were too many wrong tries, so we paused sign-in to keep this account safe. You can reset your password
              now.
            </p>
          </div>
        </div>
      )}

      {mismatch && (
        <div className="lg-alert lg-alert--error" role="alert">
          <LuTriangleAlert className="lg-alert__icon" aria-hidden="true" />
          <div>
            <p className="lg-alert__title">That didn&apos;t match</p>
            <p className="lg-alert__text">Check the spelling of your username and password, then try again.</p>
          </div>
        </div>
      )}

      {problem?.kind === 'other' && (
        <div className="lg-alert lg-alert--error" role="alert">
          <LuTriangleAlert className="lg-alert__icon" aria-hidden="true" />
          <div>
            <p className="lg-alert__title">We couldn&apos;t sign you in</p>
            <p className="lg-alert__text">{problem.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit} noValidate className="lg-form">
        <Input
          label="Username or email"
          type="text"
          autoComplete="username"
          placeholder="e.g. sam.k or you@email.com"
          startAdornment={<LuUser />}
          disabled={paused}
          {...form.getFieldProps('identifier')}
        />

        <PasswordInput
          label="Password"
          placeholder="Your password"
          startAdornment={<LuLock />}
          disabled={paused}
          {...passwordProps}
          error={passwordProps.error || triesLine}
          onChange={(e) => {
            passwordProps.onChange(e);
            if (triesLine) setProblem((p) => (p?.kind === 'mismatch' ? { ...p, attemptsLeft: null } : p));
          }}
        />

        {!paused && (
          <div className="lg-row">
            <Checkbox
              name="rememberMe"
              label="Keep me signed in"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mb-0"
            />
            <Link to="/forgot-password" className="lg-link">
              Forgot password?
            </Link>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={form.isSubmitting}
          disabled={paused}
          className={paused ? 'lg-submit lg-submit--paused' : 'lg-submit'}
        >
          {paused ? `Try again in ${clock(problem.until - now)}` : 'Sign in'}
        </Button>
      </form>

      {paused ? (
        <Button as={Link} to="/forgot-password" variant="secondary" fullWidth size="lg" className="lg-outline">
          Reset my password
        </Button>
      ) : (
        <>
          <div className="lg-note">
            <LuInfo className="lg-note__icon" aria-hidden="true" />
            <div>
              <p className="lg-note__title">Signing in for school?</p>
              <p className="lg-note__text">
                Use the username your parent or teacher gave you. If you&apos;re stuck, ask them to help.
              </p>
            </div>
          </div>

          <p className="lg-divider">
            <span>New to {APP_NAME}?</span>
          </p>

          <Button as={Link} to="/register" variant="secondary" fullWidth size="lg" className="lg-outline">
            Create a parent or teacher account
          </Button>
        </>
      )}
    </AuthSplitLayout>
  );
}
