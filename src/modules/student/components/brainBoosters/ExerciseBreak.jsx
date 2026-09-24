import { useEffect, useReducer, useState } from 'react';

const EXERCISES = [
  {
    id: 'breathe', icon: '🌿', label: 'Easy breathing', description: 'A quiet moment to settle in.',
    steps: Array.from({ length: 5 }, () => [
      { title: 'Breathe in gently', detail: 'Relax your shoulders. Take a comfortable breath in.', seconds: 4, icon: '🌱' },
      { title: 'Breathe out slowly', detail: 'Let the breath go easily, at a pace that feels good.', seconds: 6, icon: '🍃' },
    ]).flat(),
  },
  {
    id: 'stretch', icon: '🙆', label: 'Stretch break', description: 'Make a little room to move.',
    steps: [
      { title: 'Reach for the sky', detail: 'Sit or stand comfortably. Gently reach your arms upward.', seconds: 15, icon: '🙌' },
      { title: 'Roll your shoulders', detail: 'Lower your arms and make small, gentle shoulder circles.', seconds: 15, icon: '🔄' },
      { title: 'Wiggle your fingers', detail: 'Let your hands relax, then give your fingers a little wiggle.', seconds: 15, icon: '👐' },
      { title: 'Relax and reset', detail: 'Rest your hands, soften your shoulders, and take an easy breath.', seconds: 15, icon: '🌿' },
    ],
  },
  {
    id: 'cross', icon: '🤲', label: 'Cross-body taps', description: 'A gentle left-and-right rhythm.',
    steps: [
      { title: 'Find a comfy seat', detail: 'Rest your feet and place both hands on your knees.', seconds: 10, icon: '🪑' },
      { title: 'Right hand, left knee', detail: 'Gently tap your left knee with your right hand, then bring it back.', seconds: 15, icon: '🤚' },
      { title: 'Left hand, right knee', detail: 'Gently tap your right knee with your left hand, then bring it back.', seconds: 15, icon: '✋' },
      { title: 'Try taking turns', detail: 'Alternate hands slowly. Finish with your hands resting in your lap.', seconds: 20, icon: '🤲' },
    ],
  },
];

function ExerciseSession({ exercise, reducedMotion }) {
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

  const step = exercise.steps[state.step];
  const complete = state.phase === 'complete';
  const totalSeconds = exercise.steps.reduce((sum, item) => sum + item.seconds, 0);
  const elapsed = exercise.steps.slice(0, state.step).reduce((sum, item) => sum + item.seconds, 0) + step.seconds - state.remaining;

  return (
    <div className="bb-exercise">
      <div className="bb-stats">
        <div className="bb-stat"><strong>{complete ? exercise.steps.length : state.step + 1} / {exercise.steps.length}</strong><span>Step</span></div>
        <div className="bb-stat"><strong>{complete ? 'Done' : `${state.remaining}s`}</strong><span>{state.phase === 'paused' ? 'Paused' : 'This step'}</span></div>
      </div>
      <progress className="bb-exercise__progress" value={complete ? totalSeconds : elapsed} max={totalSeconds} aria-label="Exercise progress" />
      <div className="bb-exercise__stage">
        <span
          key={state.step}
          className="bb-exercise__art"
          aria-hidden="true"
          style={{
            animationName: !reducedMotion && exercise.id === 'breathe' && ['playing', 'paused'].includes(state.phase)
              ? state.step % 2 === 0 ? 'bb-breathe-in' : 'bb-breathe-out'
              : 'none',
            animationDuration: `${step.seconds}s`,
            animationPlayState: state.phase === 'playing' ? 'running' : 'paused',
          }}
        >{complete ? '🌟' : step.icon}</span>
        <div aria-live="polite" aria-atomic="true">
          <h3>{complete ? 'A little break, complete!' : step.title}</h3>
          <p>{complete ? 'Take a moment to notice how you feel. Head back when you are ready.' : step.detail}</p>
        </div>
      </div>
      <div className="bb-exercise__actions">
        <button type="button" className="bb-primary-button" onClick={() => dispatch(complete ? 'reset' : state.phase === 'playing' ? 'pause' : 'start')}>{complete ? 'Try again' : state.phase === 'playing' ? 'Pause' : state.phase === 'paused' ? 'Resume' : 'Start exercise'}</button>
        <button type="button" className="bb-secondary-button" disabled={state.phase !== 'playing'} onClick={() => dispatch('skip')}>Skip step</button>
        <button type="button" className="bb-secondary-button" disabled={state.phase === 'ready'} onClick={() => dispatch('reset')}>Reset</button>
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
