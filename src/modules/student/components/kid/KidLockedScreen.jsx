import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuLogOut, LuRotateCcw } from 'react-icons/lu';
import { useAuth } from '../../../../hooks/useAuth';
import { useSubscriptionAccess } from '../../../subscription/hooks/useSubscriptionAccess';
import { KidButton } from './KidButton';
import { StarIcon } from './KidIcons';
import { PaperCard } from './PaperKit';

/**
 * The K-4 version of the "locked until your family subscribes" screen - gentle
 * wording, one clear thing to do (ask a grown-up), and Log out within reach
 * for shared classroom devices.
 */
export function KidLockedScreen() {
  const { reason, refresh } = useSubscriptionAccess();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const checkAgain = async () => {
    setChecking(true);
    await refresh();
    setChecking(false);
  };

  return (
    <div data-kid-page className="kid-ui mx-auto max-w-xl px-4 py-10 sm:px-8">
      <PaperCard tone="sky" className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:px-10">
        <StarIcon className="size-20" />
        <h1 className="font-kid-display text-3xl font-semibold text-kid-ink sm:text-4xl">
          My Learning Space is resting
        </h1>
        <p className="max-w-md text-lg text-kid-ink-soft">
          {reason === 'no_linked_parent'
            ? 'Ask a grown-up to add you to their account.'
            : 'Ask a grown-up to turn it on for you. It will be ready as soon as they do!'}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <KidButton size="md" onClick={checkAgain} disabled={checking}>
            <LuRotateCcw className="size-5" aria-hidden="true" />
            {checking ? 'Checking…' : 'Check again'}
          </KidButton>
          <KidButton
            variant="soft"
            size="md"
            onClick={() => {
              signOut();
              navigate('/login', { replace: true });
            }}
          >
            <LuLogOut className="size-5" aria-hidden="true" />
            Log out
          </KidButton>
        </div>
      </PaperCard>
    </div>
  );
}

export default KidLockedScreen;
