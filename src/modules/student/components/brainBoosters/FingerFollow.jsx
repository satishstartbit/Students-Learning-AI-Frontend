import { useEffect, useRef, useState } from 'react';
import { LuEye, LuPlay, LuSparkles } from 'react-icons/lu';
import { advanceFollow, changeFollowPace, createFollowState, FOLLOW_PACES, FOLLOW_RADIUS, FOLLOW_ROUND_MS, FOLLOW_ROUNDS, followCue, followPosition, pauseFollow, resetFollow, resumeFollow, startFollow, tapFollow } from './followGameLogic';
import './trackingGames.css';
import './fingerFollow.css';

/**
 * Finger Follow: follow the dot with your eyes, tap it once each time it
 * glows gold (followGameLogic.js has the rules). On its own page
 * (pages/BoosterPage.jsx), which shows the title, so `hideHeading` drops the
 * game's own. K-5 (`isJunior`) sees a short round/tap line under the board
 * instead of the three counters - "just for fun" - with the same test ids.
 */
export default function FingerFollow({ isJunior = false, reducedMotion = false, hideHeading = false }) {
  const board = useRef(null);
  const dot = useRef(null);
  const progress = useRef(null);
  const actions = useRef(null);
  const [view, setView] = useState(() => createFollowState({ isJunior, calm: reducedMotion }));

  useEffect(() => {
    let state = createFollowState({ isJunior, calm: reducedMotion });
    const field = board.current, target = dot.current, bar = progress.current;
    let frame, previous = performance.now(), signature = '';
    function draw() {
      const p = followPosition(state, field.clientWidth, field.clientHeight);
      target.style.transform = `translate3d(${p.x - FOLLOW_RADIUS}px, ${p.y - FOLLOW_RADIUS}px, 0)`;
      const cue = followCue(state);
      target.dataset.glowing = String(cue.glowing);
      const remaining = state.phase === 'complete' ? 0 : state.calm ? 1 - (state.taps % 5) / 5 : 1 - (state.elapsedMs % FOLLOW_ROUND_MS) / FOLLOW_ROUND_MS;
      bar.style.transform = `scaleX(${remaining})`;
      bar.parentElement.setAttribute('aria-valuenow', String(Math.round((1 - remaining) * 100)));
      const next = JSON.stringify([state.phase, state.pace, state.taps, state.streak, state.rounds, state.notice, cue.glowing]);
      if (signature !== next) { signature = next; setView({ ...state, glowing: cue.glowing }); }
    }
    const update = (next) => { state = next; previous = performance.now(); draw(); };
    actions.current = {
      start: () => update(startFollow(state)), pause: () => update(pauseFollow(state)),
      resume: () => update(resumeFollow(state)), reset: () => update(resetFollow(state)),
      pace: (pace) => update(changeFollowPace(state, pace)), tap: () => update(tapFollow(state, true)),
    };
    function pointerDown(event) {
      if (!event.isPrimary || event.button !== 0 || event.target.closest('[data-follow-control]') || state.phase !== 'playing') return;
      const rect = field.getBoundingClientRect();
      const p = followPosition(state, field.clientWidth, field.clientHeight);
      const x = (event.clientX - rect.left) * field.clientWidth / rect.width;
      const y = (event.clientY - rect.top) * field.clientHeight / rect.height;
      update(tapFollow(state, Math.hypot(x - p.x, y - p.y) <= FOLLOW_RADIUS));
    }
    const hide = () => { if (document.hidden) update(pauseFollow(state)); };
    const blur = () => update(pauseFollow(state));
    const key = (event) => { if (event.key === 'Escape') update(pauseFollow(state)); };
    field.addEventListener('pointerdown', pointerDown);
    field.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('blur', blur);
    const resize = new ResizeObserver(draw);
    resize.observe(field);
    function tick(now) {
      const elapsed = now - previous; previous = now;
      if (state.phase === 'playing' && !document.hidden) { state = advanceFollow(state, elapsed); draw(); }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); resize.disconnect();
      field.removeEventListener('pointerdown', pointerDown); field.removeEventListener('keydown', key);
      document.removeEventListener('visibilitychange', hide); window.removeEventListener('blur', blur);
      actions.current = null;
    };
  }, [isJunior, reducedMotion]);

  return (
    <section
      className="bb-video-follow bb-tracking-game"
      data-phase={view.phase}
      data-band={isJunior ? 'kid' : 'standard'}
      aria-labelledby={hideHeading ? undefined : 'bb-finger-title'}
      aria-label={hideHeading ? 'Finger Follow' : undefined}
    >
      {!hideHeading && <header className="bb-follow-heading"><h2 id="bb-finger-title">Finger Follow</h2><p>Track the dot with ONLY your eyes</p></header>}
      <div className="bb-follow-paces" role="group" aria-label="Dot speed">
        {!isJunior && <span className="bb-follow-paces__label" aria-hidden="true">Speed</span>}
        {Object.entries(FOLLOW_PACES).map(([pace, item]) => <button key={pace} type="button" className={`bb-follow-pace bb-follow-pace--${pace}`} aria-pressed={view.pace === pace} onClick={() => actions.current?.pace(pace)}>{item.label}</button>)}
      </div>
      {!isJunior && <div className="bb-follow-stats">
        <div><strong data-testid="follow-rounds">{view.rounds}</strong><span>Rounds</span></div>
        <div><strong data-testid="follow-score">{view.taps}</strong><span>Taps</span></div>
        <div><strong data-testid="follow-streak">{view.streak}</strong><span>Streak</span></div>
      </div>}
      <div className="bb-follow-progress" role="progressbar" aria-label="Round progress" aria-valuemin={0} aria-valuemax={100}><span ref={progress} /></div>
      <div ref={board} className="bb-follow-field" role="group" aria-label="Finger Follow game board" aria-describedby="bb-follow-help">
        <button ref={dot} type="button" className="bb-follow-dot" disabled={view.phase !== 'playing'} aria-label={view.glowing ? 'Glowing dot: tap now' : 'Follow the dot: wait for the glow'} onClick={(event) => { if (event.detail === 0) actions.current?.tap(); }} />
        {view.phase === 'ready' && <div className="bb-follow-overlay">
          <span className="bb-follow-eye" aria-hidden="true"><LuEye /></span>
          <p><strong>Follow the dot with your eyes only.</strong><br />Tap it when it glows gold.</p>
          <button type="button" data-follow-control className="bb-follow-start" onClick={() => actions.current?.start()}><LuPlay aria-hidden="true" />Let&apos;s go!</button>
        </div>}
        {view.phase === 'paused' && <div className="bb-follow-overlay bb-follow-overlay--paused"><span className="bb-follow-eye" aria-hidden="true"><LuEye /></span><p><strong>Paused.</strong><br />Ready to follow again?</p><button type="button" data-follow-control className="bb-follow-start" onClick={() => actions.current?.resume()}><LuPlay aria-hidden="true" />Resume</button></div>}
        {view.phase === 'complete' && <div className="bb-follow-overlay"><span className="bb-follow-eye" aria-hidden="true"><LuSparkles /></span><p><strong>{FOLLOW_ROUNDS} rounds complete!</strong><br />{view.taps} successful taps</p><button type="button" data-follow-control className="bb-follow-start" onClick={() => actions.current?.start()}><LuPlay aria-hidden="true" />Play again</button></div>}
        {view.phase !== 'ready' && <div className="bb-follow-tools">
          {view.phase === 'playing' && <button type="button" data-follow-control onClick={() => actions.current?.pause()}>Pause</button>}
          <button type="button" data-follow-control onClick={() => actions.current?.reset()}>Reset</button>
        </div>}
        <span className="bb-follow-cue" role="status">{view.phase === 'playing' ? view.notice || (view.glowing ? '✨ Tap now!' : 'Follow the dot…') : ''}</span>
      </div>
      {isJunior ? (
        <p className="bb-follow-caption" id="bb-follow-help">
          {view.phase === 'ready' ? (
            <>
              {FOLLOW_ROUNDS} short rounds
              <span className="ui-sr-only">
                {' '}- <span data-testid="follow-rounds">{view.rounds}</span> rounds done, <span data-testid="follow-score">{view.taps}</span> taps, streak <span data-testid="follow-streak">{view.streak}</span>
              </span>
            </>
          ) : (
            <>Round <strong data-testid="follow-rounds">{view.rounds}</strong> of {FOLLOW_ROUNDS} done · <strong data-testid="follow-score">{view.taps}</strong> taps · streak <strong data-testid="follow-streak">{view.streak}</strong></>
          )}
        </p>
      ) : (
        <p className="bb-follow-tip" id="bb-follow-help">Keep your head still. Only move your eyes.</p>
      )}
      {reducedMotion && <p className="bb-follow-calm">Calm play: the dot stays still and glowing. Five taps complete a round.</p>}
    </section>
  );
}
