import test from 'node:test';
import assert from 'node:assert/strict';
import { MASTER_GUIDES, guideFor, keyLabel, masterKeyFromPath } from './masterGuides.js';

// Every master page reachable from Master Management or Billing (generic codes and dedicated slugs).
const MASTERS = [
  'subjects', 'grade_levels', 'academic-years', 'schools',
  'task-types', 'curriculum-subjects', 'topics', 'audio-tracks', 'question-types',
  'assignment_types',
  'focus_duration', 'study_time', 'challenge_areas', 'strength_areas', 'interest_categories', 'activity_categories',
  'emotional_states', 'difficulty_categories', 'difficulty_reasons', 'support_strategies',
  'regulation-activities', 'reward-activities', 'student-rewards', 'avatars',
  'subscription-plans', 'discount-codes',
];

test('every master page has a guide', () => {
  for (const key of MASTERS) assert.ok(guideFor(key), `no guide for ${key}`);
});

test('each guide: a summary, places with role + page + address, and related masters that exist', () => {
  for (const [key, guide] of Object.entries(MASTER_GUIDES)) {
    assert.ok(guide.summary?.length > 20, `${key}: summary`);
    assert.ok(Array.isArray(guide.usedIn), `${key}: usedIn`);
    if (key !== 'schools') assert.ok(guide.usedIn.length > 0, `${key}: at least one place`);
    for (const place of guide.usedIn) {
      assert.ok(place.role && place.page && place.how, `${key}: place fields`);
      assert.match(place.path, /^\/(student|parent|teacher|admin)\b/, `${key}: ${place.path}`);
    }
    for (const rel of guide.related ?? []) assert.ok(MASTER_GUIDES[rel], `${key}: related ${rel} has no guide`);
    assert.ok(guide.api?.admin?.includes('/api/v1/admin/master/'), `${key}: admin API`);
  }
});

test('the page address names the master', () => {
  assert.equal(masterKeyFromPath('/admin/masters/focus_duration'), 'focus_duration');
  assert.equal(masterKeyFromPath('/admin/masters/task-types'), 'task-types');
  assert.equal(masterKeyFromPath('/admin/masters'), null);
  assert.equal(masterKeyFromPath('/admin/users'), null);
  assert.equal(guideFor('nope'), null);
  assert.equal(keyLabel('task-types'), 'Task types');
});
