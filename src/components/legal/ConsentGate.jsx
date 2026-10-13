import { useState } from 'react';
import { Alert, Button, Card, Checkbox, Loader } from '../common';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errorHandler';
import { acceptConsent, getMe } from '../../modules/auth/services/auth.service';
import LegalLinks from './LegalLinks';
import { fillPlaceholders, useLegalContent } from './useLegalContent';
import './legal.css';

/**
 * Phase 1 §12 "Consent and safety". Wraps the Teacher and Parent areas: when
 * GET /auth/me says this person hasn't agreed to the CURRENT Terms of Use and
 * Privacy Policy (an account Super Admin created, or the documents changed),
 * or a parent's child has no consent yet, they see this screen instead of the
 * page until they agree. Everything they read is the admin's wording.
 *
 * If /auth/me can't be read the area opens anyway - never trap someone out
 * of their account over a lookup (the server records nothing without a yes).
 */
export function ConsentGate({ children }) {
  const me = useApi(getMe, { immediate: true });
  const [answered, setAnswered] = useState(null);
  const consent = answered ?? me.data?.consent ?? null;

  if (me.isLoading && !me.data) return <Loader message="Loading…" />;
  if (!consent?.required) return children;
  return <ConsentScreen consent={consent} onDone={setAnswered} />;
}

function ConsentScreen({ consent, onDone }) {
  const { content: legal } = useLegalContent();
  const { signOut } = useAuth();
  const children = consent.children ?? [];
  const needsTerms = !consent.termsAccepted;
  const [terms, setTerms] = useState(false);
  const [given, setGiven] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const allChecked = (!needsTerms || terms) && children.every((c) => given.has(c.id));
  const toggleChild = (id) =>
    setGiven((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await acceptConsent({ acceptTerms: true, childIds: [...given] });
      onDone(res.data ?? { required: false });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lgl-consent td-page">
      <Card title={legal?.updatedTitle || 'Please review our terms'}>
        <p className="lgl-consent__intro">
          {legal?.updatedMessage || 'Before you continue, please read and agree to our Terms of Use and Privacy Policy.'}
        </p>
        <LegalLinks content={legal} />
        <div className="lgl-consent__checks">
          {needsTerms && (
            <Checkbox
              name="acceptTerms"
              label={legal?.signupConsentLabel || 'I agree to the Terms of Use and Privacy Policy'}
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
          )}
          {children.map((child) => (
            <Checkbox
              key={child.id}
              name={`child-${child.id}`}
              label={fillPlaceholders(
                legal?.guardianConsentLabel || "I am {{child}}'s parent or guardian. I agree to the Terms of Use and Privacy Policy for them.",
                { child: child.firstName || 'my child' }
              )}
              checked={given.has(child.id)}
              onChange={() => toggleChild(child.id)}
            />
          ))}
        </div>
        {error && (
          <Alert variant="error" className="ui-field">
            {error}
          </Alert>
        )}
        <div className="lgl-consent__actions">
          <Button type="button" variant="ghost" onClick={() => signOut()} disabled={busy}>
            Sign out
          </Button>
          <Button type="button" onClick={submit} loading={busy} disabled={!allChecked}>
            Agree and continue
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ConsentGate;
