import test from 'node:test';
import assert from 'node:assert/strict';
import { activityLine, alertLine, attentionLine, listWords, mostCommonWeekdayKey, numberWord } from './overviewText.js';

// Stand-ins for the utils/date formatters the page passes.
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const weekdayOf = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return WEEKDAYS[(new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7];
};
const fmt = {
  firstName: 'Sanjay',
  weekday: weekdayOf,
  weekdayPlural: (key) => `${weekdayOf(key)}s`,
  day: (key) => `day:${key}`,
  due: (key, daysLeft) => (daysLeft === 1 ? 'Due tomorrow' : `Due ${key}`),
  sent: (at) => `sent:${at.slice(0, 10)}`,
  ago: () => '2h ago',
  when: () => 'Today, 8:40 a.m.',
  single: () => 'Felt tense at this morning’s check-in',
};

test('numberWord and listWords', () => {
  assert.equal(numberWord(2), 'two');
  assert.equal(numberWord(14), '14');
  assert.equal(listWords(['Sunday']), 'Sunday');
  assert.equal(listWords(['Sunday', 'Monday']), 'Sunday and Monday');
  assert.equal(listWords(['Fri', 'Sat', 'Sun']), 'Fri, Sat and Sun');
});

test('alertLine: days in a row, else the single check-in line', () => {
  const alert = { moodName: 'Tense', days: ['2026-09-20', '2026-09-21'] };
  assert.equal(alertLine(alert, fmt), 'Felt tense two days in a row · Sunday and Monday');
  assert.equal(alertLine({ ...alert, days: ['2026-09-21'] }, fmt), 'Felt tense at this morning’s check-in');
  assert.equal(alertLine({ ...alert, days: [] }, fmt), 'Felt tense at this morning’s check-in');
});

test('mostCommonWeekdayKey: only a clear winner with two or more days', () => {
  // Thu 10, Thu 17, Mon 14
  assert.equal(weekdayOf(mostCommonWeekdayKey(['2026-09-10', '2026-09-14', '2026-09-17'])), 'Thursday');
  assert.equal(mostCommonWeekdayKey(['2026-09-10', '2026-09-14', '2026-09-15']), null, 'no repeats');
  assert.equal(mostCommonWeekdayKey(['2026-09-10', '2026-09-17', '2026-09-14', '2026-09-21']), null, 'a tie');
  assert.equal(mostCommonWeekdayKey([]), null);
});

test('attentionLine: work items', () => {
  assert.deepEqual(attentionLine({ kind: 'not_started', title: 'Fractions practice set', dueDate: '2026-09-25', daysLeft: 3 }, fmt), {
    title: 'Fractions practice set not started',
    meta: 'Due 2026-09-25',
    to: '/parent/progress',
  });
  assert.equal(
    attentionLine({ kind: 'overdue', title: 'Spelling list', subject: 'English', dueDate: '2026-09-18' }, fmt).meta,
    'English · Was due day:2026-09-18'
  );
  assert.equal(attentionLine({ kind: 'returned', title: 'Map quiz', subject: null, dueDate: null }, fmt).title, 'Map quiz was sent back to fix');
});

test('attentionLine: the child, check-ins and invitations', () => {
  assert.equal(attentionLine({ kind: 'not_signed_in' }, fmt).title, "Sanjay hasn't signed in yet");
  assert.equal(attentionLine({ kind: 'not_signed_in' }, fmt).to, '/parent/children');
  assert.equal(attentionLine({ kind: 'missed_checkins', missed: 3 }, fmt).title, 'Missed 3 check-ins');

  const low = attentionLine({ kind: 'low_energy', count: 3, days: 14, dates: ['2026-09-10', '2026-09-14', '2026-09-17'] }, fmt);
  assert.equal(low.title, '3 low-energy days');
  assert.equal(low.meta, 'In the last 14 days, mostly Thursdays');
  assert.equal(
    attentionLine({ kind: 'low_energy', count: 3, days: 14, dates: ['2026-09-10', '2026-09-14', '2026-09-15'] }, fmt).meta,
    'In the last 14 days'
  );

  const pending = attentionLine(
    { kind: 'invitation_pending', teacherName: 'Ms Lee', subjects: ['Science'], sentAt: '2026-09-19T15:00:00Z', sentByMe: true },
    fmt
  );
  assert.deepEqual(pending, { title: "Ms Lee hasn't accepted your invite", meta: 'Science · Sent sent:2026-09-19', to: '/parent/children' });
  assert.equal(
    attentionLine({ kind: 'invitation_pending', teacherName: 'Ms Lee', subjects: [], sentAt: null, sentByMe: false }, fmt).title,
    "Ms Lee hasn't accepted the invite"
  );
  assert.equal(
    attentionLine({ kind: 'invitation_expired', teacherName: 'Mr Roy', subjects: ['Art'], sentAt: '2026-09-01T09:00:00Z', sentByMe: true, canResend: true }, fmt).meta,
    'Art · Sent sent:2026-09-01 · You can send it again'
  );
});

test('activityLine: one child, no name in front', () => {
  assert.deepEqual(
    activityLine({ type: 'submitted', assignment: { title: 'Reading log, ch. 3' }, review: { returned: false, score: 80 } }, fmt),
    { title: 'Handed in Reading log, ch. 3', meta: 'Marked 80/100 · 2h ago' }
  );
  assert.equal(activityLine({ type: 'submitted', assignment: { title: 'X' }, review: { returned: true, score: null } }, fmt).meta, 'Sent back to fix · 2h ago');
  assert.equal(activityLine({ type: 'submitted', assignment: { title: 'X' }, review: null }, fmt).meta, '2h ago');
  assert.equal(activityLine({ type: 'focus', minutes: 25 }, fmt).title, 'Finished a 25 min focus session');
  assert.deepEqual(activityLine({ type: 'checkin', moodName: 'Calm & ready' }, fmt), {
    title: 'Checked in feeling calm & ready',
    meta: 'Today, 8:40 a.m.',
  });
  assert.equal(activityLine({ type: 'reward', reward: { name: 'Bookworm', type: 'sticker' } }, fmt).title, 'Earned the Bookworm sticker');
});
