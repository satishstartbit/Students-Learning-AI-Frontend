import { useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuLogOut } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import { useAuth } from '../../../../hooks/useAuth';
import { formatName } from '../../../../utils/format';
import { useKidPreferences } from '../../hooks/useKidPreferences';
import { useStudentExperience } from '../../hooks/useStudentExperience';
import { KidAvatar } from '../../components/kid/KidAvatar';
import { KidButton } from '../../components/kid/KidButton';
import { GearIcon } from '../../components/kid/KidIcons';
import { KidPageHeader } from '../../components/kid/KidPageHeader';

const SECTION = 'rounded-[1.75rem] bg-kid-sheet p-5 shadow-paper sm:p-7';

/**
 * K-5 Settings: who's signed in, Calm mode, and a big Log out button -
 * classroom devices are shared, so signing out has to be easy to find.
 */
export default function KidSettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, grade } = useStudentExperience();
  const { calm, setCalm } = useKidPreferences();
  const navigate = useNavigate();
  const uid = useId();

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div data-kid-page className="kid-ui mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-8 lg:py-10">
      <KidPageHeader icon={GearIcon} title="Settings" subtitle="Make My Learning Space just right for you." />

      <section aria-label="Me" className={cn(SECTION, 'flex items-center gap-5')}>
        <KidAvatar photoUrl={profile?.profileImageUrl} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-kid-display text-2xl font-semibold text-kid-ink">{formatName(user)}</p>
          {grade && <p className="text-lg text-kid-ink-soft">{grade}</p>}
        </div>
      </section>

      <section className={cn(SECTION, 'flex items-center justify-between gap-5')}>
        <div className="min-w-0">
          <h2 id={`${uid}-calm`} className="font-kid-display text-2xl font-semibold text-kid-ink">
            Calm mode
          </h2>
          <p id={`${uid}-calm-help`} className="mt-1 text-lg text-kid-ink-soft">
            Turns off moving pictures and confetti.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={calm}
          aria-labelledby={`${uid}-calm`}
          aria-describedby={`${uid}-calm-help`}
          onClick={() => setCalm(!calm)}
          className={cn(
            'relative h-11 w-[4.5rem] shrink-0 rounded-full border-2 transition-colors',
            calm ? 'border-kid-teal-deep bg-kid-teal' : 'border-kid-edge bg-kid-paper-deep'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-1/2 size-8 -translate-y-1/2 rounded-full bg-white shadow-paper transition-[left]',
              calm ? 'left-[calc(100%-2.25rem)]' : 'left-1'
            )}
          />
        </button>
      </section>

      <section className={cn(SECTION, 'flex flex-wrap items-center justify-between gap-5')}>
        <div className="min-w-0">
          <h2 className="font-kid-display text-2xl font-semibold text-kid-ink">All done?</h2>
          <p className="mt-1 text-lg text-kid-ink-soft">Always log out when you finish on a shared computer.</p>
        </div>
        <KidButton variant="soft" size="md" onClick={handleSignOut}>
          <LuLogOut className="size-5" aria-hidden="true" />
          Log out
        </KidButton>
      </section>
    </div>
  );
}
