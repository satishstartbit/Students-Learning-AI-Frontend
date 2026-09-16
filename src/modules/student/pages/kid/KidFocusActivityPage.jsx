import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { LuChevronLeft, LuClock, LuMusic2, LuPause, LuPlay } from 'react-icons/lu';
import { Confetti } from '../../../../components/ui/confetti';
import { cn } from '../../../../lib/utils';
import { useMotionAllowed } from '../../hooks/useKidPreferences';
import { formatClock } from '../../hooks/useFocusTimer';
import { KidButton } from '../../components/kid/KidButton';
import { activitySeconds, getFocusActivity } from '../../components/kid/focusActivities';

const TONE_BG = { sky: 'bg-kid-sky', green: 'bg-kid-green', pink: 'bg-kid-pink' };
// Matches KidFocusPage.jsx / CheckInCard.jsx's own copy of this palette - kept
// local rather than shared, following this codebase's existing convention.
const CONFETTI_COLOURS = ['#f6c445', '#f4b6c1', '#1f7a80', '#7b68d6', '#95c07b'];

function StepsList({ steps }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <li key={step} className="flex items-start gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-kid-teal font-kid-display text-sm font-semibold text-white">
            {i + 1}
          </span>
          <span className="text-lg text-kid-ink">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function TimeChip({ seconds }) {
  return (
    <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-kid-paper-deep px-3 py-1 font-kid-display text-sm font-medium text-kid-ink-soft">
      <LuClock className="size-4" aria-hidden="true" />
      {formatClock(seconds)} left
    </span>
  );
}

/** The breathing circle: a pale ring that grows on the in-breath and shrinks on the out-breath, around a fixed label. */
function BreathePanel({ activity, elapsedSeconds, motionAllowed }) {
  const cycleLength = activity.phases.reduce((total, p) => total + p.seconds, 0);
  const total = activitySeconds(activity);
  const clamped = Math.min(elapsedSeconds, total - 1);
  const breathIndex = Math.min(Math.floor(clamped / cycleLength), activity.breaths - 1);

  let withinCycle = clamped % cycleLength;
  let phase = activity.phases[0];
  let phaseElapsed = withinCycle;
  for (const p of activity.phases) {
    if (withinCycle < p.seconds) {
      phase = p;
      phaseElapsed = withinCycle;
      break;
    }
    withinCycle -= p.seconds;
  }
  const count = Math.min(phaseElapsed + 1, phase.seconds);
  const expanded = phase.key === 'in';

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 sm:px-10">
      <div className="relative grid size-48 place-items-center">
        <div
          aria-hidden="true"
          className={cn('absolute rounded-full bg-white/60 transition-transform ease-in-out', expanded ? 'scale-100' : 'scale-[0.6]')}
          style={{ width: 192, height: 192, transitionDuration: motionAllowed ? `${phase.seconds}s` : '0s' }}
        />
        <div className="relative grid size-32 place-items-center rounded-full border-2 border-kid-teal bg-white text-center shadow-paper">
          <span className="font-kid-display text-lg font-semibold text-kid-ink">{phase.label}</span>
          <span className="mt-1 font-kid-body text-sm text-kid-ink-soft">
            {Array.from({ length: count }, (_, i) => i + 1).join(' · ')}
          </span>
        </div>
      </div>
      <p className="font-kid-body text-kid-ink-soft">
        Breath {breathIndex + 1} of {activity.breaths}
      </p>
    </div>
  );
}

function WigglePanel({ activity, moveIndex }) {
  const move = activity.moves[moveIndex];
  const Icon = move.icon;

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 sm:px-10">
      <span aria-hidden="true" className="grid size-28 place-items-center rounded-full bg-white/80 shadow-paper">
        <Icon className="size-14 text-kid-ink" />
      </span>
      <div className="text-center">
        <p className="font-kid-display text-xl font-semibold text-kid-ink">{move.name}</p>
        <p className="font-kid-body text-kid-ink-soft">{move.count}</p>
      </div>
      <div className="flex items-center gap-2" aria-hidden="true">
        {activity.moves.map((m, i) => (
          <span key={m.name} className={cn('size-2.5 rounded-full', i <= moveIndex ? 'bg-kid-green-deep' : 'bg-white/70')} />
        ))}
      </div>
      <p className="font-kid-body text-kid-ink-soft">
        Move {moveIndex + 1} of {activity.moves.length}
      </p>
    </div>
  );
}

function ListenPanel({ activity, soundIndex, audioRef, playing, onToggle, onTimeUpdate, progress }) {
  const sound = activity.sounds[soundIndex];

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 sm:px-10">
      <audio ref={audioRef} src={sound.src} onTimeUpdate={onTimeUpdate} />
      <span aria-hidden="true" className="grid size-28 place-items-center rounded-full bg-white/80 shadow-paper">
        <LuMusic2 className="size-14 text-kid-ink" />
      </span>
      <p className="font-kid-display text-xl font-semibold text-kid-ink">{sound.name}</p>
      <div className="h-2 w-48 overflow-hidden rounded-full bg-white/70">
        <div className="h-full rounded-full bg-kid-teal transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <KidButton type="button" variant="soft" size="md" onClick={onToggle}>
        {playing ? <LuPause className="size-5" aria-hidden="true" /> : <LuPlay className="size-5" aria-hidden="true" />}
        {playing ? 'Pause sound' : 'Play sound'}
      </KidButton>
    </div>
  );
}

/**
 * A single guided calming exercise, opened from a Focus tile
 * (KidFocusPage.jsx / focusActivities.js). One route, three flavours:
 * breathe (animated ring), wiggle (a sequence of timed moves), listen (an
 * audio track with a pick-another-sound option) - the choreography is local
 * content (see focusActivities.js for why), so nothing here calls the API.
 *
 * "I feel better" always ends the exercise early and returns to Focus time.
 * The secondary action differs per activity: Stop (quit), Skip this move
 * (advance without ending), Pick another sound (swap the track in place).
 */
export default function KidFocusActivityPage() {
  const { activityKey } = useParams();
  const activity = getFocusActivity(activityKey);

  if (!activity) return <Navigate to="/student/focus" replace />;

  // `key` forces a full remount (fresh state) whenever the student opens a
  // different activity, instead of an effect resetting state by hand.
  return <ActivityRunner key={activityKey} activity={activity} />;
}

function ActivityRunner({ activity }) {
  const navigate = useNavigate();
  const motionAllowed = useMotionAllowed();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [endedEarly, setEndedEarly] = useState(false);
  const [soundIndex, setSoundIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef(null);
  const confettiRef = useRef(null);

  const totalSeconds = activitySeconds(activity);
  // Either the countdown ran out on its own, or the student skipped past the last move.
  const finished = endedEarly || elapsedSeconds >= totalSeconds;

  const moveOffsets = useMemo(() => {
    if (activity.key !== 'wiggle') return [];
    let acc = 0;
    return activity.moves.map((m) => {
      const start = acc;
      acc += m.seconds;
      return start;
    });
  }, [activity]);

  const currentMoveIndex = useMemo(() => {
    if (activity.key !== 'wiggle') return 0;
    const clamped = Math.min(elapsedSeconds, totalSeconds - 1);
    let idx = 0;
    for (let i = 0; i < moveOffsets.length; i += 1) {
      if (clamped >= moveOffsets[i]) idx = i;
    }
    return idx;
  }, [activity, elapsedSeconds, totalSeconds, moveOffsets]);

  useEffect(() => {
    if (finished) return undefined;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [finished]);

  // The same celebration as the Focus timer's own "All done!" button.
  useEffect(() => {
    if (!finished) return undefined;
    if (motionAllowed) {
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
    const t = setTimeout(() => navigate('/student/focus'), 1600);
    return () => clearTimeout(t);
  }, [finished, navigate, motionAllowed]);

  // A fresh sound (Pick another sound, or the very first render) starts playing on its own.
  useEffect(() => {
    if (activity.key !== 'listen') return undefined;
    const audio = audioRef.current;
    if (!audio) return undefined;
    audio.currentTime = 0;
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
    return undefined;
  }, [activity, soundIndex]);

  useEffect(() => () => audioRef.current?.pause(), []);

  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);

  // Same shape as the Focus timer's "All done!" - celebrate, then return to Focus.
  const handleFeelBetter = () => setEndedEarly(true);

  const handleSecondary = () => {
    if (activity.key === 'breathe') {
      navigate('/student/focus');
    } else if (activity.key === 'wiggle') {
      const nextStart = moveOffsets[currentMoveIndex + 1];
      if (nextStart == null) setEndedEarly(true);
      else setElapsedSeconds(nextStart);
    } else if (activity.key === 'listen') {
      setSoundIndex((i) => (i + 1) % activity.sounds.length);
    }
  };

  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const handleAudioTimeUpdate = (e) => {
    const a = e.currentTarget;
    setAudioProgress(a.duration ? a.currentTime / a.duration : 0);
  };

  return (
    <div data-kid-page className="kid-ui mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-8">
      <Confetti
        ref={confettiRef}
        manualstart
        globalOptions={{ resize: true, useWorker: false }}
        className="pointer-events-none fixed inset-0 z-30 size-full"
      />

      <Link
        to="/student/focus"
        className="inline-flex items-center gap-1 font-kid-body text-base text-kid-ink-soft no-underline hover:text-kid-ink"
      >
        <LuChevronLeft className="size-4" aria-hidden="true" />
        Back to Focus
      </Link>

      <h1 className="mt-3 font-kid-display text-4xl font-semibold text-kid-ink sm:text-5xl">{activity.label}</h1>
      <p className="mt-1 text-lg text-kid-ink-soft">{activity.blurb}</p>

      <div className="mt-6 grid overflow-hidden rounded-[1.75rem] shadow-paper sm:grid-cols-2">
        <div className={cn('flex items-center justify-center', TONE_BG[activity.tone])}>
          {activity.key === 'breathe' && (
            <BreathePanel activity={activity} elapsedSeconds={elapsedSeconds} motionAllowed={motionAllowed} />
          )}
          {activity.key === 'wiggle' && <WigglePanel activity={activity} moveIndex={currentMoveIndex} />}
          {activity.key === 'listen' && (
            <ListenPanel
              activity={activity}
              soundIndex={soundIndex}
              audioRef={audioRef}
              playing={playing}
              onToggle={toggleSound}
              onTimeUpdate={handleAudioTimeUpdate}
              progress={audioProgress}
            />
          )}
        </div>

        <div className="flex flex-col gap-5 bg-kid-sheet px-6 py-8 sm:px-8">
          {finished ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <span aria-hidden="true" className="text-4xl">
                🎉
              </span>
              <p className="font-kid-display text-2xl font-semibold text-kid-ink">Nice work!</p>
              <p className="text-lg text-kid-ink-soft">Heading back to Focus…</p>
            </div>
          ) : (
            <>
              <h2 className="font-kid-display text-lg font-bold text-kid-ink">How to do it</h2>
              <StepsList steps={activity.steps} />
              <TimeChip seconds={remainingSeconds} />
              <div className="mt-auto flex flex-col items-center gap-3">
                <KidButton className="w-full" onClick={handleFeelBetter}>
                  I feel better
                </KidButton>
                <button
                  type="button"
                  onClick={handleSecondary}
                  className="min-h-11 rounded-full px-4 font-kid-display text-base text-kid-ink-soft underline decoration-dotted hover:text-kid-ink"
                >
                  {activity.quitLabel}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
