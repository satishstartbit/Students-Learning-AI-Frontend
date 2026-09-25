import { useEffect, useRef, useState } from 'react';
import { advanceFollow, corridorAt, createFollowState, HOLD_MS, HUB_RADIUS, moveFollow, pauseFollow, pressFollow, resetFollow } from './followGameLogic';
import './trackingGames.css';
import './fingerFollow.css';

const START_VIEW = { phase: 'paused', reason: 'ready', score: 0, level: 1, countdown: 3 };

export default function FingerFollow({ isJunior = false, reducedMotion = false }) {
  const field = useRef(null);
  const canvas = useRef(null);
  const hub = useRef(null);
  const controls = useRef(null);
  const [view, setView] = useState(START_VIEW);

  useEffect(() => {
    const board = field.current;
    const drawing = canvas.current;
    const button = hub.current;
    const context = drawing.getContext('2d');
    let state = createFollowState({ isJunior, calm: reducedMotion });
    let size = { width: board.clientWidth, height: board.clientHeight };
    let heldPointer = null;
    let keyboardHeld = false;
    const arrows = new Set();
    let frame;
    let previous = performance.now();
    let published = '';
    let disposed = false;
    let sized = false;

    function draw() {
      const { width, height } = size;
      context.clearRect(0, 0, width, height);
      const top = [];
      const bottom = [];
      for (let x = 0; x <= width + 4; x += 4) {
        const corridor = corridorAt(state.distance + x / width, isJunior, state.seed);
        top.push([x, (corridor.centre - corridor.half) * height]);
        bottom.push([x, (corridor.centre + corridor.half) * height]);
      }
      context.fillStyle = 'rgba(183, 169, 238, .16)';
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(width, 0);
      for (let i = top.length - 1; i >= 0; i -= 1) context.lineTo(...top[i]);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(0, height);
      context.lineTo(width, height);
      for (let i = bottom.length - 1; i >= 0; i -= 1) context.lineTo(...bottom[i]);
      context.closePath();
      context.fill();
      context.strokeStyle = 'rgba(205, 191, 255, .6)';
      context.lineWidth = 2;
      for (const points of [top, bottom]) {
        context.beginPath();
        points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y));
        context.stroke();
      }
      // Grid scroll shares the same distance as the corridor and collision checks.
      const spacing = 26;
      const offset = state.distance * width % spacing;
      context.fillStyle = 'rgba(225, 217, 255, .16)';
      for (let x = -offset; x < width; x += spacing) {
        for (let y = 12; y < height; y += spacing) context.fillRect(x, y, 1, 1);
      }
      button.style.transform = 'translate3d(' + (state.x * width - HUB_RADIUS) + 'px,' + (state.y * height - HUB_RADIUS) + 'px,0)';
      const countdown = Math.ceil((HOLD_MS - state.holdMs) / 1000);
      const signature = [state.phase, state.reason, state.score, state.level, countdown].join('-');
      if (signature !== published) {
        published = signature;
        setView({ phase: state.phase, reason: state.reason, score: state.score, level: state.level, countdown });
      }
    }

    function releaseCapture() {
      const id = heldPointer;
      heldPointer = null;
      keyboardHeld = false;
      arrows.clear();
      if (id !== null && board.hasPointerCapture(id)) board.releasePointerCapture(id);
    }

    function pause(reason = 'released') {
      state = pauseFollow(state, reason);
      releaseCapture();
      draw();
    }

    function coordinates(event) {
      const rect = board.getBoundingClientRect();
      return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    }

    function pointerDown(event) {
      if (!event.isPrimary || event.button !== 0 || heldPointer !== null) return;
      event.preventDefault();
      state = pressFollow(state, coordinates(event), size);
      if (state.phase === 'countdown') {
        heldPointer = event.pointerId;
        keyboardHeld = false;
        board.setPointerCapture(event.pointerId);
        button.focus({ preventScroll: true });
      }
      previous = performance.now();
      draw();
    }

    function pointerMove(event) {
      if (event.pointerId !== heldPointer) return;
      if (event.pointerType === 'mouse' && !(event.buttons & 1)) { pause(); return; }
      state = moveFollow(state, coordinates(event), size);
      if (!['playing', 'countdown'].includes(state.phase)) releaseCapture();
      draw();
    }

    function pointerEnd(event) {
      if (event.pointerId === heldPointer) pause();
    }

    function keyDown(event) {
      if (event.key === 'Escape') { event.preventDefault(); pause('paused'); return; }
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        if (event.repeat || heldPointer !== null || ['complete', 'failed'].includes(state.phase)) return;
        keyboardHeld = true;
        state = pressFollow(state, state, size);
        previous = performance.now();
        draw();
      } else if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        if (keyboardHeld) arrows.add(event.key);
      }
    }

    function keyUp(event) {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        if (keyboardHeld) pause();
      }
      arrows.delete(event.key);
    }

    const blur = () => pause('interrupted');
    const visibility = () => { if (document.hidden) pause('interrupted'); };
    const resize = () => {
      const nextSize = { width: board.clientWidth, height: board.clientHeight };
      if (!nextSize.width || !nextSize.height) { pause('resized'); return; }
      if (sized && nextSize.width === size.width && nextSize.height === size.height) return;
      sized = true;
      state = pauseFollow(state, 'resized');
      releaseCapture();
      size = nextSize;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      drawing.width = Math.round(size.width * ratio);
      drawing.height = Math.round(size.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Reposition safely for a changed board size without discarding earned points.
      const margin = (HUB_RADIUS + 2) / size.width;
      const x = Math.max(margin, Math.min(1 - margin, state.x));
      state = { ...state, x, y: state.phase === 'failed' ? state.y : corridorAt(state.distance + x, isJunior, state.seed).centre };
      draw();
    };
    controls.current = {
      reset: () => { releaseCapture(); state = resetFollow(state); draw(); },
    };
    const observer = new ResizeObserver(resize);
    observer.observe(board);
    board.addEventListener('pointerdown', pointerDown);
    board.addEventListener('pointermove', pointerMove);
    board.addEventListener('pointerup', pointerEnd);
    board.addEventListener('pointercancel', pointerEnd);
    board.addEventListener('lostpointercapture', pointerEnd);
    button.addEventListener('keydown', keyDown);
    button.addEventListener('keyup', keyUp);
    button.addEventListener('blur', blur);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility);

    function tick(now) {
      if (disposed) return;
      const elapsed = Math.min(40, Math.max(0, now - previous));
      previous = now;
      if (['playing', 'countdown'].includes(state.phase) && !document.hidden) {
        if (state.phase === 'playing' && keyboardHeld && arrows.size) {
          const x = Number(arrows.has('ArrowRight')) - Number(arrows.has('ArrowLeft'));
          const y = Number(arrows.has('ArrowDown')) - Number(arrows.has('ArrowUp'));
          state = moveFollow(state, { x: state.x + x * elapsed * .00035, y: state.y + y * elapsed * .0005 }, size);
        }
        state = advanceFollow(state, elapsed, size);
        if (!['playing', 'countdown'].includes(state.phase)) releaseCapture();
        draw();
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      board.removeEventListener('pointerdown', pointerDown);
      board.removeEventListener('pointermove', pointerMove);
      board.removeEventListener('pointerup', pointerEnd);
      board.removeEventListener('pointercancel', pointerEnd);
      board.removeEventListener('lostpointercapture', pointerEnd);
      button.removeEventListener('keydown', keyDown);
      button.removeEventListener('keyup', keyUp);
      button.removeEventListener('blur', blur);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
      releaseCapture();
      controls.current = null;
    };
  }, [isJunior, reducedMotion]);

  const message = view.reason === 'outside' ? 'You pressed outside the circle. Score reset to 0. Select Try again for a new run.'
    : view.reason === 'wall' ? 'The circle touched a corridor wall. Score reset to 0. Select Try again for a new run.'
      : view.phase === 'complete' ? 'Course complete! Select Play again for a new run.'
        : view.phase === 'countdown' ? 'Keep holding the circle. The course starts after the countdown.'
        : view.phase === 'playing' ? 'Keep holding and steer inside the corridor. Release whenever you need to pause.'
          : view.reason === 'ready' ? 'Hold the pink circle for 3 seconds to start. A quick click only pauses the game.'
            : 'Paused. Your points are safe. Hold the circle for 3 seconds to resume.';

  return (
    <section className="bb-tracking-game bb-steering-game" aria-labelledby="bb-finger-title" data-phase={view.phase}>
      <div className="bb-game-heading"><span className="bb-tracking-icon" aria-hidden="true">👆</span><div><h2 id="bb-finger-title">Finger Follow</h2><p>Hold the circle. Steer through the course.</p></div></div>
      <p className="bb-game-rules">Hold the pink circle through the 3-second countdown, then drag inside the path. Release to pause. A press outside the circle or a wall hit ends the run with 0 points.</p>
      <div className="bb-stats">
        <div className="bb-stat"><strong data-testid="follow-score">{view.score}</strong><span>Points</span></div>
        <div className="bb-stat"><strong>{view.level}</strong><span>Level</span></div>
        <div className="bb-stat"><strong>{view.phase === 'failed' ? 'Ended' : view.phase === 'complete' ? 'Finished' : view.phase === 'countdown' ? view.countdown : reducedMotion ? 'Calm' : view.phase === 'playing' ? 'Moving' : 'Paused'}</strong><span>Course</span></div>
      </div>
      <div ref={field} className="bb-tracking-field bb-steering-field" role="group" aria-label="Finger Follow steering course" aria-describedby="bb-steering-help">
        <canvas ref={canvas} aria-hidden="true" />
        <button ref={hub} type="button" className="bb-steering-hub" aria-label="Steering circle: hold Space or Enter and use arrow keys, or press and drag" aria-describedby="bb-steering-help">
          <span aria-hidden="true"><i /></span>
        </button>
        {view.phase !== 'playing' && <span className="bb-tracking-paused">{view.phase === 'failed' ? 'Run ended' : view.phase === 'complete' ? 'Complete' : view.phase === 'countdown' ? `Keep holding · ${view.countdown}` : view.reason === 'ready' ? 'Hold circle to start' : 'Paused · hold to resume'}</span>}
      </div>
      <p className="bb-feedback bb-tracking-feedback" role="status">{message}</p>
      <div className="bb-tracking-controls">
        <span className="bb-steering-control-hint">{view.phase === 'failed' ? 'Ready for another run?' : 'Start on the pink circle above. Release to pause.'}</span>
        <button type="button" className={view.phase === 'failed' ? 'bb-primary-button' : 'bb-secondary-button'} onClick={() => controls.current?.reset()}>{view.phase === 'failed' ? 'Try again' : view.phase === 'complete' ? 'Play again' : 'Reset'}</button>
      </div>
      <p id="bb-steering-help" className="bb-tip">{reducedMotion ? 'Calm play is on: the course stays still. After the countdown, steer right to the end to earn points.' : 'Stay inside the path for as long as you can. Points and speed increase as it scrolls left.'} Keyboard: focus the circle, hold Space or Enter through the countdown, then steer with the arrow keys. Release to pause.</p>
    </section>
  );
}
