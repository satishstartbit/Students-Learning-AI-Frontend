import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuTriangleAlert } from 'react-icons/lu';
import { Button } from '../../../components/common';
import authService from '../services/auth.service';
import { AuthSplitLayout } from './AuthSplitLayout';
import { CodeInput } from './CodeInput';

const EMPTY_CODE = ['', '', '', '', '', ''];

/** "0:45" */
const clock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export function ErrorAlert({ title, children }) {
  return (
    <div className="lg-alert lg-alert--error" role="alert">
      <LuTriangleAlert className="lg-alert__icon" aria-hidden="true" />
      <div>
        <p className="lg-alert__title">{title}</p>
        {children && <p className="lg-alert__text">{children}</p>}
      </div>
    </div>
  );
}

const SEND_FAILED =
  'We couldn’t send the email just now. Wait for the timer, then press “Send a new code”. If it keeps failing, contact support.';

/**
 * "Check your email" - the 6-digit code (backend auth.service#verifyEmailCode:
 * 10 minutes, resend after 45s). Verifies as soon as the last digit is typed
 * (or on the button), counts down to "Send a new code", and says plainly when
 * a code is wrong, has run out, or the email could not be sent.
 *
 * Used by /register straight after sign-up, and by /login when a teacher or
 * parent with an unverified address signs in (`sendOnOpen`: a fresh code is
 * sent as the step opens, since the first one may never have arrived).
 *
 * `verification` is the API's { expiresInMinutes, resendAfterSeconds, emailSent }.
 */
export function VerifyEmailStep({ email, verification = {}, onBack, onVerified, sendOnOpen = false, lead }) {
  const minutes = verification.expiresInMinutes ?? 10;
  const cooldownMs = (verification.resendAfterSeconds ?? 45) * 1000;

  const [code, setCode] = useState(EMPTY_CODE);
  const [status, setStatus] = useState(() => (verification.emailSent === false ? { kind: 'send-failed' } : null));
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(sendOnOpen);
  const [resendAt, setResendAt] = useState(() => (sendOnOpen ? 0 : Date.now() + cooldownMs));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const send = async () => {
    setStatus(null);
    setSending(true);
    try {
      const result = await authService.resendVerification(email);
      const data = result?.data ?? {};
      setResendAt(Date.now() + (data.resendAfterSeconds ?? cooldownMs / 1000) * 1000);
      setNow(Date.now());
      setCode(EMPTY_CODE);
      setStatus(data.emailSent === false ? { kind: 'send-failed' } : { kind: 'sent' });
    } catch (error) {
      setStatus({ kind: 'other', message: error?.message });
    } finally {
      setSending(false);
    }
  };

  // Login: the first code may never have arrived, so send a fresh one once.
  const sentOnOpen = useRef(false);
  useEffect(() => {
    if (!sendOnOpen || sentOnOpen.current) return;
    sentOnOpen.current = true;
    send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendOnOpen]);

  const verify = async (full) => {
    if (busy) return;
    if (full.length !== 6) {
      setStatus({ kind: 'incomplete' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await authService.verifyEmailCode(email, full);
      setStatus({ kind: 'verified' });
      if (!(await onVerified())) setStatus({ kind: 'verified-signin' });
    } catch (error) {
      const detail = (error?.errors ?? [])[0] ?? {};
      if (detail.code === 'CODE_EXPIRED') setStatus({ kind: 'expired' });
      else if (detail.code === 'INVALID_CODE' || error?.status === 400) setStatus({ kind: 'invalid' });
      else setStatus({ kind: 'other', message: error?.message });
    } finally {
      setBusy(false);
    }
  };

  const wrong = status?.kind === 'invalid' || status?.kind === 'expired' || status?.kind === 'incomplete';
  const waitMs = resendAt - now;

  if (status?.kind === 'verified-signin') {
    return (
      <AuthSplitLayout title="You're verified ✅" lead="Your email is confirmed. Sign in to get started.">
        <Button as={Link} to="/login" fullWidth size="lg" className="lg-submit">
          Sign in
        </Button>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      back={onBack ? { onClick: onBack } : undefined}
      title={
        <>
          Check your email <span aria-hidden="true">📬</span>
        </>
      }
      lead={lead ?? `We sent a 6-digit code to ${email}. Enter it below to verify your account.`}
    >
      {status?.kind === 'send-failed' && <ErrorAlert title="The email didn’t go out">{SEND_FAILED}</ErrorAlert>}
      {status?.kind === 'other' && <ErrorAlert title="Something went wrong">{status.message}</ErrorAlert>}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          verify(code.join(''));
        }}
      >
        <CodeInput
          value={code}
          onChange={(next) => {
            setCode(next);
            if (wrong) setStatus(null);
          }}
          onComplete={verify}
          error={wrong}
          disabled={busy || status?.kind === 'verified'}
        />
        <p className="lg-code__hint" data-error={wrong || undefined} role={wrong ? 'alert' : undefined}>
          {sending
            ? 'Sending a new code…'
            : status?.kind === 'incomplete'
              ? 'Enter all 6 digits from the email.'
              : status?.kind === 'invalid'
                ? 'That code isn’t right. Check the email and try again.'
                : status?.kind === 'expired'
                  ? 'That code has run out. Send a new code and use the newest one.'
                  : status?.kind === 'sent'
                    ? `We sent a new code. It works for ${minutes} minutes.`
                    : `The code works for ${minutes} minutes.`}
        </p>

        <Button type="submit" fullWidth size="lg" loading={busy || status?.kind === 'verified'} className="lg-submit">
          Verify email
        </Button>
      </form>

      <p className="lg-foot">
        Didn&apos;t get it?{wrong ? '' : ' Check spam, or'}
        <button type="button" onClick={send} disabled={sending || waitMs > 0}>
          {sending ? 'Sending…' : waitMs > 0 ? `Resend in ${clock(waitMs)}` : 'Send a new code'}
        </button>
      </p>
    </AuthSplitLayout>
  );
}

export default VerifyEmailStep;
