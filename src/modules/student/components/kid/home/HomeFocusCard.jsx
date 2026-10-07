import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuArrowRight, LuPlay, LuTarget } from 'react-icons/lu';
import { cn } from '../../../../../lib/utils';
import { formatClock, useFocusTimer } from '../../../hooks/useFocusTimer';
import { KidButton } from '../KidButton';
import { KidSkeleton } from '../KidStates';
import { HomeSticker, HomeTape } from './HomeBits';

/** The short lengths the Home offers (the mockup); the Focus page keeps its own calm 25. */
const LENGTHS = [5, 10, 15];
const DEFAULT_MINUTES = 10;

const RING_RADIUS = 44;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * "Focus time" on the K-5 Home, from the mockup: a clock ring, "How long do
 * you want to focus?" (5 / 10 / 15 min) and Start focus. Starting opens a
 * real focus session (the same API the Focus page uses), tied to the next
 * task like the Focus page's "Up next", then takes the student to the Focus
 * page, where the running clock and its Pause / All done controls live.
 *
 * If a clock is already running (or paused) it shows the time left and
 * "Go to my timer" instead. The ring breathes while it waits (not in calm mode).
 */
export function HomeFocusCard({ assignmentId }) {
  const timer = useFocusTimer();
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);

  const { session } = timer;
  const isPaused = session?.status === 'paused';
  const isActive = session?.status === 'in_progress' || isPaused;
  const plannedSeconds = (isActive ? session.plannedMinutes ?? minutes : minutes) * 60;
  const remaining = isActive ? Math.max(plannedSeconds - timer.elapsedSeconds, 0) : plannedSeconds;
  const progress = isActive && plannedSeconds ? Math.min(timer.elapsedSeconds / plannedSeconds, 1) : 0;

  const start = () =>
    timer
      .start({ plannedMinutes: minutes, assignmentId: assignmentId || undefined })
      .then(() => navigate('/student/focus'))
      .catch(() => {});

  return (
    <section
      aria-labelledby="kid-focus-title"
      className="relative rounded-[1.6rem] border border-kid-edge/60 bg-kid-sheet px-5 pb-6 pt-10 shadow-paper sm:px-8"
    >
      <HomeTape as="h2" id="kid-focus-title" tone="sky" className="-top-3.5 left-7 -rotate-1 text-base">
        <LuTarget className="size-4" aria-hidden="true" />
        Focus time
      </HomeTape>
      <HomeSticker slug="star" tilt={14} delay={0.3} className="-right-1 -top-4 size-10 sm:-right-2 sm:size-11" />

      {timer.isLoading ? (
        <div className="flex items-center gap-6" role="status" aria-label="Loading your focus clock">
          <KidSkeleton className="size-28 shrink-0 rounded-full" />
          <KidSkeleton className="h-16 flex-1" />
        </div>
      ) : (
        <div className="grid items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-8 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="mx-auto flex flex-col items-center gap-1.5 sm:mx-0">
            <div className={cn('relative grid size-28 place-items-center lg:size-32', !isActive && 'kh-breathe')}>
              <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 size-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="7"
                  style={{ stroke: 'color-mix(in srgb, var(--kid-teal) 18%, var(--kid-sheet))' }}
                />
                {progress > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={RING_LENGTH}
                    strokeDashoffset={RING_LENGTH * (1 - progress)}
                    style={{ stroke: 'var(--kid-teal)' }}
                    className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                  />
                )}
              </svg>
              <span className="relative font-kid-display text-3xl font-bold tabular-nums text-kid-ink lg:text-[2.1rem]">
                {formatClock(remaining)}
              </span>
            </div>
            <span className="font-kid-body text-sm text-kid-ink-soft">{isActive ? (isPaused ? 'Paused' : 'Focusing') : 'Ready'}</span>
          </div>

          {isActive ? (
            <p className="text-center font-kid-display text-lg text-kid-ink sm:text-left">
              {isPaused ? 'Your focus clock is paused. Pick it up when you are ready.' : 'Your focus clock is going. You have got this!'}
            </p>
          ) : (
            <fieldset className="min-w-0">
              <legend className="w-full text-center font-kid-display text-lg font-medium text-kid-ink sm:text-left">
                How long do you want to focus?
              </legend>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {LENGTHS.map((m) => (
                  <label key={m} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="kid-home-focus-length"
                      value={m}
                      checked={minutes === m}
                      onChange={() => setMinutes(m)}
                      className="peer sr-only"
                    />
                    <span className="inline-flex min-h-11 items-center rounded-full border-2 border-kid-edge bg-kid-sheet px-4 font-kid-display text-base font-semibold text-kid-ink-soft transition-[transform,background-color,border-color] duration-150 hover:-translate-y-0.5 hover:border-kid-teal/60 peer-checked:border-kid-teal peer-checked:bg-kid-sky peer-checked:text-kid-ink peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-kid-teal peer-focus-visible:outline-solid">
                      {m} min
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="flex justify-center sm:col-span-2 lg:col-span-1 lg:justify-end">
            {isActive ? (
              <KidButton asChild size="md" className="group w-full rounded-2xl px-7 sm:w-auto">
                <Link to="/student/focus">
                  Go to my timer
                  <LuArrowRight className="kh-nudge size-5" aria-hidden="true" />
                </Link>
              </KidButton>
            ) : (
              <KidButton size="md" className="w-full rounded-2xl px-7 sm:w-auto" onClick={start} disabled={timer.isBusy}>
                <LuPlay className="size-5" aria-hidden="true" />
                {timer.isBusy ? 'Starting…' : 'Start focus'}
              </KidButton>
            )}
          </div>

          {timer.error && (
            <p role="alert" className="rounded-2xl bg-kid-coral-soft px-4 py-3 text-center font-kid-body text-kid-coral sm:col-span-2 lg:col-span-3">
              {timer.error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default HomeFocusCard;
