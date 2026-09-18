import { Link } from 'react-router-dom';
import { LuCheck, LuChevronRight, LuPlay } from 'react-icons/lu';
import { ErrorState, Loader } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { ACCENTS } from '../../../theme';
import { RewardArt } from '../components/rewards/RewardArt';
import { AvatarPicture } from '../components/personalize/AvatarPicture';
import '../components/personalize/makeItYours.css';
import '../components/settings/studentSettings.css';
import { useAvatarChoices } from '../hooks/useAvatarChoices';
import { useRewards } from '../hooks/useRewards';
import { useStudentSettings } from '../hooks/useStudentSettings';

/**
 * Grade 6+ "Make it yours" - the personalization mockup, all of it live:
 *
 *   Colour theme       one of the built-in accent families -> data-accent
 *   Appearance         the same light/dark setting the Settings page has
 *   Avatar             the Avatars master a Super Admin manages
 *   Sticky note style  the paper the Home notes board uses
 *   Your stickers      the rewards this student has actually collected
 *
 * Everything saves as you go, through StudentSettingsProvider (optimistic,
 * rolled back with a message if the save fails). K-5 has its own, simpler
 * version of this page: pages/kid/KidMakeItYoursPage.jsx.
 */

const NOTE_STYLES = [
  { value: 'classic', label: 'Classic' },
  { value: 'folded', label: 'Folded' },
  { value: 'torn', label: 'Torn' },
  { value: 'tag', label: 'Tag' },
];

function Section({ title, hint, className = '', children }) {
  const id = `my-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <section className={`my-section ${className}`.trim()} aria-labelledby={id}>
      <h2 id={id} className="my-section__title">
        {title}
      </h2>
      {hint && <p className="my-section__hint">{hint}</p>}
      {children}
    </section>
  );
}

function Tile({ selected, label, onClick, children }) {
  return (
    <li>
      <button type="button" className="my-tile" aria-pressed={selected} onClick={onClick}>
        {children}
        <span className="my-tile__label">{label}</span>
        {selected && (
          <span className="my-tile__check" aria-hidden="true">
            <LuCheck size={12} strokeWidth={3} />
          </span>
        )}
      </button>
    </li>
  );
}

export default function MakeItYoursPage() {
  const { user } = useAuth();
  const { settings, isLoading, error, update, reload } = useStudentSettings();
  const avatars = useAvatarChoices();
  const rewards = useRewards();

  const save = (patch) =>
    update(patch).catch((err) => {
      toast.error(getErrorMessage(err) || 'Couldn’t save that - please try again.');
    });

  if (isLoading && !settings) return <Loader message="Loading your space…" />;
  if (!settings) return <ErrorState onRetry={reload} description={getErrorMessage(error)} />;

  const accent = settings.accent ?? 'ocean';
  const noteStyle = settings.noteStyle ?? 'classic';
  const isDark = settings.appearance === 'dark';
  const collected = rewards.stickers.filter((s) => s.collected);
  const firstName = settings.preferredName || settings.about?.firstName || user?.firstName || 'friend';

  return (
    <div className="my-page">
      <header className="my-header">
        <h1 className="my-header__title">Make it yours</h1>
        <p className="my-header__summary">Set it up how you like it. Everything saves as you go.</p>
      </header>

      <Section
        title="This is how it looks"
        hint="Your theme, avatar and note style, together. Changes show up here straight away."
        className="my-preview"
      >
        <div className="my-preview__card">
          <span className="my-preview__avatar">
            <AvatarPicture imageUrl={settings.avatar?.imageUrl} size={44}>
              <span>{firstName.charAt(0).toUpperCase()}</span>
            </AvatarPicture>
          </span>
          <span>
            <p className="my-preview__greeting">Good morning, {firstName}</p>
            <span className="my-preview__button">
              <LuPlay size={10} fill="currentColor" aria-hidden="true" /> Start focus
            </span>
          </span>
          <span className="my-preview__note" data-style={noteStyle} aria-hidden="true" />
        </div>
      </Section>

      <Section title="Colour theme" hint="Changes the accent colour across your whole dashboard.">
        <ul className="my-tiles" data-size="lg">
          {ACCENTS.map((option) => (
            <Tile
              key={option.value}
              label={option.label}
              selected={accent === option.value}
              onClick={() => save({ accent: option.value })}
            >
              <span
                className="my-swatch"
                style={{ '--my-swatch': option.swatch, '--my-swatch-soft': option.swatchSoft }}
                aria-hidden="true"
              />
            </Tile>
          ))}
        </ul>
      </Section>

      <Section title="Appearance" hint="Light or dark. Your colour theme works with both.">
        <div className="my-row">
          <span id="my-dark-label" style={{ fontSize: 13.5 }}>
            Dark mode
          </span>
          <button
            type="button"
            role="switch"
            className="ss-switch"
            aria-checked={isDark}
            aria-labelledby="my-dark-label"
            data-testid="my-dark-mode"
            onClick={() => save({ appearance: isDark ? 'light' : 'dark' })}
          />
        </div>
      </Section>

      <Section title="Avatar" hint="Pick how you show up. More arrive as the library grows.">
        {avatars.isLoading ? (
          <p className="my-empty">Loading avatars…</p>
        ) : avatars.items.length === 0 ? (
          <p className="my-empty">No avatars yet - your school hasn’t added any.</p>
        ) : (
          <ul className="my-tiles">
            {avatars.items.map((avatar) => {
              const selected = settings.avatarId === avatar.id;
              return (
                <Tile
                  key={avatar.id}
                  label={avatar.name}
                  selected={selected}
                  // Tapping the chosen one again clears it, back to your photo.
                  onClick={() => save({ avatarId: selected ? null : avatar.id })}
                >
                  <span className="my-avatar-tile">
                    <AvatarPicture imageUrl={avatar.imageUrl} size={46}>
                      <span aria-hidden="true">{avatar.name.charAt(0)}</span>
                    </AvatarPicture>
                  </span>
                </Tile>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Sticky note style" hint="The shape your notes take. Colour is set on each note.">
        <ul className="my-tiles">
          {NOTE_STYLES.map((option) => (
            <Tile
              key={option.value}
              label={option.label}
              selected={noteStyle === option.value}
              onClick={() => save({ noteStyle: option.value })}
            >
              <span className="my-paper" data-style={option.value} aria-hidden="true" />
            </Tile>
          ))}
        </ul>
      </Section>

      <Section title="Your stickers" hint="Only the ones you have unlocked. Earn more on the Rewards page.">
        {rewards.isLoading ? (
          <p className="my-empty">Loading your stickers…</p>
        ) : collected.length === 0 ? (
          <p className="my-empty">No stickers yet. Finish some work to earn your first one.</p>
        ) : (
          <ul className="my-stickers">
            {collected.map((sticker) => (
              <li key={sticker.id} className="my-sticker">
                <RewardArt imageUrl={sticker.imageUrl} size={52} />
                <span>{sticker.name}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/student/rewards" className="my-footlink">
          See all rewards <LuChevronRight size={14} aria-hidden="true" />
        </Link>
      </Section>
    </div>
  );
}
