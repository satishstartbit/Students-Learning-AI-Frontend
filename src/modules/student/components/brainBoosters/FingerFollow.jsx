import { useReducer, useRef, useState } from 'react';
import { createFollowState, followReducer, followPosition, FOLLOW_ROUND_MS, FOLLOW_ROUNDS } from './followGameLogic';
import { useAnimationClock, usePauseWhenHidden } from './useAnimationClock';
import './trackingGames.css';

const PACES = [{ id: 'slow', label: 'Slow', ms: 14000 }, { id: 'medium', label: 'Medium', ms: 11000 }, { id: 'fast', label: 'Fast', ms: 8500 }];

export default function FingerFollow({ isJunior = false, reducedMotion = false }) {
  const [pace, setPace] = useState('slow');
  const [path, setPath] = useState('horizontal');
  const [state, dispatch] = useReducer(followReducer, undefined, createFollowState);
  const field = useRef(null);
  const dot = useRef(null);
  const progress = useRef(null);
  const lastSecond = useRef(-1);
  const playing = state.phase === 'playing';
  const active = playing || state.phase === 'paused';
  const complete = state.phase === 'complete';
  const cycleMs = PACES.find((item) => item.id === pace).ms * (isJunior ? 1 : .85);
  const totalMs = FOLLOW_ROUND_MS * FOLLOW_ROUNDS;

  useAnimationClock({
    running: playing && !reducedMotion,
    clockKey: state.run + '-' + path + '-' + reducedMotion,
    durationMs: totalMs,
    onFrame: (elapsedMs) => {
      const position = followPosition(reducedMotion ? 0 : elapsedMs, cycleMs, path);
      if (dot.current && field.current) {
        dot.current.style.transform = 'translate3d(' + (position.x * field.current.clientWidth - 28) + 'px, ' + (position.y * field.current.clientHeight - 28) + 'px, 0)';
      }
      if (progress.current) progress.current.style.width = (100 * elapsedMs / totalMs) + '%';
      const second = Math.floor(elapsedMs / 1000);
      if (lastSecond.current !== second) {
        lastSecond.current = second;
        dispatch({ type: 'tick', elapsedMs, run: state.run });
      }
    },
    onFinish: () => dispatch({ type: 'finish', run: state.run }),
  });
  usePauseWhenHidden(() => dispatch({ type: 'pause' }));

  const round = complete ? FOLLOW_ROUNDS : Math.min(FOLLOW_ROUNDS, Math.floor(state.elapsedMs / FOLLOW_ROUND_MS) + 1);
  const feedback = complete ? 'Three rounds complete. Rest your eyes and take a comfortable break.'
    : state.phase === 'paused' ? 'Paused. The dot stays in place until you resume.'
      : playing ? reducedMotion ? 'Look at the still dot. Select Next round when you are ready.' : 'Keep your head comfortably still and follow the dot with your eyes. No tapping needed.'
        : 'Choose a pace and path. Follow the dot for three 20-second rounds.';

  return (
    <section className="bb-tracking-game" aria-labelledby="bb-finger-title" data-phase={state.phase}>
      <div className="bb-game-heading"><span className="bb-tracking-icon" aria-hidden="true">👆</span><div><h2 id="bb-finger-title">Finger Follow</h2><p>Follow one steady dot with your eyes.</p></div></div>
      <p className="bb-game-rules">Keep your head still, breathe normally, and let your eyes follow. This activity counts time and rounds, not eye accuracy.</p>
      <div className="bb-tracking-paces" role="group" aria-label="Target speed">
        {PACES.map((item) => <button key={item.id} type="button" className={'bb-tracking-pace ' + (pace === item.id ? 'is-selected' : '')} aria-pressed={pace === item.id} disabled={active || reducedMotion} onClick={() => setPace(item.id)}>{item.label}</button>)}
      </div>
      <div className="bb-paths" role="group" aria-label="Movement path">
        {[['horizontal', 'Side to side'], ['vertical', 'Up and down'], ['eight', 'Figure eight']].map(([id, label]) => <button key={id} type="button" aria-pressed={path === id} disabled={active || reducedMotion} onClick={() => setPath(id)}>{label}</button>)}
      </div>
      <div className="bb-stats"><div className="bb-stat"><strong>{state.phase === 'ready' ? 0 : round} / 3</strong><span>Round</span></div><div className="bb-stat"><strong>{reducedMotion ? 'Untimed' : Math.ceil((totalMs - state.elapsedMs) / 1000) + 's'}</strong><span>{reducedMotion ? 'Calm play' : 'Time left'}</span></div></div>
      <div className="bb-tracking-progress" aria-hidden="true"><span ref={progress} /></div>
      <div ref={field} className="bb-tracking-field">
        <div className="bb-tracking-grid" aria-hidden="true" />
        <span ref={dot} className="bb-tracking-target bb-follow-dot" role="img" aria-label="Dot to follow" style={{ visibility: active ? 'visible' : 'hidden' }}>◎</span>
        {!active && <div className="bb-tracking-placeholder"><span className="bb-tracking-preview-target" aria-hidden="true">◎</span><strong>{complete ? 'Break complete' : 'Ready to follow?'}</strong><span>{reducedMotion ? 'A still dot, at your own pace.' : 'The dot moves smoothly. You do not need to catch it.'}</span></div>}
        {state.phase === 'paused' && <span className="bb-tracking-paused">Paused</span>}
      </div>
      <p className="bb-feedback bb-tracking-feedback" role="status">{feedback}</p>
      <div className="bb-tracking-controls">
        <button type="button" className="bb-primary-button" onClick={() => dispatch({ type: playing ? 'pause' : state.phase === 'paused' ? 'resume' : 'start' })}>{playing ? 'Pause' : state.phase === 'paused' ? 'Resume' : complete ? 'Play again' : 'Start following'}</button>
        {reducedMotion && <button type="button" className="bb-secondary-button" disabled={!playing} onClick={() => dispatch({ type: 'calm-next' })}>Next round</button>}
        <button type="button" className="bb-secondary-button" disabled={state.phase === 'ready'} onClick={() => dispatch({ type: 'reset' })}>Reset</button>
      </div>
      <p className="bb-tip">Keep it comfortable. Pause and look away if your eyes feel tired.</p>
    </section>
  );
}
