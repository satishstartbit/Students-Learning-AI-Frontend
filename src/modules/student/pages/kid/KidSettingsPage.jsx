import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuLogOut, LuPalette, LuPencil } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import { useAuth } from '../../../../hooks/useAuth';
import { toast } from '../../../../hooks/useToast';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { formatName } from '../../../../utils/format';
import { SubjectColorsDialog } from '../../../planner/components/schoolwork/SubjectColorsDialog';
import { ViewIcon } from '../../../planner/components/schoolwork/ViewSwitcher';
import { useSchoolworkSettings } from '../../../planner/hooks/useSchoolworkSettings';
import { VIEW_OPTIONS } from '../../../planner/schoolwork';
import { useKidPreferences } from '../../hooks/useKidPreferences';
import { useStudentExperience } from '../../hooks/useStudentExperience';
import { KidAvatar } from '../../components/kid/KidAvatar';
import { KidButton } from '../../components/kid/KidButton';
import { GearIcon } from '../../components/kid/KidIcons';
import { KidPageHeader } from '../../components/kid/KidPageHeader';
import { KidToggle } from '../../components/kid/KidToggle';

const SECTION = 'rounded-[1.75rem] bg-kid-sheet p-5 shadow-paper sm:p-7';

/** The three views in K-4 words (My week = the calendar). */
const KID_VIEW_LABELS = { board: 'Sticky notes', list: 'My list', calendar: 'My week' };
const KID_SWITCHES = [
  { key: 'showTypeIcons', label: 'Show little pictures for kinds of work' },
  { key: 'showEstimatedTime', label: 'Show how long things take' },
  { key: 'showPersonalEvents', label: 'Show my plans (like practice) with my work' },
];

/**
 * K-4 Settings: who's signed in, their "about me" answers, Calm mode, and a
 * big Log out button - classroom devices are shared, so signing out has to be
 * easy to find (this page stays reachable even before onboarding is done).
 */
export default function KidSettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, grade, onboarded } = useStudentExperience();
  const { calm, setCalm } = useKidPreferences();
  const navigate = useNavigate();
  const uid = useId();
  const schoolwork = useSchoolworkSettings('me');
  const [colorsOpen, setColorsOpen] = useState(false);
  const saveSchoolwork = (patch) =>
    schoolwork.update(patch).catch((err) => {
      toast.error(getErrorMessage(err) || 'That didn’t save. Try again.');
    });

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

      <section className={cn(SECTION, 'flex flex-wrap items-center justify-between gap-5')}>
        <div className="min-w-0">
          <h2 className="font-kid-display text-2xl font-semibold text-kid-ink">About me</h2>
          <p className="mt-1 text-lg text-kid-ink-soft">
            {onboarded ? 'What you like, what helps you focus, and more.' : "You haven't answered your questions yet."}
          </p>
        </div>
        <KidButton asChild variant="soft" size="md">
          <Link to="/student/onboarding">
            <LuPencil className="size-5" aria-hidden="true" />
            {onboarded ? 'Change my answers' : 'Answer questions'}
          </Link>
        </KidButton>
      </section>

      <section className={SECTION} aria-labelledby={`${uid}-work`}>
        <h2 id={`${uid}-work`} className="font-kid-display text-2xl font-semibold text-kid-ink">
          How I see my work
        </h2>
        <p className="mt-1 text-lg text-kid-ink-soft">Pick what My week shows first. You can switch there any time.</p>
        <div className="mt-4 flex flex-wrap gap-3" role="radiogroup" aria-labelledby={`${uid}-work`}>
          {VIEW_OPTIONS.map((v) => (
            <KidButton
              key={v.key}
              size="md"
              role="radio"
              aria-checked={schoolwork.preferences.defaultView === v.key}
              variant={schoolwork.preferences.defaultView === v.key ? 'primary' : 'soft'}
              onClick={() => saveSchoolwork({ defaultView: v.key })}
            >
              <ViewIcon view={v.key} size={20} />
              {KID_VIEW_LABELS[v.key]}
            </KidButton>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-4">
          {KID_SWITCHES.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-5">
              <p id={`${uid}-${s.key}`} className="min-w-0 text-lg text-kid-ink">
                {s.label}
              </p>
              <KidToggle
                checked={Boolean(schoolwork.preferences[s.key])}
                onCheckedChange={(v) => saveSchoolwork({ [s.key]: v })}
                aria-labelledby={`${uid}-${s.key}`}
              />
            </div>
          ))}
        </div>
        <KidButton className="mt-5" variant="soft" size="md" onClick={() => setColorsOpen(true)}>
          <LuPalette className="size-5" aria-hidden="true" />
          My subject colours
        </KidButton>
        <SubjectColorsDialog isOpen={colorsOpen} onClose={() => setColorsOpen(false)} store={schoolwork} />
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
        <KidToggle
          checked={calm}
          onCheckedChange={setCalm}
          aria-labelledby={`${uid}-calm`}
          aria-describedby={`${uid}-calm-help`}
        />
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
