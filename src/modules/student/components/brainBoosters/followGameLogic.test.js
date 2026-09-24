import assert from 'node:assert/strict';
import test from 'node:test';
import { createFollowState, followReducer, followPosition, FOLLOW_ROUND_MS, FOLLOW_ROUNDS } from './followGameLogic.js';

test('all follow paths stay bounded and continuous at frame, cycle, and round boundaries', () => {
  for (const path of ['horizontal', 'vertical', 'eight']) {
    let previous = followPosition(0, 8500, path);
    for (let ms = 16; ms <= 61000; ms += 16) {
      const point = followPosition(ms, 8500, path);
      assert.ok(point.x >= .15 && point.x <= .85 && point.y >= .21 && point.y <= .79);
      assert.ok(Math.hypot(point.x - previous.x, point.y - previous.y) < .012);
      previous = point;
    }
    assert.ok(Math.abs(followPosition(8500, 8500, path).x - .5) < .00001);
  }
});

test('pause blocks time and stale completion cannot finish a reset session', () => {
  let state = followReducer(createFollowState(), { type: 'start' });
  const oldRun = state.run;
  state = followReducer(state, { type: 'tick', elapsedMs: 1200, run: state.run });
  state = followReducer(state, { type: 'pause' });
  assert.equal(followReducer(state, { type: 'tick', elapsedMs: 3000, run: state.run }), state);
  state = followReducer(state, { type: 'resume' });
  assert.equal(state.elapsedMs, 1200);
  state = followReducer(state, { type: 'reset' });
  state = followReducer(state, { type: 'start' });
  assert.equal(followReducer(state, { type: 'finish', run: oldRun }), state);
});

test('calm play completes exactly three manual rounds without timed scoring', () => {
  let state = followReducer(createFollowState(), { type: 'start' });
  for (let round = 0; round < FOLLOW_ROUNDS; round += 1) state = followReducer(state, { type: 'calm-next' });
  assert.equal(state.phase, 'complete');
  assert.equal(state.elapsedMs, FOLLOW_ROUND_MS * FOLLOW_ROUNDS);
  assert.equal(followReducer(state, { type: 'calm-next' }), state);
});
