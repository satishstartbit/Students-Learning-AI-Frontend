import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemorySequence, createMemoryState, getMemorySettings, memoryGameReducer } from './memoryGameLogic.js';

function startRound(sequence, maxLength = 6) {
  const state = memoryGameReducer(createMemoryState(maxLength), { type: 'start', sequence });
  return memoryGameReducer(state, { type: 'your-turn', playbackId: state.playbackId });
}

test('age settings give younger students shorter, slower, capped sessions', () => {
  for (const mode of ['clap', 'simon', 'chain']) {
    const junior = getMemorySettings(mode, true);
    const senior = getMemorySettings(mode, false);
    assert.ok(junior.startLength <= senior.startLength);
    assert.ok(junior.stepMs > senior.stepMs);
    assert.ok(junior.maxLength < senior.maxLength);
  }
  assert.deepEqual(createMemorySequence(3, 4, () => .75), [3, 3, 3]);
});

test('Simon and the memory chain begin with one item; clapping starts with a short pattern', () => {
  for (const junior of [true, false]) {
    assert.equal(getMemorySettings('simon', junior).startLength, 1);
    assert.equal(getMemorySettings('chain', junior).startLength, 1);
    assert.ok(getMemorySettings('clap', junior).startLength >= 2);
  }
});

test('manual playback shows each item once then hides the pattern for recall', () => {
  let state = memoryGameReducer(createMemoryState(6), { type: 'start', sequence: [0, 0, 1] });
  for (let index = 0; index < 3; index += 1) {
    state = memoryGameReducer(state, { type: 'manual-next' });
    assert.equal(state.activeIndex, index);
    assert.equal(state.phase, 'watch');
    assert.equal(memoryGameReducer(state, { type: 'answer', item: 0 }), state);
  }
  state = memoryGameReducer(state, { type: 'manual-next' });
  assert.equal(state.phase, 'input');
  assert.equal(state.activeIndex, null);
});

test('the gap between cues retains the cue text without accepting answers', () => {
  let state = memoryGameReducer(createMemoryState(6), { type: 'start', sequence: [0, 1] });
  state = memoryGameReducer(state, { type: 'show', index: 0, playbackId: state.playbackId });
  state = memoryGameReducer(state, { type: 'cue-off', playbackId: state.playbackId });
  assert.equal(state.activeIndex, 0);
  assert.equal(state.cueOn, false);
  assert.equal(memoryGameReducer(state, { type: 'answer', item: 0 }), state);
});

test('clapping can start a new longer rhythm, while chain appends the chosen item', () => {
  const success = memoryGameReducer(startRound([0]), { type: 'answer', item: 0 });
  assert.deepEqual(memoryGameReducer(success, { type: 'next', sequence: [2, 1] }).sequence, [2, 1]);
  assert.deepEqual(memoryGameReducer(success, { type: 'next', item: 2 }).sequence, [0, 2]);
});

test('playback blocks answers and ignores callbacks from an older playback', () => {
  const watching = memoryGameReducer(createMemoryState(6), { type: 'start', sequence: [0, 1] });
  assert.equal(memoryGameReducer(watching, { type: 'answer', item: 0 }), watching);
  assert.equal(memoryGameReducer(watching, { type: 'your-turn', playbackId: 0 }), watching);
  assert.equal(memoryGameReducer(watching, { type: 'show', index: 1, playbackId: 0 }), watching);
  const reset = memoryGameReducer(watching, { type: 'reset' });
  const restarted = memoryGameReducer(reset, { type: 'start', sequence: [1, 0] });
  assert.equal(memoryGameReducer(restarted, { type: 'your-turn', playbackId: watching.playbackId }), restarted);
});

test('a correct round scores exactly once and grows the existing sequence', () => {
  let state = startRound([1, 0]);
  state = memoryGameReducer(state, { type: 'answer', item: 1 });
  assert.equal(state.score, 0);
  state = memoryGameReducer(state, { type: 'answer', item: 0 });
  assert.equal(state.phase, 'success');
  assert.equal(state.score, 20);
  assert.equal(memoryGameReducer(state, { type: 'answer', item: 0 }), state);
  assert.equal(memoryGameReducer(state, { type: 'replay' }), state);
  const next = memoryGameReducer(state, { type: 'next', item: 2 });
  assert.deepEqual(next.sequence, [1, 0, 2]);
  assert.equal(next.round, 2);
  assert.equal(next.score, 20);
  assert.equal(next.phase, 'watch');
  assert.deepEqual(next.answers, []);
});

test('mistakes require replay and replay clears answers without awarding points', () => {
  let state = startRound([0, 1]);
  state = memoryGameReducer(state, { type: 'answer', item: 0 });
  state = memoryGameReducer(state, { type: 'answer', item: 0 });
  assert.equal(state.phase, 'mistake');
  assert.equal(state.score, 0);
  assert.equal(memoryGameReducer(state, { type: 'answer', item: 1 }), state);
  const retry = memoryGameReducer(state, { type: 'replay' });
  assert.equal(retry.phase, 'watch');
  assert.deepEqual(retry.answers, []);
  assert.deepEqual(retry.sequence, [0, 1]);
  assert.equal(retry.round, 1);
});

test('replaying partway through a round requires recalling the full pattern again', () => {
  let state = startRound([0, 0]);
  state = memoryGameReducer(state, { type: 'answer', item: 0 });
  state = memoryGameReducer(state, { type: 'replay' });
  state = memoryGameReducer(state, { type: 'your-turn', playbackId: state.playbackId });
  state = memoryGameReducer(state, { type: 'answer', item: 0 });
  assert.equal(state.phase, 'input');
  assert.equal(state.score, 0);
  state = memoryGameReducer(state, { type: 'answer', item: 0 });
  assert.equal(state.score, 20);
});

test('the difficulty cap ends the session and reset clears progress', () => {
  let state = startRound([2, 2], 2);
  state = memoryGameReducer(state, { type: 'answer', item: 2 });
  state = memoryGameReducer(state, { type: 'answer', item: 2 });
  assert.equal(state.phase, 'complete');
  assert.equal(memoryGameReducer(state, { type: 'next', item: 1 }), state);
  assert.equal(memoryGameReducer(state, { type: 'answer', item: 2 }), state);
  const reset = memoryGameReducer(state, { type: 'reset' });
  assert.equal(reset.phase, 'ready');
  assert.equal(reset.score, 0);
  assert.equal(reset.round, 1);
  assert.deepEqual(reset.sequence, []);
  assert.equal(reset.maxLength, 2);
});

test('pausing playback preserves progress and rejects old timers after resuming', () => {
  let state = startRound([0]);
  state = memoryGameReducer(state, { type: 'answer', item: 0 });
  state = memoryGameReducer(state, { type: 'next', item: 1 });
  const oldPlaybackId = state.playbackId;
  state = memoryGameReducer(state, { type: 'show', index: 0, playbackId: oldPlaybackId });
  state = memoryGameReducer(state, { type: 'pause' });
  assert.equal(state.phase, 'paused');
  assert.equal(state.activeIndex, null);
  assert.equal(state.score, 10);
  assert.equal(state.round, 2);
  assert.equal(memoryGameReducer(state, { type: 'answer', item: 0 }), state);
  assert.equal(memoryGameReducer(state, { type: 'your-turn', playbackId: oldPlaybackId }), state);
  state = memoryGameReducer(state, { type: 'replay' });
  assert.equal(state.phase, 'watch');
  assert.deepEqual(state.sequence, [0, 1]);
  assert.equal(memoryGameReducer(state, { type: 'show', index: 1, playbackId: oldPlaybackId }), state);
  assert.equal(memoryGameReducer(state, { type: 'your-turn', playbackId: oldPlaybackId }), state);
  state = memoryGameReducer(state, { type: 'your-turn', playbackId: state.playbackId });
  assert.equal(memoryGameReducer(state, { type: 'pause' }), state);
  state = memoryGameReducer(state, { type: 'answer', item: 0 });
  state = memoryGameReducer(state, { type: 'answer', item: 1 });
  assert.equal(state.score, 30);
});
