import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISE_BOOSTERS } from '../brainBoosters/boosters.js';
import { exerciseMedia, groupExercises, illustrationFor, minutesLabel, pickSuggestion, toneOf } from './exerciseGroups.js';

// The six starter Regulation Activities (seeders/masterData), as GET /regulation-toolkit sends them.
const tool = (id, name, category, toolType, minutes, mediaUrl = null) => ({ id, name, category, toolType, durationMinutes: minutes, description: `${name}.`, mediaUrl });
const TOOLKIT = [
  { category: 'Breathing', tools: [tool('t1', 'Box Breathing', 'Breathing', 'breathing', 3)] },
  { category: 'Grounding', tools: [tool('t2', '5-4-3-2-1 Grounding', 'Grounding', 'grounding', 5)] },
  { category: 'Movement', tools: [tool('t3', 'Quick Stretch Break', 'Movement', 'movement', 5)] },
  { category: 'Calming Sounds', tools: [tool('t4', 'Rain Sounds', 'Calming Sounds', 'calming_sounds', 10)] },
  { category: 'Music', tools: [tool('t5', 'Focus Music', 'Music', 'music', 20)] },
  { category: 'Mindfulness', tools: [tool('t6', 'Mindful Minute', 'Mindfulness', 'mindfulness', 1)] },
];

test('the five mockup tiles, in order, admin exercises first', () => {
  const groups = groupExercises(TOOLKIT, EXERCISE_BOOSTERS);
  assert.deepEqual(groups.map((g) => g.label), ['Breathing', 'Grounding', 'Movement', 'Sound', 'Mindfulness']);
  assert.deepEqual(groups[0].exercises.map((e) => e.name), ['Box Breathing', 'Easy breathing']);
  assert.deepEqual(groups[1].exercises.map((e) => e.name), ['5-4-3-2-1 Grounding', 'Cross-body taps']);
  assert.deepEqual(groups[2].exercises.map((e) => e.name), ['Quick Stretch Break', 'Stretch break']);
  assert.deepEqual(groups[3].exercises.map((e) => e.name), ['Rain Sounds', 'Focus Music'], 'Calming Sounds and Music share Sound');
  assert.deepEqual(groups[4].exercises.map((e) => e.name), ['Mindful Minute']);
  assert.equal(groups[0].noun, 'breathing exercise');
  assert.ok(groups.every((g) => !('match' in g)), 'no regex leaks into the tiles');
});

test('a category no group knows gets its own tile; empty groups are left out', () => {
  const groups = groupExercises([{ category: 'Gratitude', tools: [tool('g1', 'Three good things', 'Gratitude', 'journal', 2)] }], []);
  assert.deepEqual(groups.map((g) => [g.label, g.noun, g.exercises.length]), [['Gratitude', 'exercise', 1]]);
  assert.deepEqual(groupExercises([], []), []);
  assert.deepEqual(groupExercises(null, EXERCISE_BOOSTERS).map((g) => g.label), ['Breathing', 'Grounding', 'Movement'], 'built-ins alone if the toolkit fails');
});

test('the type places an exercise whose category is unknown', () => {
  const groups = groupExercises([{ category: 'Other', tools: [tool('x', 'Belly breaths', null, 'breathing', 2)] }], []);
  assert.deepEqual(groups.map((g) => g.label), ['Breathing']);
});

test("today's suggestion: the server's tool, else the earliest ranked category", () => {
  const groups = groupExercises(TOOLKIT, EXERCISE_BOOSTERS);
  const box = pickSuggestion(groups, { tool: { id: 't1' }, categories: ['Breathing', 'Grounding'] });
  assert.deepEqual([box.group, box.index, box.exercise.name], ['breathing', 0, 'Box Breathing']);
  const fallback = pickSuggestion(groups, { tool: { id: 'gone' }, categories: ['Grounding'] });
  assert.equal(fallback.exercise.name, '5-4-3-2-1 Grounding');
  assert.equal(pickSuggestion(groups, { categories: ['Nope'] }), null);
  assert.equal(pickSuggestion([], { tool: { id: 't1' } }), null);
});

test("an exercise keeps its tile's colour wherever it is shown", () => {
  const groups = groupExercises(TOOLKIT, EXERCISE_BOOSTERS);
  for (const g of groups) for (const e of g.exercises) assert.equal(toneOf(e), g.tone, `${e.name} in ${g.label}`);
  assert.equal(toneOf({ name: 'Cross-body taps', toolType: 'cross', category: 'Grounding' }), 'green');
  assert.equal(toneOf({ name: 'Three good things', toolType: 'journal', category: 'Gratitude' }), 'pink');
});

test('minutes read naturally', () => {
  assert.equal(minutesLabel(1), '1 minute');
  assert.equal(minutesLabel(3), '3 minutes');
  assert.equal(minutesLabel(null), null);
  assert.equal(minutesLabel(0), null);
});

test('media links: YouTube and Vimeo embed, files by type, anything else is not played', () => {
  const yt = 'https://www.youtube-nocookie.com/embed/tEmt1Znux58?rel=0&playsinline=1';
  assert.deepEqual(exerciseMedia('https://www.youtube.com/watch?v=tEmt1Znux58&t=10'), { kind: 'youtube', src: yt });
  assert.deepEqual(exerciseMedia('https://youtu.be/tEmt1Znux58'), { kind: 'youtube', src: yt });
  assert.deepEqual(exerciseMedia('https://youtube.com/shorts/tEmt1Znux58'), { kind: 'youtube', src: yt });
  assert.deepEqual(exerciseMedia('https://m.youtube.com/embed/tEmt1Znux58'), { kind: 'youtube', src: yt });
  assert.equal(exerciseMedia('https://www.youtube.com/watch?v=short').kind, 'link', 'a bad id is not embedded');
  assert.deepEqual(exerciseMedia('https://vimeo.com/76979871'), { kind: 'vimeo', src: 'https://player.vimeo.com/video/76979871?dnt=1' });
  assert.deepEqual(exerciseMedia('https://cdn.example.com/box.MP4?sig=1'), { kind: 'video', src: 'https://cdn.example.com/box.MP4?sig=1' });
  assert.equal(exerciseMedia('https://cdn.example.com/box-breathing.webp').kind, 'image');
  assert.equal(exerciseMedia('https://cdn.example.com/rain.mp3').kind, 'audio');
  assert.equal(exerciseMedia('https://open.spotify.com/track/1').kind, 'link');
  assert.equal(exerciseMedia('javascript:alert(1)').kind, 'none');
  assert.equal(exerciseMedia('data:video/mp4;base64,AAAA').kind, 'none');
  assert.equal(exerciseMedia('not a url').kind, 'none');
  assert.equal(exerciseMedia('').kind, 'none');
  assert.equal(exerciseMedia(null).kind, 'none');
});

test('every exercise gets a picture that explains it', () => {
  const groups = groupExercises(TOOLKIT, EXERCISE_BOOSTERS);
  const pictures = Object.fromEntries(groups.flatMap((g) => g.exercises).map((e) => [e.name, illustrationFor(e)]));
  assert.deepEqual(pictures, {
    'Box Breathing': 'box',
    'Easy breathing': 'breath',
    '5-4-3-2-1 Grounding': 'senses',
    'Cross-body taps': 'taps',
    'Quick Stretch Break': 'stretch',
    'Stretch break': 'stretch',
    'Rain Sounds': 'rain',
    'Focus Music': 'music',
    'Mindful Minute': 'mindful',
  });
  assert.equal(illustrationFor({ name: 'Three good things', toolType: 'journal', category: 'Gratitude' }), 'default');
});
