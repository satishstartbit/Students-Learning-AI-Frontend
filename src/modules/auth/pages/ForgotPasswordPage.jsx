import { useEffect, useRef, useState } from 'react';
import { LuInfo, LuUser } from 'react-icons/lu';
import { Button, Input } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { required } from '../../../utils/validation';
import { AuthSplitLayout } from '../components/AuthSplitLayout';
import { CodeInput } from '../components/CodeInput';
import { NewPasswordStep, PasswordUpdatedStep, ResetAlert } from '../components/PasswordResetSteps';
import { clock, codeProblem, codeSentLine } from '../components/passwordReset';
import authService from '../services/auth.service';

const EMPTY_CODE = ['', '', '', '', '', ''];

/**
 * /forgot-password - built to the reset mockups on AuthSplitLayout (the same
 * frame as /login), in four steps on one page:
 *
 *   1. "Forgot your password? 🔑" - username or email, Send code
 *      (POST /auth/forgot-password; a student's code goes to their parent)
 *   2. "Enter your reset code 🔢" - 6 boxes, checked when the last digit is
 *      typed (POST /auth/verify-reset-code), resend after a countdown
 *   3. "Choose a new password 🔒" - with the live checklist, using the reset
 *      token step 2 handed back (POST /auth/reset-password)
 *   4. "Password updated 🎉" - every session was signed out, so sign in again
 *
 * The API never says whether an account exists, so step 2 names the address
 * only when the server shares it (PASSWORD_RESET_SHOW_DESTINATION).
 */
export default function ForgotPasswordPage() {
  const [step, setStep] = useState('request');
  // The last "Send code": { identifier, info, sentAt } - "Back" and sending
  // the same name again inside the resend wait returns to the same code.
  const [request, setRequest] = useState(null);
  const [resetToken, setResetToken] = useState(null);

  const startAgain = () => {
    setResetToken(null);
    setStep('request');
  };

  if (step === 'done') return <PasswordUpdatedStep />;

  if (step === 'password' && resetToken) {
    return (
      <NewPasswordStep
        restart={{ onClick: startAgain }}
        onSave={async (values) => {
          await authService.resetPassword({ token: resetToken, ...values });
          setStep('done');
        }}
      />
    );
  }

  if (step === 'code' && request) {
    return (
      <ResetCodeStep
        key={request.sentAt}
        {...request}
        onBack={() => setStep('request')}
        onVerified={(token) => {
          setResetToken(token);
          setStep('password');
        }}
      />
    );
  }

  return (
    <RequestStep
      initialIdentifier={request?.identifier ?? ''}
      onSend={async (identifier) => {
        const waitMs = (request?.info?.resendAfterSeconds ?? 45) * 1000;
        if (request && request.identifier.toLowerCase() === identifier.toLowerCase() && Date.now() - request.sentAt < waitMs) {
          setStep('code');
          return;
        }
        const result = await authService.forgotPassword(identifier);
        setRequest({ identifier, info: result?.data ?? {}, sentAt: Date.now() });
        setStep('code');
      }}
    />
  );
}

/** Step 1 - "Forgot your password? 🔑" */
function RequestStep({ initialIdentifier, onSend }) {
  const form = useForm({
    initialValues: { identifier: initialIdentifier },
    validationSchema: { identifier: [required('Enter your username or email')] },
    onSubmit: (values) => onSend(values.identifier.trim()),
  });

  return (
    <AuthSplitLayout
      back={{ to: '/login', label: 'Back to sign in' }}
      title={
        <>
          Forgot your password? <span aria-hidden="true">🔑</span>
        </>
      }
      lead="Enter your username or email and we’ll send a code to reset it."
    >
      {form.submitError && <ResetAlert title="We couldn’t send a code">{form.submitError}</ResetAlert>}

      <form onSubmit={form.handleSubmit} noValidate className="lg-form">
        <Input
          label="Username or email"
          type="text"
          autoComplete="username"
          placeholder="e.g. sam.k or you@email.com"
          startAdornment={<LuUser />}
          {...form.getFieldProps('identifier')}
        />

        <div className="lg-note lg-note--form">
          <LuInfo className="lg-note__icon" aria-hidden="true" />
          <div>
            <p className="lg-note__title">Students</p>
            <p className="lg-note__text">
              If your parent or teacher made your account, we&apos;ll send the code to them. Ask them to read it to you.
            </p>
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={form.isSubmitting} className="lg-submit">
          Send code
        </Button>
      </form>
    </AuthSplitLayout>
  );
}

/**
 * Step 2 - "Enter your reset code 🔢". Checks the code as soon as the last
 * digit is typed (or on Continue), counts down to "Send a new code", and
 * says plainly when a code is wrong or has run out.
 */
function ResetCodeStep({ identifier, info, sentAt, onBack, onVerified }) {
  const minutes = info.expiresInMinutes ?? 10;
  const cooldownMs = (info.resendAfterSeconds ?? 45) * 1000;

  const [code, setCode] = useState(EMPTY_CODE);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [destination, setDestination] = useState(info.destination ?? null);
  const [resendAt, setResendAt] = useState(() => sentAt + cooldownMs);
  const [now, setNow] = useState(() => Date.now());

  const boxesRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // After a wrong or used-up code the boxes are empty again: put the cursor
  // back in the first one, so the next code is typed fresh (a full row would
  // re-send on the first new digit and spend a try).
  useEffect(() => {
    if (status?.kind === 'invalid' || status?.kind === 'expired' || status?.kind === 'sent') {
      boxesRef.current?.querySelector('.lg-code__box')?.focus();
    }
  }, [status]);

  const verify = async (full) => {
    if (busy || full.length !== EMPTY_CODE.length) return;
    setBusy(true);
    setStatus(null);
    try {
      const result = await authService.verifyResetCode(identifier, full);
      setStatus({ kind: 'verified' });
      onVerified(result?.data?.resetToken);
    } catch (error) {
      const problem = codeProblem(error);
      if (problem.kind !== 'other') setCode(EMPTY_CODE);
      setStatus(problem);
      setBusy(false);
    }
  };

  const resend = async () => {
    setStatus(null);
    try {
      const result = await authService.forgotPassword(identifier);
      const data = result?.data ?? {};
      setResendAt(Date.now() + (data.resendAfterSeconds ?? cooldownMs / 1000) * 1000);
      setNow(Date.now());
      if (data.destination) setDestination(data.destination);
      setCode(EMPTY_CODE);
      setStatus({ kind: 'sent' });
    } catch (error) {
      setStatus({ kind: 'other', message: error?.message });
    }
  };

  const wrong = status?.kind === 'invalid' || status?.kind === 'expired';
  const waitMs = resendAt - now;

  return (
    <AuthSplitLayout
      back={{ onClick: onBack }}
      title={
        <>
          Enter your reset code <span aria-hidden="true">🔢</span>
        </>
      }
      lead={codeSentLine({ identifier, destination, codeLength: info.codeLength ?? 6 })}
    >
      {status?.kind === 'other' && <ResetAlert title="Something went wrong">{status.message}</ResetAlert>}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          verify(code.join(''));
        }}
      >
        <div ref={boxesRef}>
          <CodeInput
            id="reset-code"
            label="Reset code"
            value={code}
            onChange={(next) => {
              setCode(next);
              if (wrong) setStatus(null);
            }}
            onComplete={verify}
            error={wrong}
            disabled={busy}
          />
        </div>
        <p className="lg-code__hint" data-error={wrong || undefined} role={wrong ? 'alert' : undefined}>
          {status?.kind === 'invalid'
            ? 'That code isn’t right. Check it and try again.'
            : status?.kind === 'expired'
              ? 'That code has run out. Send a new code and use the newest one.'
              : status?.kind === 'sent'
                ? `We sent a new code. It works for ${minutes} minutes.`
                : `The code works for ${minutes} minutes.`}
        </p>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={busy}
          disabled={code.some((d) => !d)}
          className="lg-submit"
        >
          Continue
        </Button>
      </form>

      <p className="lg-foot">
        Didn&apos;t get it?
        <button type="button" onClick={resend} disabled={waitMs > 0}>
          {waitMs > 0 ? `Send a new code in ${clock(waitMs)}` : 'Send a new code'}
        </button>
      </p>
    </AuthSplitLayout>
  );
}
