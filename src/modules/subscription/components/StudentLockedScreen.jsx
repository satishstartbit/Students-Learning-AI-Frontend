import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';

/**
 * What a Grade 6+ student sees on every page while their family has no
 * subscription in force (K-5 gets KidLockedScreen). Deliberately says nothing
 * about plans or billing - that's the parent's business - just why, and what
 * will unlock it.
 */
export default function StudentLockedScreen() {
  const { reason, refresh } = useSubscriptionAccess();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const checkAgain = async () => {
    setChecking(true);
    await refresh();
    setChecking(false);
  };

  const noParent = reason === 'no_linked_parent';

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <Card style={{ maxWidth: 520, textAlign: 'center' }}>
        <div aria-hidden="true" style={{ fontSize: 44, lineHeight: 1 }}>
          🔒
        </div>
        <h1 style={{ margin: 'var(--spacing-md) 0 var(--spacing-sm)', fontSize: 'var(--font-size-xl)' }}>
          Your learning space is locked
        </h1>
        <p style={{ margin: '0 0 var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>
          {noParent
            ? "Your account isn't linked to a parent or guardian yet. Ask them to add you to their account and start a subscription."
            : "It will open as soon as your parent or guardian's subscription is active. Ask them to sign in and choose a plan."}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
          <Button onClick={checkAgain} loading={checking}>
            Check again
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              signOut();
              navigate('/login', { replace: true });
            }}
          >
            Log out
          </Button>
        </div>
      </Card>
    </div>
  );
}
