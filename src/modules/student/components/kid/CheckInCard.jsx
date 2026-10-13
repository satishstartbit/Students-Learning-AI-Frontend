import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuArrowRight, LuPencil, LuSmilePlus } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { useAuth } from '../../../../hooks/useAuth';
import { useModal } from '../../../../hooks/useModal';
import { useTodayCheckIn } from '../../../checkIn/hooks/useTodayCheckIn';
import { ENERGY_LEVELS, findMood, usesLegacyArt } from '../../../checkIn/moods';
import { AdminMoodTile } from './AdminMoodTile';
import { CheckInModal } from './CheckInModal';
import { KidButton } from './KidButton';
import { kidCopyFor } from './kidMoodCopy';
import { MoodCelebration } from './MoodCelebration';
import { MoodFace } from './MoodFace';
import { PaperCard, Tape } from './PaperKit';
import './home/kidHome.css';

/**
 * "Today's check-in" for K-4: how are you feeling, and how much energy do
 * you have? Saved to the real /check-ins API through TodayCheckInProvider,
 * so the Home page, the Check In page and the work-screen gate agree.
 *
 * `variant="modal"` (the Home page) shows a compact trigger card that opens
 * <CheckInModal>, the "Let's check in!" dialog from the student mockup.
 * `variant="inline"` (the default, the /student/check-in gate page) shows
 * the picker directly on the page - there's no dialog to open when the
 * whole page already is the check-in.
 *
 * Both pickers are real radio groups (visually hidden native inputs), so
 * arrow keys, screen readers and switch access work without custom keyboard
 * code. After a save, the mood reveal (MoodCelebration) takes over - it
 * respects calm mode and reduced motion itself.
 */
export function CheckInCard({ onSaved, variant = 'inline' }) {
  const { checkIn, isLoading, save, moods, moodsLoading } = useTodayCheckIn();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  // The mood code to celebrate, once a save on this page has landed.
  const [celebrating, setCelebrating] = useState(null);
  const uid = useId();
  const modal = useModal();

  const current = findMood(moods, checkIn?.mood);

  if (isLoading || moodsLoading) {
    return <PaperCard tone="sheet" aria-busy="true" className="h-64 animate-pulse" />;
  }

  const handleInlineSave = async (values) => {
    const result = await save(values);
    setEditing(false);
    onSaved?.(result);
    // The mood reveal takes it from here - it has its own particles, so the
    // confetti burst would only fire behind it. The dialog path reaches the
    // same overlay from its "Let's go" button.
    setCelebrating(values.mood);
  };

  const handleModalSave = async (values) => {
    const result = await save(values);
    onSaved?.(result);
    return result;
  };

  if (variant === 'modal') {
    return (
      <>
        {current ? (
          <CompactCheckIn mood={current} onChange={modal.open} />
        ) : (
          <CheckInInvite onOpen={modal.open} />
        )}
        <CheckInModal
          isOpen={modal.isOpen}
          onClose={modal.close}
          initial={checkIn}
          onSave={handleModalSave}
          firstName={user?.firstName}
          moods={moods}
        />
      </>
    );
  }

  /*
   * The reveal after an inline save - the /student/check-in page has no
   * dialog and no "Let's go" button, so without this it is the one way into
   * a check-in (including changing one) that never showed the mood.
   *
   * Portalled into .kid-theme, like the dialog, so it keeps the --kid-*
   * tokens and escapes any transformed ancestor.
   */
  const celebration =
    celebrating &&
    createPortal(
      <MoodCelebration
        mood={celebrating}
        moodRow={findMood(moods, celebrating)}
        name={user?.firstName}
        onDone={() => setCelebrating(null)}
      />,
      document.querySelector('.kid-theme') ?? document.body
    );

  if (current && !editing) {
    return (
      <div className="relative">
        <CompactCheckIn mood={current} onChange={() => setEditing(true)} />
        {celebration}
      </div>
    );
  }

  return (
    <div className="relative">
      {celebration}
      <PaperCard as="section" aria-labelledby={`${uid}-title`} tone="green" className="px-4 pb-5 pt-7">
        <Tape tone="yellow" className="-top-3 right-8 rotate-6" />

        <h2 id={`${uid}-title`} className="text-center font-kid-hand text-[1.85rem] leading-none text-kid-ink">
          Today&apos;s check-in
        </h2>

        <CheckInPickers
          key={checkIn?.updatedAt ?? 'new'}
          uid={uid}
          moods={moods}
          initial={checkIn}
          onSave={handleInlineSave}
          onCancel={checkIn ? () => setEditing(false) : undefined}
        />
      </PaperCard>
    </div>
  );
}

/* The two compact cards below share the Home's rail-card look (a soft-edged
   sheet that lifts on hover) - the "Good morning, Alex!" mockup. */
const COMPACT_CARD =
  'group flex w-full items-center gap-3 rounded-[1.4rem] border border-kid-edge/60 px-4 py-4 text-left transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-paper-lg';

function CheckInInvite({ onOpen }) {
  return (
    <PaperCard as="button" type="button" onClick={onOpen} tone="sheet" className={COMPACT_CARD}>
      <span aria-hidden="true" className="kh-pulse grid size-11 shrink-0 place-items-center rounded-full bg-kid-yellow">
        <LuSmilePlus className="size-6 text-[#6b4f05]" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-kid-body text-sm text-kid-ink-soft">Check-in</p>
        <p className="font-kid-display text-lg font-semibold text-kid-ink">Let&apos;s check in!</p>
      </div>
      <LuArrowRight className="kh-nudge size-5 shrink-0 text-kid-ink-soft" aria-hidden="true" />
    </PaperCard>
  );
}

function CompactCheckIn({ mood, onChange }) {
  const { kidFeeling } = kidCopyFor(mood);
  return (
    <PaperCard
      as="button"
      type="button"
      onClick={onChange}
      aria-label={`Change how you're feeling. Currently: ${kidFeeling}.`}
      tone="sheet"
      className={COMPACT_CARD}
    >
      <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-kid-green">
        {usesLegacyArt(mood) ? (
          <MoodFace mood={mood.code} className="size-8 transition-transform duration-200 group-hover:scale-110" />
        ) : (
          <AdminMoodTile mood={mood} className="size-8 transition-transform duration-200 group-hover:scale-110" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-kid-body text-sm text-kid-ink-soft">Check-in</p>
        <p aria-live="polite" className="font-kid-display text-lg font-semibold text-kid-ink">
          {kidFeeling}
        </p>
      </div>
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-full text-kid-ink-soft transition-colors group-hover:bg-kid-paper-deep group-hover:text-kid-ink"
      >
        <LuPencil className="size-4.5" />
      </span>
    </PaperCard>
  );
}

function CheckInPickers({ uid, moods, initial, onSave, onCancel }) {
  const [mood, setMood] = useState(initial?.mood ?? null);
  const [energy, setEnergy] = useState(initial?.energy ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const ready = Boolean(mood && energy);

  const submit = async () => {
    if (!ready || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await onSave({ mood, energy });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-[1.5rem] bg-kid-sheet/90 px-2 pb-4 pt-4">
      <fieldset>
        <legend className="w-full text-center font-kid-display text-xl font-medium text-kid-ink">
          How are you feeling?
        </legend>
        <div className="mt-3 grid grid-cols-3 gap-1">
          {moods.map((m) => (
            <label
              key={m.code}
              className="group relative isolate flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-2xl px-0.5 py-1.5"
            >
              <input
                type="radio"
                name={`${uid}-mood`}
                value={m.code}
                checked={mood === m.code}
                onChange={() => setMood(m.code)}
                className="peer sr-only"
              />
              {usesLegacyArt(m) ? (
                <MoodFace
                  mood={m.code}
                  className="size-10 transition-transform duration-150 group-hover:scale-110 peer-checked:scale-110"
                />
              ) : (
                <AdminMoodTile
                  mood={m}
                  className="size-10 transition-transform duration-150 group-hover:scale-110 peer-checked:scale-110"
                />
              )}
              <span className="font-kid-display text-[0.8rem] text-kid-ink-soft peer-checked:font-semibold peer-checked:text-kid-ink">
                {kidCopyFor(m).kidLabel}
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 rounded-2xl peer-checked:bg-kid-green/60 peer-checked:ring-[3px] peer-checked:ring-kid-green-deep peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-kid-teal peer-focus-visible:outline-solid"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="sr-only">Energy level</legend>
        <div className="flex justify-center">
          {ENERGY_LEVELS.map((level) => (
            <label key={level} className="relative grid size-11 cursor-pointer place-items-center">
              <input
                type="radio"
                name={`${uid}-energy`}
                value={level}
                checked={energy === level}
                onChange={() => setEnergy(level)}
                className="peer sr-only"
                aria-label={`${level} out of ${ENERGY_LEVELS.length}`}
              />
              <span
                aria-hidden="true"
                className={cn(
                  'size-8 rounded-full border-[3px] transition-colors duration-150 peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-kid-teal peer-focus-visible:outline-solid',
                  energy && level <= energy
                    ? 'border-kid-green-deep bg-kid-green-deep'
                    : 'border-kid-green-deep/60 bg-kid-sheet'
                )}
              />
            </label>
          ))}
        </div>
        <p aria-hidden="true" className="mt-0.5 text-center font-kid-display text-base text-kid-ink-soft">
          Energy level
        </p>
      </fieldset>

      {error && (
        <p role="alert" className="mx-2 mt-3 rounded-2xl bg-kid-coral-soft px-3 py-2 text-center font-kid-body text-kid-coral">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col items-center gap-2 px-2">
        <KidButton size="md" className="w-full" onClick={submit} disabled={!ready || busy}>
          {busy ? 'Saving…' : 'Done!'}
        </KidButton>
        {!ready && (
          <p className="text-center font-kid-body text-sm text-kid-ink-soft">Pick a feeling and your energy.</p>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-full px-4 font-kid-display text-base text-kid-ink-soft underline decoration-dotted hover:text-kid-ink"
          >
            Keep my old answer
          </button>
        )}
      </div>
    </div>
  );
}

export default CheckInCard;
