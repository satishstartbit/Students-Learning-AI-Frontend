import assert from 'node:assert/strict';
import test from 'node:test';
import { createTrackingSession, trackingSessionReducer, balloonPosition } from './trackingGameLogic.js';
const start = (config = {}) => trackingSessionReducer(createTrackingSession(), { type: 'start', config });
const hit = (state) => trackingSessionReducer(state, { type: 'hit', target: state.target, version: state.version });
const next = (state) => trackingSessionReducer(state, { type: 'next', version: state.version });

test('a pop is counted once, followed by a gap before the next balloon', () => {
  const first = start();
  const popped = hit(first);
  assert.equal(popped.hits, 1);
  assert.equal(popped.phase, 'feedback');
  assert.equal(hit(popped), popped);
  const second = next(popped);
  assert.equal(second.target, 1);
  assert.equal(second.phase, 'playing');
  assert.equal(trackingSessionReducer(second, { type: 'expired', target: first.target, version: first.version }), second);
});
test('pause freezes both a balloon and the gap between balloons', () => {
  for (const state of [start(), hit(start())]) {
    const paused = trackingSessionReducer(state, { type: 'pause' });
    assert.equal(paused.phase, 'paused');
    assert.equal(hit(paused), paused);
    assert.equal(next(paused), paused);
    assert.equal(trackingSessionReducer(paused, { type: 'resume' }).phase, state.phase);
  }
});
test('a late event from a prior run cannot pop the new first balloon', () => {
  const old = start();
  const fresh = trackingSessionReducer(trackingSessionReducer(old, { type: 'reset' }), { type: 'start' });
  assert.equal(trackingSessionReducer(fresh, { type: 'hit', target: 0, version: old.version }), fresh);
});
test('ten balloons end the game and popped plus missed always equals completed', () => {
  let state = start();
  for (let index = 0; index < 10; index += 1) {
    state = trackingSessionReducer(state, { type: index % 2 ? 'expired' : 'hit', target: state.target, version: state.version });
    assert.equal(state.hits + state.misses, state.completed);
    if (index < 9) state = next(state);
  }
  assert.equal(state.phase, 'complete');
  assert.equal(state.hits, 5);
  assert.equal(state.misses, 5);
  assert.equal(next(state), state);
});
test('speed increases only when the next balloon starts and has a safe floor', () => {
  let state = start({ durationMs: 6000, minimumDurationMs: 5200 });
  for (let count = 0; count < 3; count += 1) { state = hit(state); if (count < 2) state = next(state); }
  assert.equal(state.durationMs, 6000);
  state = next(state);
  assert.equal(state.durationMs, 5550);
  for (let count = 3; count < 6; count += 1) { state = next(hit(state)); }
  assert.equal(state.durationMs, 5200);
});
test('a balloon rises monotonically and stays horizontally inside narrow boards', () => {
  for (const width of [220, 310, 620]) {
    for (let target = 0; target < 10; target += 1) {
      let previous = Infinity;
      for (let n = 0; n <= 100; n += 1) {
        const point = balloonPosition(n / 100, width, 300, target);
        assert.ok(point.x >= 0 && point.x + 74 <= width);
        assert.ok(point.y <= previous);
        previous = point.y;
      }
      assert.ok(balloonPosition(1, width, 300, target).y <= -76);
    }
  }
});
