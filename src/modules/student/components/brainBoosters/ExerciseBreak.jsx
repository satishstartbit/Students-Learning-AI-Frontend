import { useEffect, useReducer, useState } from 'react';
import ExerciseIllustration from '../focus/ExerciseIllustration';
import { illustrationFor, toneOf } from '../focus/exerciseGroups';
import { EXERCISE_BOOSTERS } from './boosters';
import { EXERCISES } from './exerciseBreaks';

/**
 * One exercise, step by step: Start / Pause / Resume, Skip step, Reset. Used
 * on the exercise's own page. Over each step's words sits the same picture
 * of the exercise as on the Focus page (focus/ExerciseIllustration, in its
 * tile's colour): it moves only while the exercise runs, holds still when
 * paused, done or in calm play, and starts again on Reset. Easy breathing's
 * circle grows for 4 seconds and shrinks for 6, the same as its steps.
 */
export function ExerciseSession({ exercise, reducedMotion }) {
  const initial = { phase: 'ready', step: 0, remaining: exercise.steps[0].seconds };
  const [state, dispatch] = useReducer((current, action) => {
    if (action === 'reset') return initial;
    if (action === 'pause') return current.phase === 'playing' ? { ...current, phase: 'paused' } : current;
    if (action === 'start') return { ...current, phase: 'playing' };
    if (current.phase !== 'playing') return current;
    if (action === 'tick' && current.remaining > 1) return { ...current, remaining: current.remaining - 1 };
    const next = current.step + 1;
    return next === exercise.steps.length
      ? { ...current, remaining: 0, phase: 'complete' }
      : { phase: 'playing', step: next, remaining: exercise.steps[next].seconds };
  }, initial);

  useEffect(() => {
    if (state.phase !== 'playing') return undefined;
    const timer = window.setInterval(() => dispatch('tick'), 1000);
    return () => window.clearInterval(timer);
  }, [state.phase]);

  useEffect(() => {
    const pause = () => { if (document.hidden) dispatch('pause'); };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);

  // Reset starts the picture again from the top, in step with the exercise.
  const [run, setRun] = useState(0);
  const reset = () => {
    setRun((n) => n + 1);
    dispatch('reset');
  };

  const step = exercise.steps[state.step];
  const complete = state.phase === 'complete';
  const totalSeconds = exercise.steps.reduce((sum, item) => sum + item.seconds, 0);
  const elapsed = exercise.steps.slice(0, state.step).reduce((sum, item) => sum + item.seconds, 0) + step.seconds - state.remaining;
  const booster = EXERCISE_BOOSTERS.find((b) => b.exercise === exercise.id);
  const picture = { name: exercise.label, toolType: exercise.id, category: booster?.categories?.[0] ?? '' };

  return (
    <div className="bb-exercise">
      <div className="bb-stats">
        <div className="bb-stat"><strong>{complete ? exercise.steps.length : state.step + 1} / {exercise.steps.length}</strong><span>Step</span></div>
        <div className="bb-stat"><strong>{complete ? 'Done' : `${state.remaining}s`}</strong><span>{state.phase === 'paused' ? 'Paused' : 'This step'}</span></div>
      </div>
      <progress className="bb-exercise__progress" value={complete ? totalSeconds : elapsed} max={totalSeconds} aria-label="Exercise progress" />
      <div className="bb-exercise__stage bb-exercise__stage--picture">
        <div className="bb-exercise__picture" key={run}>
          <ExerciseIllustration kind={illustrationFor(picture)} tone={toneOf(picture)} paused={reducedMotion || state.phase !== 'playing'} caption={false} />
        </div>
        <div aria-live="polite" aria-atomic="true">
          <h3>{complete ? 'A little break, complete!' : step.title}</h3>
          <p>{complete ? 'Take a moment to notice how you feel. Head back when you are ready.' : step.detail}</p>
        </div>
      </div>
      <div className="bb-exercise__actions">
        <button type="button" className="bb-primary-button" onClick={() => (complete ? reset() : dispatch(state.phase === 'playing' ? 'pause' : 'start'))}>{complete ? 'Try again' : state.phase === 'playing' ? 'Pause' : state.phase === 'paused' ? 'Resume' : 'Start exercise'}</button>
        <button type="button" className="bb-secondary-button" disabled={state.phase !== 'playing'} onClick={() => dispatch('skip')}>Skip step</button>
        <button type="button" className="bb-secondary-button" disabled={state.phase === 'ready'} onClick={reset}>Reset</button>
      </div>
      <p className="bb-tip">Move only as far as feels comfortable. You can stay seated or skip any step.</p>
    </div>
  );
}

export default function ExerciseBreak({ isJunior, reducedMotion }) {
  const [selected, setSelected] = useState('breathe');
  const exercise = EXERCISES.find((item) => item.id === selected);
  return (
    <div>
      <div className="bb-game-heading"><span aria-hidden="true">🌿</span><div><h2>{isJunior ? 'Move & reset' : 'A mindful movement break'}</h2><p>Choose a short, gentle exercise.</p></div></div>
      <div className="bb-exercise__choices" role="group" aria-label="Choose an exercise">
        {EXERCISES.map((item) => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
      </div>
      <p className="bb-exercise__description">{exercise.description}</p>
      <ExerciseSession key={selected} exercise={exercise} reducedMotion={reducedMotion} />
    </div>
  );
}
