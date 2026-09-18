import { Link } from 'react-router-dom';
import { LuArrowRight, LuCheck, LuLock, LuPalette } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import { toast } from '../../../../hooks/useToast';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { AvatarPicture } from '../../components/personalize/AvatarPicture';
import { KidButton } from '../../components/kid/KidButton';
import { KidPageHeader } from '../../components/kid/KidPageHeader';
import { KidOops, KidSkeleton } from '../../components/kid/KidStates';
import RewardArt from '../../components/rewards/RewardArt';
import { useAvatarChoices } from '../../hooks/useAvatarChoices';
import { useRewards } from '../../hooks/useRewards';
import { useStudentSettings } from '../../hooks/useStudentSettings';

/**
 * K-5 "Make it yours" - the K-5 personalization mockup: pick a buddy, pick
 * how task cards look, and see the stickers you have collected.
 *
 * Deliberately shorter than the Grade 6+ page (pages/MakeItYoursPage.jsx):
 * no colour theme or dark mode here, since the K-5 shell has its own warm
 * paper theme, and anything a grown-up manages stays with the grown-up -
 * hence the closing line.
 */

const SECTION = 'rounded-[1.75rem] bg-kid-sheet p-5 shadow-paper sm:p-7';
const TILE =
  'relative flex w-full flex-col items-center gap-2 rounded-[1.25rem] border-2 bg-[#fbf7ee] px-2 pb-3 pt-4 text-center transition-transform duration-200 hover:-translate-y-0.5';

const CARD_STYLES = [
  { value: 'taped', label: 'Taped' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'folded', label: 'Folded' },
  { value: 'plain', label: 'Plain' },
];

/** A miniature of a task card, showing what each paper style looks like. */
function CardStylePreview({ style }) {
  return (
    <span className="relative block h-14 w-16 rounded-xl bg-kid-paper shadow-paper" aria-hidden="true">
      {style === 'taped' && (
        <span className="absolute -top-1.5 left-1/2 h-3 w-8 -translate-x-1/2 -rotate-3 rounded-[2px] bg-kid-ink/10" />
      )}
      {style === 'pinned' && <span className="absolute -top-1 left-1/2 size-3 -translate-x-1/2 rounded-full bg-kid-teal" />}
      {style === 'folded' && (
        <span className="absolute bottom-0 right-0 size-5 rounded-br-xl rounded-tl-md border-l border-t border-kid-edge bg-kid-paper-deep" />
      )}
      <span className="absolute left-3 right-3 top-4 h-1.5 rounded-full bg-kid-edge" />
      <span className="absolute left-3 right-6 top-7 h-1.5 rounded-full bg-kid-edge" />
    </span>
  );
}

function Tile({ selected, label, onClick, ariaLabel, children }) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={ariaLabel}
        onClick={onClick}
        className={cn(TILE, selected ? 'border-kid-teal bg-kid-sky/40' : 'border-[#ece4d4]')}
      >
        {children}
        <span className="font-kid-display text-base font-semibold leading-tight text-kid-ink">{label}</span>
        {selected && (
          <span className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-kid-teal text-white">
            <LuCheck className="size-4" strokeWidth={3.5} aria-hidden="true" />
          </span>
        )}
      </button>
    </li>
  );
}

export default function KidMakeItYoursPage() {
  const { settings, isLoading, error, update, reload } = useStudentSettings();
  const avatars = useAvatarChoices();
  const rewards = useRewards();

  const save = (patch) =>
    update(patch).catch((err) => {
      toast.error(getErrorMessage(err) || 'That did not save. Try again!');
    });

  if (isLoading && !settings) return <KidSkeleton className="mx-4 my-6 h-96 sm:mx-8" />;
  if (!settings) return <KidOops className="m-4 sm:m-8" onRetry={reload} message={getErrorMessage(error) || undefined} />;

  const cardStyle = settings.cardStyle ?? 'taped';
  const collected = rewards.stickers.filter((s) => s.collected);

  return (
    <div data-kid-page className="kid-ui mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-8 lg:py-10">
      <KidPageHeader icon={LuPalette} title="Make it yours" subtitle="Make your space look just how you like it." />

      <section aria-labelledby="kid-avatar-heading" className={SECTION}>
        <h2 id="kid-avatar-heading" className="font-kid-display text-2xl font-semibold text-kid-ink">
          My avatar
        </h2>
        <p className="mt-1 text-lg text-kid-ink-soft">Pick a buddy to show on your space.</p>

        {avatars.isLoading ? (
          <p className="mt-5 text-lg text-kid-ink-soft">Getting your buddies…</p>
        ) : avatars.items.length === 0 ? (
          <p className="mt-5 text-lg text-kid-ink-soft">No buddies yet - ask your grown-up.</p>
        ) : (
          <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {avatars.items.map((avatar) => {
              const selected = settings.avatarId === avatar.id;
              return (
                <Tile
                  key={avatar.id}
                  label={avatar.name}
                  selected={selected}
                  ariaLabel={selected ? `${avatar.name}, chosen` : `Choose ${avatar.name}`}
                  onClick={() => save({ avatarId: selected ? null : avatar.id })}
                >
                  <span className="grid size-14 place-items-center overflow-hidden rounded-full bg-white/70">
                    <AvatarPicture imageUrl={avatar.imageUrl} size={56}>
                      <span className="font-kid-display text-xl text-kid-ink">{avatar.name.charAt(0)}</span>
                    </AvatarPicture>
                  </span>
                </Tile>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="kid-cards-heading" className={SECTION}>
        <h2 id="kid-cards-heading" className="font-kid-display text-2xl font-semibold text-kid-ink">
          My card style
        </h2>
        <p className="mt-1 text-lg text-kid-ink-soft">Choose how your task cards look.</p>

        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CARD_STYLES.map((option) => (
            <Tile
              key={option.value}
              label={option.label}
              selected={cardStyle === option.value}
              ariaLabel={cardStyle === option.value ? `${option.label}, chosen` : `Choose ${option.label}`}
              onClick={() => save({ cardStyle: option.value })}
            >
              <CardStylePreview style={option.value} />
            </Tile>
          ))}
        </ul>
      </section>

      <section aria-labelledby="kid-stickers-heading" className={SECTION}>
        <h2 id="kid-stickers-heading" className="font-kid-display text-2xl font-semibold text-kid-ink">
          My stickers
        </h2>
        <p className="mt-1 text-lg text-kid-ink-soft">Stickers you have collected. Earn more stars to get more!</p>

        {rewards.isLoading ? (
          <p className="mt-5 text-lg text-kid-ink-soft">Finding your stickers…</p>
        ) : collected.length === 0 ? (
          <p className="mt-5 flex items-center gap-2 text-lg text-kid-ink-soft">
            <LuLock className="size-5" aria-hidden="true" />
            None yet - finish some work to earn your first sticker.
          </p>
        ) : (
          <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {collected.map((sticker, index) => (
              <li
                key={sticker.id}
                className="flex flex-col items-center gap-1.5 rounded-[1.25rem] border-2 border-[#eadfca] bg-[#fffaf0] px-2 pb-3 pt-4 text-center"
              >
                <RewardArt imageUrl={sticker.imageUrl} size={60} delay={(index % 6) * 0.3} />
                <span className="font-kid-display text-base font-semibold leading-tight text-kid-ink">{sticker.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f3e6] px-2 py-0.5 font-kid-body text-xs font-bold text-[#1f7a3a]">
                  <span className="grid size-3.5 place-items-center rounded-full bg-[#2e9a4e] text-white">
                    <LuCheck className="size-2.5" strokeWidth={4} aria-hidden="true" />
                  </span>
                  Collected
                </span>
              </li>
            ))}
          </ul>
        )}

        <KidButton asChild variant="soft" size="md" className="mt-5">
          <Link to="/student/rewards">
            See all rewards
            <LuArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </KidButton>
      </section>

      <p className="flex items-center justify-center gap-2 rounded-[1.5rem] bg-kid-paper-deep/60 px-5 py-4 text-center text-lg text-kid-ink-soft">
        <LuLock className="size-5 shrink-0" aria-hidden="true" />
        Need to change something else? Ask your grown-up.
      </p>
    </div>
  );
}
