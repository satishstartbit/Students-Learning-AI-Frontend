import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CANADIAN_TIMEZONES, toCanadianTimezone } from './canadianTimezone.js';

const NOW = new Date('2026-09-29T12:00:00Z');
const to = (zone) => toCanadianTimezone(zone, 'America/Toronto', NOW);

test('every Canadian zone on the list stays as it is', () => {
  for (const { value } of CANADIAN_TIMEZONES) assert.equal(to(value), value);
});

test('other Canadian zones map to the listed zone with the same clock', () => {
  assert.equal(to('America/Moncton'), 'America/Halifax');
  assert.equal(to('America/Glace_Bay'), 'America/Halifax');
  assert.equal(to('America/Iqaluit'), 'America/Toronto');
  assert.equal(to('America/Rankin_Inlet'), 'America/Winnipeg');
  assert.equal(to('America/Swift_Current'), 'America/Regina');
  assert.equal(to('America/Inuvik'), 'America/Edmonton');
  assert.equal(to('America/Dawson_Creek'), 'America/Whitehorse');
});

test('a US zone reported for a Canadian city maps to its Canadian twin', () => {
  assert.equal(to('America/New_York'), 'America/Toronto');
  assert.equal(to('America/Chicago'), 'America/Winnipeg');
  assert.equal(to('America/Denver'), 'America/Edmonton');
  assert.equal(to('America/Los_Angeles'), 'America/Vancouver');
  assert.equal(to('America/Phoenix'), 'America/Whitehorse');
});

test('a device outside North America, or no zone at all, gets the default', () => {
  assert.equal(to('Asia/Kolkata'), 'America/Toronto');
  assert.equal(to('Europe/London'), 'America/Toronto');
  assert.equal(to('UTC'), 'America/Toronto');
  assert.equal(to(undefined), 'America/Toronto');
  assert.equal(to(''), 'America/Toronto');
  assert.equal(to('EST'), 'America/Toronto');
  assert.equal(to('Not/AZone'), 'America/Toronto');
});

test('the fallback is whatever the app default is', () => {
  assert.equal(toCanadianTimezone('Asia/Kolkata', 'America/Vancouver', NOW), 'America/Vancouver');
});
