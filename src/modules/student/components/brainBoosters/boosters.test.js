import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_BOOSTERS, BRAIN_GAMES, EXERCISE_BOOSTERS, boosterPath, getBooster, suggestBooster } from './boosters.js';

test('three brain games and three exercises, each with a page', () => {
  assert.deepEqual(BRAIN_GAMES.map((g) => g.label), ['Finger Follow', 'Balloon Eyes', 'Memory']);
  assert.equal(EXERCISE_BOOSTERS.length, 3);
  assert.equal(boosterPath(BRAIN_GAMES[0]), '/student/focus/games/finger-follow');
  assert.equal(boosterPath(EXERCISE_BOOSTERS[1]), '/student/focus/exercises/stretch-break');
  assert.equal(getBooster('game', 'memory')?.label, 'Memory');
  assert.equal(getBooster('exercise', 'memory'), null, 'kind and id must both match');
});

test('every booster has the copy both pages need', () => {
  for (const b of ALL_BOOSTERS) {
    for (const key of ['label', 'blurb', 'subtitle', 'meta', 'tip', 'reason']) assert.ok(b[key], `${b.id}.${key}`);
    assert.equal(b.how.length, 3, `${b.id} has three how-to steps`);
    assert.ok(b.categories.length > 0);
  }
  for (const g of BRAIN_GAMES) for (const key of ['kidBlurb', 'kidSubtitle', 'kidFoot']) assert.ok(g[key], `${g.id}.${key}`);
});

test('check-in suggestion: first booster matching the server’s ranked categories', () => {
  // A tense check-in ranks Breathing, then Grounding (backend MOOD_CATEGORIES).
  assert.equal(suggestBooster(['Breathing', 'Grounding'], BRAIN_GAMES)?.label, 'Finger Follow', 'games: no breathing game, so the grounding one');
  assert.equal(suggestBooster(['Breathing', 'Grounding'], EXERCISE_BOOSTERS)?.label, 'Easy breathing');
  assert.equal(suggestBooster(['Movement', 'Calming Sounds'], EXERCISE_BOOSTERS)?.label, 'Stretch break');
  assert.equal(suggestBooster(['Movement'], BRAIN_GAMES)?.label, 'Balloon Eyes');
  assert.equal(suggestBooster([], BRAIN_GAMES), null);
  assert.equal(suggestBooster(['Unknown'], ALL_BOOSTERS), null);
  assert.equal(suggestBooster(undefined), null);
});
