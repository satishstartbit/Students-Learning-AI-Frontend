import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuArrowRight, LuCheck, LuX } from 'react-icons/lu';
import { Confetti } from '../../../../components/ui/confetti';
import { cn } from '../../../../lib/utils';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { ENERGY_LEVELS, findMood } from '../../../checkIn/moods';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { MoodArt } from './MoodArt';
import { KidButton } from './KidButton';
import { kidCopyFor } from './kidMoodCopy';
import { MoodCelebration } from './MoodCelebration';

const CONFETTI_COLOURS = ['#f6c445', '#f4b6c1', '#1f7a80', '#7b68d6', '#95c07b'];

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ENERGY_BAR_HEIGHTS = ['h-4', 'h-6', 'h-8', 'h-10', 'h-12'];

const ENERGY_WORDS = { 1: 'a little', 2: 'a little', 3: 'some', 4: 'lots of', 5: 'lots of' };

/**
 * "Let's check in!" - the Home page's check-in flow as a two-panel dialog,
 * matching the student mockup: a mood + energy picker, then a "Great job!"
 * thank-you screen. Opened from CheckInCard's compact trigger card.
 */
export function CheckInModal({ isOpen, onClose, initial, onSave, firstName, moods = [] }) {
  const [step, setStep] = useState('ask');
  const [mood, setMood] = useState(initial?.mood ?? null);
  const [energy, setEnergy] = useState(initial?.energy ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [wasOpen, setWasOpen] = useState(isOpen);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const inFlight = useRef(false);
  const confettiRef = useRef(null);
  const uid = useId();
  const motionAllowed = useMotionAllowed();

  // Reset the form each time the dialog opens (an "adjust state while
  // rendering" correction, not an effect - it must run before this paint).
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setStep('ask');
      setMood(initial?.mood ?? null);
      setEnergy(initial?.energy ?? null);
      setError(null);
    }
  }

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    triggerRef.current = document.activeElement;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      const target = dialogRef.current?.querySelector(FOCUSABLE) ?? dialogRef.current;
      target?.focus();
    }, 0);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = overflow;
      triggerRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Portal into .kid-theme (not document.body) so the dialog keeps the
  // --kid-* tokens it's styled with - and so it escapes BlurFade's
  // transform/filter, which would otherwise trap a fixed-position child.
  const container = document.querySelector('.kid-theme') ?? document.body;

  const ready = Boolean(mood && energy);
  const currentMood = findMood(moods, mood);

  const submit = async () => {
    if (!ready || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await onSave({ mood, energy });
      setStep('thanks');
      if (result?.created && motionAllowed) {
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
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  // The reveal replaces the dialog rather than sitting on top of it, so the
  // mood has the screen to itself.
  if (step === 'celebrate') {
    return createPortal(
      <MoodCelebration mood={mood} moodRow={currentMood} name={firstName} onDone={onClose} />,
      container
    );
  }

  // The backdrop scrolls and the card centres with `m-auto`: on a short phone
  // (the two halves stack) the whole card - and "I'm ready" - stays reachable
  // instead of being cut off top and bottom.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-kid-ink/45 p-3 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <Confetti
        ref={confettiRef}
        manualstart
        globalOptions={{ resize: true, useWorker: false }}
        className="pointer-events-none absolute inset-0 z-20 size-full"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        className="relative z-10 m-auto grid w-full max-w-2xl overflow-hidden rounded-[2rem] shadow-2xl outline-none sm:grid-cols-2"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-kid-ink/10 text-kid-ink-soft hover:bg-kid-ink/20"
        >
          <LuX className="size-5" aria-hidden="true" />
        </button>

        {step === 'ask' ? (
          <>
            <div className="flex flex-col gap-5 bg-[#faf1da] px-6 py-9 sm:py-10">
              <div>
                <h2 id={`${uid}-title`} className="font-kid-hand text-[2rem] leading-none text-kid-ink">
                  Let&apos;s check in!
                </h2>
                <p className="mt-2 font-kid-body text-base text-kid-ink-soft">How are you feeling right now?</p>
              </div>

              <fieldset>
                <legend className="sr-only">How are you feeling?</legend>
                <div className="grid grid-cols-3 gap-2.5">
                  {moods.map((m) => {
                    const checked = mood === m.code;
                    return (
                      <label
                        key={m.code}
                        className="group relative isolate flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl p-1.5"
                      >
                        <input
                          type="radio"
                          name={`${uid}-mood`}
                          value={m.code}
                          checked={checked}
                          onChange={() => setMood(m.code)}
                          className="peer sr-only"
                        />
                        {/* One renderer for the tile, shared with the reveal
                            that follows (MoodArt), so what a student taps is
                            exactly what they then see. */}
                        <MoodArt
                          mood={m}
                          className="size-12 ring-[3px] ring-transparent transition-transform duration-150 group-hover:scale-105 peer-checked:scale-105 peer-checked:ring-kid-teal peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-kid-teal peer-focus-visible:outline-solid"
                        />
                        {checked && (
                          <span
                            aria-hidden="true"
                            className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-kid-teal text-white"
                          >
                            <LuCheck strokeWidth={3.5} className="size-3" />
                          </span>
                        )}
                        <span className="font-kid-display text-[0.8rem] text-kid-ink-soft peer-checked:font-semibold peer-checked:text-kid-ink">
                          {kidCopyFor(m).kidLabel}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <div className="flex flex-col gap-5 bg-kid-sheet px-6 py-9 sm:py-10">
              <div>
                <h3 className="font-kid-display text-xl font-semibold text-kid-ink">How much energy do you have?</h3>
                <p className="mt-1 font-kid-body text-base text-kid-ink-soft">Tap the one that feels like you.</p>
              </div>

              <fieldset className="flex flex-1 flex-col items-center justify-center">
                <legend className="sr-only">Energy level</legend>
                <div className="flex items-end justify-center gap-2.5">
                  {ENERGY_LEVELS.map((level, i) => (
                    <label key={level} className="relative flex cursor-pointer flex-col items-center">
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
                          'w-3.5 rounded-full transition-colors duration-150 peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-kid-teal peer-focus-visible:outline-solid',
                          ENERGY_BAR_HEIGHTS[i],
                          energy && level <= energy ? 'bg-kid-teal-deep' : 'bg-kid-paper-deep'
                        )}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex w-full max-w-[11rem] justify-between font-kid-body text-sm text-kid-ink-soft">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </fieldset>

              {error && (
                <p role="alert" className="rounded-2xl bg-kid-coral-soft px-3 py-2 text-center font-kid-body text-kid-coral">
                  {error}
                </p>
              )}

              <KidButton size="md" className="w-full" onClick={submit} disabled={!ready || busy}>
                {busy ? 'Saving…' : "I'm ready"}
                <LuArrowRight className="size-5" aria-hidden="true" />
              </KidButton>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col justify-center gap-2 bg-[#e7f1de] px-6 py-9 sm:py-10">
              <h2 id={`${uid}-title`} className="font-kid-hand text-[2rem] leading-none text-kid-ink">
                Great job!
              </h2>
              <p className="font-kid-body text-base text-kid-ink-soft">Thanks for checking in.</p>
            </div>

            <div className="flex flex-col gap-5 bg-kid-sheet px-6 py-9 sm:py-10">
              <div>
                <h3 className="font-kid-display text-xl font-semibold text-kid-ink">
                  Thanks{firstName ? `, ${firstName}` : ''}!
                </h3>
                <p className="mt-1 font-kid-body text-base text-kid-ink-soft">
                  You are feeling {(currentMood?.name ?? '').toLowerCase()} and you have{' '}
                  {ENERGY_WORDS[energy] ?? 'some'} energy. Let&apos;s have a great day!
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl bg-kid-paper px-4 py-3">
                <div className="flex items-center justify-between font-kid-body text-base">
                  <span className="text-kid-ink-soft">Feeling</span>
                  <span className="font-semibold text-kid-ink">{currentMood?.name}</span>
                </div>
                <div className="h-px bg-kid-edge" />
                <div className="flex items-center justify-between font-kid-body text-base">
                  <span className="text-kid-ink-soft">Energy</span>
                  <span className="font-semibold text-kid-ink">
                    {energy} of {ENERGY_LEVELS.length}
                  </span>
                </div>
              </div>

              {/* The check-in is already saved (submit, on "I'm ready"), so
                  this hands over to the mood reveal rather than closing. */}
              <KidButton size="md" className="mt-auto w-full" onClick={() => setStep('celebrate')}>
                Let&apos;s go
                <LuArrowRight className="size-5" aria-hidden="true" />
              </KidButton>
            </div>
          </>
        )}
      </div>
    </div>,
    container
  );
}

export default CheckInModal;
