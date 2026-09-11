import { useId, useRef, useState } from 'react';
import { Confetti } from '../../../../components/ui/confetti';
import { cn } from '../../../../lib/utils';
import { useAuth } from '../../../../hooks/useAuth';
import { useDailyCheckIn } from '../../hooks/useDailyCheckIn';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { MoodFace } from './MoodFace';
import { ENERGY_LEVELS, MOODS, findMood } from './moods';
import { PaperCard, Tape } from './PaperKit';

const CONFETTI_COLOURS = ['#f6c445', '#f4b6c1', '#1f7a80', '#7b68d6', '#95c07b'];

/**
 * "Today's check-in": how are you feeling, and how much energy do you have?
 *
 * Both pickers are real radio groups (visually hidden native inputs), so
 * arrow keys, screen readers and switch access all work without custom
 * keyboard code. Picking a feeling for the first time today gets a small
 * burst of Magic UI confetti - never in calm mode or with reduced motion.
 */
export function CheckInCard() {
  const { user } = useAuth();
  const { mood, energy, update } = useDailyCheckIn(user?.id);
  const [changingMood, setChangingMood] = useState(false);
  const motionAllowed = useMotionAllowed();
  const confettiRef = useRef(null);
  const uid = useId();

  const current = findMood(mood);
  // Compact summary once a mood is picked - the full picker only reopens on
  // request (the pencil button), rather than always taking the big card.
  const compact = current && !changingMood;

  const pickMood = (value) => {
    const isFirstAnswer = !mood;
    update({ mood: value });
    setChangingMood(false);

    if (isFirstAnswer && motionAllowed) {
      confettiRef.current?.fire({
        particleCount: 70,
        spread: 80,
        startVelocity: 26,
        scalar: 0.9,
        origin: { y: 0.45 },
        colors: CONFETTI_COLOURS,
        disableForReducedMotion: true,
      });
    }
  };

  if (compact) {
    return (
      <PaperCard as="section" aria-labelledby={`${uid}-title`} tone="sheet" className="px-5 py-5">
        <div className="flex items-center gap-3">
          <MoodFace mood={current.value} className="size-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <p id={`${uid}-title`} className="font-kid-body text-sm text-kid-ink-soft">
              Check-in
            </p>
            <p aria-live="polite" className="font-kid-display text-lg font-semibold text-kid-ink">
              {current.feeling}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setChangingMood(true)}
            aria-label="Change how you're feeling"
            className="grid size-11 shrink-0 place-items-center rounded-full text-lg hover:bg-kid-paper-deep/70"
          >
            <span aria-hidden="true">✏️</span>
          </button>
        </div>
      </PaperCard>
    );
  }

  return (
    <PaperCard as="section" aria-labelledby={`${uid}-title`} tone="green" className="px-4 pb-5 pt-7">
      <Tape tone="yellow" className="-top-3 right-8 rotate-6" />
      <Confetti
        ref={confettiRef}
        manualstart
        globalOptions={{ resize: true, useWorker: false }}
        className="pointer-events-none absolute inset-0 z-20 size-full"
      />

      <h2 id={`${uid}-title`} className="text-center font-kid-hand text-[1.85rem] leading-none text-kid-ink">
        Today&apos;s check-in
      </h2>

      <div className="mt-4 rounded-[1.5rem] bg-kid-sheet/90 px-2 pb-4 pt-4">
        {/* This whole big card only renders while showMoodPicker is true (see
            the `compact` early return above), so the picker always shows here -
            no need to branch on it again. */}
        <fieldset>
          <legend className="w-full text-center font-kid-display text-xl font-medium text-kid-ink">
            How are you feeling?
          </legend>
          {/* One row of five, even in the narrow side column. */}
          <div className="mt-3 grid grid-cols-5 gap-0.5">
            {MOODS.map((m) => (
              <label
                key={m.value}
                className="group relative isolate flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-2xl px-0.5 py-1.5"
              >
                <input
                  type="radio"
                  name={`${uid}-mood`}
                  value={m.value}
                  checked={mood === m.value}
                  onChange={() => pickMood(m.value)}
                  className="peer sr-only"
                />
                <MoodFace
                  mood={m.value}
                  className="size-10 transition-transform duration-150 group-hover:scale-110 peer-checked:scale-110"
                />
                <span className="font-kid-display text-[0.8rem] text-kid-ink-soft peer-checked:font-semibold peer-checked:text-kid-ink">
                  {m.label}
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl peer-checked:bg-kid-green/60 peer-checked:ring-[3px] peer-checked:ring-kid-green-deep peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-kid-teal peer-focus-visible:outline-solid -z-10"
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
                  onChange={() => update({ energy: level })}
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
      </div>
    </PaperCard>
  );
}

export default CheckInCard;
