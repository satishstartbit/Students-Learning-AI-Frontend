/*
 * Wording for the parent's Overview (/parent), one child at a time. Pure:
 * the backend sends facts (GET /parent/children/:id/overview) and these
 * turn them into lines. Dates come in already formatted through the `fmt`
 * functions the page passes (utils/date.js, the parent's own locale), so
 * this file never formats a date itself and can be tested in plain node.
 */

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** 2 -> "two", 14 -> "14". */
export const numberWord = (n) => (n >= 0 && n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : String(n));

export const lowerFirst = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "Sunday and Monday" / "Friday, Saturday and Sunday". */
export function listWords(words) {
  const list = words.filter(Boolean);
  if (list.length <= 1) return list[0] ?? '';
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

/** 0 = Monday ... 6 = Sunday, for a "YYYY-MM-DD" key. */
function weekdayOf(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/**
 * The weekday most of these days fall on, when one clearly does (at least
 * two of them, and more than any other weekday). Returns one of the keys, so
 * the caller can name its weekday; null when there's no clear one.
 */
export function mostCommonWeekdayKey(dates = []) {
  const byDay = new Map();
  for (const key of dates) {
    const day = weekdayOf(key);
    const entry = byDay.get(day) ?? { count: 0, key };
    entry.count += 1;
    byDay.set(day, entry);
  }
  const ranked = [...byDay.values()].sort((a, b) => b.count - a.count);
  if (!ranked.length || ranked[0].count < 2) return null;
  if (ranked[1] && ranked[1].count === ranked[0].count) return null;
  return ranked[0].key;
}

/**
 * The line under a wellbeing alert.
 *   two or more days in a row: "Felt tense two days in a row · Sunday and Monday"
 *   otherwise: fmt.single() - "Felt tense at this morning's check-in · Today, 8:40 a.m."
 *
 * fmt: { weekday(key) -> "Sunday", single() -> string }
 */
export function alertLine(alert, fmt) {
  const days = alert?.days ?? [];
  const mood = lowerFirst(alert?.moodName ?? 'unsettled');
  if (days.length >= 2) {
    return `Felt ${mood} ${numberWord(days.length)} days in a row · ${listWords(days.map((d) => fmt.weekday(d)))}`;
  }
  return fmt.single();
}

const subjectsText = (subjects = []) => subjects.filter(Boolean).join(', ');

/**
 * One "Needs your attention" line: { title, meta, to }.
 *
 * fmt: {
 *   firstName,
 *   due(dateKey, daysLeft) -> "Due Fri, Sep 25" / "Due tomorrow",
 *   day(dateKey)           -> "Fri, Sep 18",
 *   sent(instant)          -> "Sep 19",
 *   weekdayPlural(dateKey) -> "Thursdays",
 * }
 */
export function attentionLine(item, fmt) {
  const progress = '/parent/progress';
  const children = '/parent/children';
  const teacher = item.teacherName ?? 'The teacher';
  const invite = item.sentByMe ? 'your invite' : 'the invite';
  const sentMeta = [subjectsText(item.subjects), item.sentAt ? `Sent ${fmt.sent(item.sentAt)}` : null].filter(Boolean).join(' · ');

  switch (item.kind) {
    case 'overdue':
      return {
        title: `${item.title} is overdue`,
        meta: [item.subject, item.dueDate ? `Was due ${fmt.day(item.dueDate)}` : null].filter(Boolean).join(' · '),
        to: progress,
      };
    case 'returned':
      return {
        title: `${item.title} was sent back to fix`,
        meta: [item.subject, item.dueDate ? fmt.due(item.dueDate, item.daysLeft) : null].filter(Boolean).join(' · '),
        to: progress,
      };
    case 'not_started':
      return { title: `${item.title} not started`, meta: fmt.due(item.dueDate, item.daysLeft), to: progress };
    case 'not_signed_in':
      return {
        title: `${fmt.firstName ?? 'Your child'} hasn't signed in yet`,
        meta: 'Their username and password are on My Children',
        to: children,
      };
    case 'missed_checkins':
      return { title: `Missed ${plural(item.missed, 'check-in')}`, meta: 'School days in the last week', to: progress };
    case 'low_energy': {
      const mostly = mostCommonWeekdayKey(item.dates);
      return {
        title: `${item.count} low-energy days`,
        meta: `In the last ${item.days} days${mostly ? `, mostly ${fmt.weekdayPlural(mostly)}` : ''}`,
        to: progress,
      };
    }
    case 'invitation_pending':
      return { title: `${teacher} hasn't accepted ${invite}`, meta: sentMeta, to: children };
    case 'invitation_expired':
      return {
        title: `${item.sentByMe ? 'Your' : 'The'} invite to ${item.teacherName ?? 'a teacher'} expired`,
        meta: [sentMeta, item.canResend ? 'You can send it again' : null].filter(Boolean).join(' · '),
        to: children,
      };
    default:
      return { title: item.title ?? 'Something to look at', meta: '', to: progress };
  }
}

/**
 * One "Recent activity" line for the child being viewed: { title, meta }.
 *
 * fmt: { ago(instant) -> "2h ago", when(instant) -> "Today, 8:40 a.m." }
 */
export function activityLine(item, fmt) {
  switch (item.type) {
    case 'submitted': {
      const review = item.review;
      let result = null;
      if (review?.returned) result = 'Sent back to fix';
      else if (review) result = review.score !== null && review.score !== undefined ? `Marked ${review.score}/100` : 'Marked';
      return {
        title: `Handed in ${item.assignment?.title ?? 'their work'}`,
        meta: [result, fmt.ago(item.at)].filter(Boolean).join(' · '),
      };
    }
    case 'focus':
      return {
        title: item.minutes ? `Finished a ${item.minutes} min focus session` : 'Finished a focus session',
        meta: fmt.ago(item.at),
      };
    case 'checkin':
      return { title: `Checked in feeling ${lowerFirst(item.moodName)}`, meta: fmt.when(item.at) };
    case 'reward': {
      const kind = item.reward?.type === 'emoji' ? 'emoji' : item.reward?.type === 'sticker' ? 'sticker' : 'reward';
      return { title: `Earned the ${item.reward?.name ?? 'new'} ${kind}`, meta: fmt.ago(item.at) };
    }
    default:
      return { title: 'Did something new', meta: fmt.ago(item.at) };
  }
}
