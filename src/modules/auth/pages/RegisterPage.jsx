import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LuInfo, LuLock, LuMail } from 'react-icons/lu';
import { Button, Checkbox, Input, Loader, PasswordInput } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { useForm } from '../../../hooks/useForm';
import { USER_ROLES } from '../../../utils/constants';
import { getErrorMessage } from '../../../utils/errorHandler';
import { detectBrowserTimezone } from '../../../utils/locale';
import { required, email as emailRule, password as passwordRule } from '../../../utils/validation';
import { formatSubjects } from '../../invitations/invitationStatus';
import invitationService from '../../invitations/services/teacherInvitation.service';
import { AuthSplitLayout } from '../components/AuthSplitLayout';
import { ErrorAlert, VerifyEmailStep } from '../components/VerifyEmailStep';
import authService from '../services/auth.service';

/**
 * Parent and Teacher only. A student does not sign themselves up - their
 * parent adds them, which is what creates the parent-child link. The API
 * refuses a STUDENT registration regardless, so this only shapes the form.
 */
const ROLE_OPTIONS = [
  { value: USER_ROLES.PARENT, label: 'A parent', description: "Follow your children's progress and learning." },
  { value: USER_ROLES.TEACHER, label: 'A teacher', description: 'Set work and support your students.' },
];

const PASSWORD_HINT = 'At least 8 characters, with an upper case letter, a lower case letter and a number.';

/** "Ms. Jane Rivera" -> { firstName: "Jane", lastName: "Rivera" } - a starting point the teacher can edit. */
function splitName(name) {
  const parts = String(name ?? '')
    .replace(/^(mr|mrs|ms|miss|mx|dr|prof)\.?\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

/**
 * /register - built to the sign-up mockups on AuthSplitLayout (the same
 * frame as /login): "Create your account" (parent or teacher, name, email,
 * password, terms), then "Check your email" for the 6-digit code
 * (backend auth.service#verifyEmailCode - 10 minutes, resend after 45s).
 * A verified account is signed straight in.
 *
 * Arriving from a parent's teacher invitation (?invite=), the account is a
 * teacher account for the invited email; creating it accepts the invitation
 * and proves the address, so there is no code step.
 */
export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const invitation = useApi(invitationService.getByToken, { immediate: Boolean(inviteToken), args: [inviteToken] });
  const invite = inviteToken ? invitation.data : null;
  const inviteUsable = invite?.status === 'pending';

  if (inviteToken && invitation.isLoading && !invitation.data) {
    return (
      <AuthSplitLayout title="Create your account" lead="Loading your invitation…">
        <Loader message="Loading your invitation…" />
      </AuthSplitLayout>
    );
  }

  if (inviteToken && !inviteUsable) {
    return (
      <AuthSplitLayout
        title="This invitation can't be used"
        lead={
          invitation.error
            ? getErrorMessage(invitation.error)
            : `This invitation has already been ${invite?.status}. Ask the parent to send you a new one.`
        }
      >
        <Button as={Link} to="/register" fullWidth size="lg" className="lg-submit">
          Create an account without it
        </Button>
        <p className="lg-foot">
          Already have an account?
          <Link to="/login">Sign in</Link>
        </p>
      </AuthSplitLayout>
    );
  }

  return <SignUp key={invite?.id ?? 'plain'} inviteToken={inviteUsable ? inviteToken : null} invite={inviteUsable ? invite : null} />;
}

function SignUp({ inviteToken, invite }) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [step, setStep] = useState('form');
  // The account created by this visit: { email, verification } - so "Back"
  // and re-submitting the same address returns to the code, not a duplicate.
  const [created, setCreated] = useState(null);
  const [problem, setProblem] = useState(null);
  const invitedName = splitName(invite?.teacherName);

  /** Signs the new account in and lets the router send it to its home. */
  const signInAndGo = async (email, password) => {
    try {
      await signIn({ identifier: email, password }, authService.login);
      navigate('/', { replace: true });
      return true;
    } catch {
      return false;
    }
  };

  const form = useForm({
    initialValues: {
      role: invite ? USER_ROLES.TEACHER : USER_ROLES.PARENT,
      firstName: invitedName.firstName,
      lastName: invitedName.lastName,
      email: invite?.teacherEmail ?? '',
      password: '',
      agreeToTerms: false,
    },
    validationSchema: {
      role: [required('Choose how you will use the platform')],
      firstName: [required('Enter your first name')],
      email: [required('Enter your email address'), emailRule()],
      password: [required('Choose a password'), passwordRule()],
      agreeToTerms: [(value) => (value ? null : 'Please agree to the Terms of Use and Privacy Policy')],
    },
    async onSubmit(values) {
      setProblem(null);
      const email = values.email.trim().toLowerCase();

      // Back from "Check your email" with the same address: the account
      // exists already - just return to the code.
      if (created?.email === email) {
        setStep('verify');
        return null;
      }

      try {
        const result = await authService.register({
          role: values.role,
          firstName: values.firstName,
          lastName: values.lastName || null,
          email: values.email,
          // Canada spans several zones - start on the browser's own zone;
          // it can be changed on My Profile.
          timezone: detectBrowserTimezone(),
          password: values.password,
          confirmPassword: values.password,
          ...(inviteToken ? { invitationToken: inviteToken } : {}),
        });
        const data = result?.data ?? {};

        if (data.invitationAccepted || !data.verificationRequired) {
          if (!(await signInAndGo(values.email, values.password))) navigate('/login', { replace: true });
          return result;
        }

        setCreated({ email, verification: data.verification ?? {} });
        setStep('verify');
        return result;
      } catch (error) {
        // Already signed up (perhaps the code never arrived): signing in
        // leads to "Check your email" with a fresh code.
        if (error?.status === 409) setProblem({ conflict: true });
        else setProblem({ message: error?.message || 'We couldn’t create your account. Please try again.' });
        return null;
      }
    },
  });

  if (step === 'verify' && created) {
    return (
      <VerifyEmailStep
        email={created.email}
        verification={created.verification}
        onBack={() => setStep('form')}
        onVerified={() => signInAndGo(created.email, form.values.password)}
      />
    );
  }

  const role = form.values.role;
  const setRole = (value) => form.handleChange({ target: { name: 'role', value, type: 'radio' } });

  return (
    <AuthSplitLayout
      wide
      title={
        <>
          {invite ? 'Create your teacher account' : 'Create your account'} <span aria-hidden="true">🌱</span>
        </>
      }
      lead={
        invite
          ? 'Then you are connected straight away.'
          : 'For parents and teachers. Once you’re in, you can add your children or students.'
      }
    >
      {problem?.conflict && (
        <ErrorAlert title="You already have an account">
          This email is already signed up. <Link to="/login">Sign in</Link> with your password. If you never
          verified your email, we&apos;ll send you a new code there.
        </ErrorAlert>
      )}
      {problem?.message && <ErrorAlert title="We couldn’t create your account">{problem.message}</ErrorAlert>}

      {invite && (
        <div className="lg-note" style={{ marginTop: 0, marginBottom: 16 }} data-testid="register-invite-banner">
          <LuInfo className="lg-note__icon" aria-hidden="true" />
          <div>
            <p className="lg-note__title">You&apos;re accepting an invitation</p>
            <p className="lg-note__text">
              Creating this account accepts {invite.invitedBy?.name ?? 'the parent'}&apos;s invitation to connect with{' '}
              {invite.student?.firstName ?? 'their child'} for {formatSubjects(invite.subjects)}.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit} noValidate className="lg-form">
        {/* The invitation fixes the role; otherwise the person picks one. */}
        {!invite && (
          <fieldset className="lg-roles">
            <legend className="lg-roles__legend">I&apos;m signing up as</legend>
            <div className="lg-roles__grid" role="radiogroup">
              {ROLE_OPTIONS.map((option) => (
                <label key={option.value} className="lg-role" data-selected={role === option.value}>
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={() => setRole(option.value)}
                    className="lg-role__input"
                  />
                  <span className="lg-role__dot" aria-hidden="true" />
                  <span>
                    <span className="lg-role__title">{option.label}</span>
                    <span className="lg-role__desc">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="lg-two">
          <Input label="First name" autoComplete="given-name" {...form.getFieldProps('firstName')} />
          <Input label="Last name" autoComplete="family-name" {...form.getFieldProps('lastName')} />
        </div>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          startAdornment={<LuMail />}
          readOnly={Boolean(invite)}
          hint={invite ? 'The address the invitation was sent to' : undefined}
          {...form.getFieldProps('email')}
        />

        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="Create a password"
          startAdornment={<LuLock />}
          hint={PASSWORD_HINT}
          {...form.getFieldProps('password')}
        />

        <div className="lg-terms">
          <Checkbox
            name="agreeToTerms"
            label="I agree to the Terms of Use and Privacy Policy"
            checked={form.values.agreeToTerms}
            onChange={form.handleChange}
            error={form.touched.agreeToTerms ? form.errors.agreeToTerms : null}
          />
        </div>

        <Button type="submit" fullWidth size="lg" loading={form.isSubmitting} className="lg-submit">
          Create account
        </Button>
      </form>

      <p className="lg-foot">
        Already have an account?
        <Link to="/login">Sign in</Link>
      </p>
    </AuthSplitLayout>
  );
}
