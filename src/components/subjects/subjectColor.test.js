import test from 'node:test';
import assert from 'node:assert/strict';
import { colorMapFrom, inkFor, luminance, normalizeHex, subjectKey, subjectPaint } from './subjectColor.js';

test('subject keys ignore case and extra spaces (same rule as the backend)', () => {
  assert.equal(subjectKey('  Social   Studies '), 'social studies');
  assert.equal(subjectKey(null), '');
});

test('colours are normalised to #RRGGBB or rejected', () => {
  assert.equal(normalizeHex('72a9d7'), '#72A9D7');
  assert.equal(normalizeHex('#f2ce68'), '#F2CE68');
  assert.equal(normalizeHex('blue'), null);
  assert.equal(normalizeHex('#abc'), null);
});

test('text on a subject colour: dark ink on the pastel defaults, white ink on a dark colour', () => {
  for (const hex of ['#F2CE68', '#72A9D7', '#86B878', '#B39AD4', '#F09A8A', '#9AA7E0']) assert.equal(inkFor(hex), 'dark', hex);
  assert.equal(inkFor('#1E3A8A'), 'light');
  assert.equal(inkFor('#000000'), 'light');
  assert.equal(inkFor('not a colour'), 'dark');
  assert.ok(Math.abs(luminance('#FFFFFF') - 1) < 1e-9);
});

test('a colour map keeps the first colour per subject', () => {
  const map = colorMapFrom([
    { name: 'Science', color: '#72a9d7' },
    { key: 'science', color: '#000000' },
    { name: 'Art', color: 'nope' },
  ]);
  assert.equal(map.get('science'), '#72A9D7');
  assert.equal(map.has('art'), false);
});

test('paint props: a CSS variable and the ink, or nothing', () => {
  assert.deepEqual(subjectPaint('#72a9d7'), { style: { '--subject-color': '#72A9D7' }, 'data-subject-color': '', 'data-ink': 'dark' });
  assert.deepEqual(subjectPaint(null), {});
});
