import { useEffect, useReducer, useRef } from 'react';
import { BALLOON_TARGET_COUNT, BALLOON_FEEDBACK_MS, balloonPosition, createTrackingSession, trackingSessionReducer } from './trackingGameLogic';
import { useAnimationClock, usePauseWhenHidden } from './useAnimationClock';
import './trackingGames.css';

const BALLOONS = [
  { name: 'Pink', color: '#ed64ad', ink: '#6d1646' }, { name: 'Yellow', color: '#ffc62f', ink: '#694a00' },
  { name: 'Blue', color: '#518bf0', ink: '#163d7f' }, { name: 'Purple', color: '#a68bf0', ink: '#492b88' },
  { name: 'Coral', color: '#ff8278', ink: '#7e2620' }, { name: 'Green', color: '#51c9a3', ink: '#135541' },
];

export default function BalloonEyes({ isJunior = false, reducedMotion = false }) {
  const [state, dispatch] = useReducer(trackingSessionReducer, undefined, createTrackingSession);
  const field = useRef(null);
  const targetRef = useRef(null);
  const playing = state.phase === 'playing';
  const active = ['playing', 'paused', 'feedback'].includes(state.phase);
  const complete = state.phase === 'complete';
  const balloon = BALLOONS[state.target % BALLOONS.length];
  const hit = () => dispatch({ type: 'hit', target: state.target, version: state.version });
  useAnimationClock({
    running: playing && !reducedMotion,
    clockKey: state.version + '-' + reducedMotion,
    durationMs: state.durationMs,
    onFrame: (elapsedMs) => {
      if (!field.current || !targetRef.current) return;
      const position = balloonPosition(reducedMotion ? .4 : elapsedMs / state.durationMs, field.current.clientWidth, field.current.clientHeight, state.target);
      targetRef.current.style.transform = 'translate3d(' + position.x + 'px, ' + position.y + 'px, 0)';
    },
    onFinish: () => dispatch({ type: 'expired', target: state.target, version: state.version }),
  });
  usePauseWhenHidden(() => dispatch({ type: 'pause' }));
  useEffect(() => {
    if (state.phase !== 'feedback') return undefined;
    const timer = window.setTimeout(() => dispatch({ type: 'next', version: state.version }), BALLOON_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.version]);

  const start = () => dispatch({ type: 'start', config: { totalTargets: BALLOON_TARGET_COUNT, durationMs: isJunior ? 8000 : 6500, minimumDurationMs: isJunior ? 5500 : 4500 } });
  const feedback = complete ? 'Session complete! You popped ' + state.hits + ' of 10 balloons.'
    : state.phase === 'paused' ? 'Paused. The balloon and your score will wait.'
      : state.phase === 'feedback' ? state.lastResult === 'caught' ? 'Pop! Get ready for the next balloon.' : 'That one floated away. Another balloon is coming.'
        : playing ? 'Find the ' + balloon.name.toLowerCase() + ' balloon. Tap it or use the Pop balloon button.'
          : 'Name the colour, then pop the balloon. Play a set of ten.';

  return (
    <section className="bb-tracking-game" aria-labelledby="bb-balloon-title" data-phase={state.phase}>
      <div className="bb-game-heading"><span className="bb-tracking-icon" aria-hidden="true">🎈</span><div><h2 id="bb-balloon-title">Balloon Eyes</h2><p>Watch the colour. Follow the balloon. Pop!</p></div></div>
      <p className="bb-game-rules">{reducedMotion ? 'Pop ten still balloons at your own pace. There is no time limit.' : 'Pop each balloon before it leaves the sky. Each balloon counts once; after three pops the next level is a little quicker.'}</p>
      <div className="bb-stats">
        <div className="bb-stat"><strong>{state.hits}</strong><span>Popped</span></div>
        <div className="bb-stat"><strong>{state.misses}</strong><span>Missed</span></div>
        <div className="bb-stat"><strong>{Math.min(4, Math.floor(state.hits / 3) + 1)}</strong><span>Level</span></div>
      </div>
      <div className="bb-balloon-color-line"><span>Balloon colour</span><span className="bb-balloon-color-chip" style={{ backgroundColor: balloon.color, color: balloon.ink }}>{balloon.name}</span><span className="bb-balloon-counter">{state.completed} / 10 finished</span></div>
      <div ref={field} className="bb-balloon-field">
        <span className="bb-balloon-cloud bb-balloon-cloud--one" aria-hidden="true" /><span className="bb-balloon-cloud bb-balloon-cloud--two" aria-hidden="true" />
        <button ref={targetRef} type="button" className="bb-balloon-target" onClick={hit} disabled={!playing}
          aria-label={'Pop ' + balloon.name.toLowerCase() + ' balloon'}
          style={{ '--bb-balloon-color': balloon.color, '--bb-balloon-ink': balloon.ink, visibility: active && state.phase !== 'feedback' && state.resumePhase !== 'feedback' ? 'visible' : 'hidden' }}>
          <span className="bb-balloon-body"><span className="bb-balloon-shine" /><span className="bb-balloon-mark" aria-hidden="true">✦</span></span><span className="bb-balloon-string" aria-hidden="true" />
        </button>
        {!active && <div className="bb-balloon-placeholder"><span className="bb-balloon-preview" aria-hidden="true">🎈</span><strong>{complete ? 'Your balloon break is complete.' : 'Ready to pop?'}</strong><span>{reducedMotion ? 'Still balloons. No timer.' : 'Ten balloons, one at a time.'}</span></div>}
        {state.phase === 'feedback' && <div className="bb-balloon-placeholder"><strong>{state.lastResult === 'caught' ? 'Pop! +1' : 'Floated away'}</strong><span>Next balloon…</span></div>}
        {state.phase === 'paused' && <span className="bb-tracking-paused">Paused</span>}
      </div>
      <p className="bb-feedback bb-tracking-feedback" role="status">{feedback}</p>
      <div className="bb-tracking-controls">
        <button className="bb-primary-button" type="button" onClick={() => active ? dispatch({ type: state.phase === 'paused' ? 'resume' : 'pause' }) : start()}>{active ? state.phase === 'paused' ? 'Resume' : 'Pause' : complete ? 'Play again' : 'Start popping'}</button>
        <button className="bb-secondary-button" type="button" onClick={hit} disabled={!playing}>Pop balloon</button>
        <button className="bb-secondary-button" type="button" onClick={() => dispatch({ type: 'reset' })} disabled={state.phase === 'ready'}>Reset</button>
      </div>
      <p className="bb-tip">Say the colour out loud if you like. A miss is just a chance to try the next balloon.</p>
    </section>
  );
}
