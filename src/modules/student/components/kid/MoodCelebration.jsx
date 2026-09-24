import { useEffect, useMemo, useRef, useState } from 'react';
import { LuArrowRight } from 'react-icons/lu';
import { KidButton } from './KidButton';
import { MoodArt } from './MoodArt';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { celebrationFor } from './moodCelebrationConfig';
import './moodCelebration.css';

/**
 * The moment after a K-5 check-in: the mood they picked, big, with a ring
 * filling around it and a line written for that feeling.
 *
 * What it shows is the mood's own master row (name, emoji or uploaded icon)
 * plus the colour, particles, movement and words from
 * moodCelebrationConfig.js - so a mood an admin adds or renames comes
 * through here without a code
 * change, and an unknown one still gets a calm, sensible reveal.
 *
 * The check-in is already saved by the time this opens (CheckInModal saves on
 * "I'm ready"), but `saveState` is honoured anyway: while a save is still in
 * flight the ring holds at 90%, and if it failed the student is told rather
 * than shown a finished 100%.
 *
 * @param mood       the saved mood code
 * @param moodRow    that mood's master row, when the caller has it
 * @param name       the student's first name
 * @param duration   fill time in ms
 * @param saveState  'saved' | 'pending' | 'failed'
 * @param onRetry    called from the retry button when saveState is 'failed'
 * @param onDone     closes the overlay
 */
const RING_RADIUS = 86;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const HOLD_PERCENT = 90;
const BURST_PARTICLES = 14;
const SOFT_PARTICLES = 8;

/** Sentence case for a name typed in lowercase ("sanjay" -> "Sanjay"). */
const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : '');

export function MoodCelebration({
  mood,
  moodRow = null,
  name,
  duration = 2200,
  saveState = 'saved',
  onRetry,
  onDone,
}) {
  const motionAllowed = useMotionAllowed();
  const celebration = useMemo(() => celebrationFor(mood, moodRow), [mood, moodRow]);

  // With motion off there is nothing to watch, so the finished state is what
  // opens - the ring, the percentage and the words all arrive at once.
  const [percent, setPercent] = useState(motionAllowed ? 0 : 100);
  const frame = useRef(null);
  const startRef = useRef(null);
  const actionsRef = useRef(null);

  const failed = saveState === 'failed';
  const pending = saveState === 'pending';
  const complete = percent >= 100 && !failed;

  useEffect(() => {
    if (!motionAllowed) return undefined;

    const tick = (now) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      // ease-out: fast at first, settling into the finish.
      const eased = 1 - (1 - Math.min(elapsed / duration, 1)) ** 3;
      const target = Math.round(eased * 100);

      // Nothing claims "ready" before the save is in: hold just short of the
      // end until it lands, and stop where it is if it failed.
      const ceiling = pending || failed ? HOLD_PERCENT : 100;
      setPercent(Math.min(target, ceiling));

      if (target < 100 || (pending && !failed)) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [duration, motionAllowed, pending, failed]);

  // The button is what they came for, so it takes focus the moment it exists.
  useEffect(() => {
    if (complete || failed) actionsRef.current?.querySelector('button')?.focus();
  }, [complete, failed]);

  const particles = useMemo(() => {
    if (!motionAllowed) return [];
    const burst = celebration.tone === 'burst';
    const count = burst ? BURST_PARTICLES : SOFT_PARTICLES;

    return Array.from({ length: count }, (_, i) => {
      if (burst) {
        // Evenly around the circle, thrown outward.
        const angle = (i / count) * 2 * Math.PI;
        const distance = 120 + (i % 3) * 18;
        return {
          id: i,
          x: `${Math.cos(angle) * distance}px`,
          y: `${Math.sin(angle) * distance}px`,
          delay: `${i * 35}ms`,
        };
      }
      // Scattered across the card and drifting up.
      return {
        id: i,
        x: `${-90 + (i * 180) / (count - 1)}px`,
        y: '-150px',
        delay: `${i * 420}ms`,
      };
    });
  }, [celebration.tone, motionAllowed]);

  const headline = complete
    ? `${capitalize(name) || 'You'}, you're ${celebration.name.toLowerCase()}`
    : null;

  return (
    <div className="mc-overlay" role="dialog" aria-modal="true" aria-label="Your check-in">
      <div className="mc-card kid-ui" style={{ '--mc-color': celebration.color }}>
        <div className="mc-stage">
          {particles.length > 0 && (
            <div className="mc-particles" aria-hidden="true">
              {particles.map((p) => (
                <span
                  key={p.id}
                  className={`mc-particle mc-particle--${celebration.tone}`}
                  style={{ '--mc-x': p.x, '--mc-y': p.y, '--mc-delay': p.delay }}
                >
                  {celebration.particle}
                </span>
              ))}
            </div>
          )}

          <svg className={`mc-ring${complete ? ' mc-ring--done' : ''}`} viewBox="0 0 190 190" aria-hidden="true">
            <circle className="mc-ring__track" cx="95" cy="95" r={RING_RADIUS} />
            <circle
              className="mc-ring__fill"
              cx="95"
              cy="95"
              r={RING_RADIUS}
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * (1 - percent / 100)}
            />
          </svg>

          {/* The very tile the student just tapped - MoodArt is what the
              picker draws too, so an admin's uploaded icon and background
              colour come through here unchanged. Only a mood we know nothing
              about (no master row) falls back to the config emoji. */}
          <span className={`mc-emoji mc-emoji--${celebration.tone}`} aria-hidden="true">
            {moodRow ? (
              <MoodArt mood={moodRow} className="mc-art" iconClassName="mc-art__icon" />
            ) : (
              celebration.emoji
            )}
          </span>
        </div>

        {failed ? (
          <div className="mc-reveal">
            <p className="mc-error">We couldn&apos;t save your check-in.</p>
            <p className="mc-status">Your answers are still here - try once more.</p>
          </div>
        ) : complete ? (
          <div className="mc-reveal" aria-live="polite">
            <p className="mc-headline">{headline}</p>
            <p className="mc-message">{celebration.message}</p>
          </div>
        ) : (
          <div className="mc-reveal">
            <span className="mc-percent">{percent}%</span>
            <p className="mc-status">Getting your day ready…</p>
          </div>
        )}

        <div className="mc-actions" ref={actionsRef}>
          {failed ? (
            <KidButton size="md" className="w-full" onClick={onRetry}>
              Try again
            </KidButton>
          ) : (
            complete && (
              <KidButton size="md" className="w-full" onClick={onDone}>
                Start my day
                <LuArrowRight className="size-5" aria-hidden="true" />
              </KidButton>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default MoodCelebration;
