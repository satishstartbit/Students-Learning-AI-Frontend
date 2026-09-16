/**
 * The daily check-in answers.
 *
 * The moods themselves are no longer hardcoded here - they come from the
 * admin-editable "Emotional States" Master Management list (backend:
 * master_items, master_type='emotional_states'), loaded once by
 * TodayCheckInProvider and shared as `moods`/`moodsLoading` via
 * useTodayCheckIn(). `code` mirrors the backend (utils/constants.js -
 * CHECKIN_MOODS was the fixed set this used to be pinned to; check-ins now
 * validate against the live list in services/checkIn.service.js instead).
 *
 * The 6 moods the app shipped with still get hand-illustrated art
 * (MoodFace/MOOD_TILE, kid theme only) when an admin hasn't overridden them
 * with an uploaded icon or background colour - see LEGACY_CODES below.
 */

/** Energy is 1-5, shown as dots. */
export const ENERGY_LEVELS = [1, 2, 3, 4, 5];

/** "How much time do you have?" - Grade 6+ only; K-5 isn't asked. */
export const MINUTES_OPTIONS = [15, 30, 45, 60];

/** A mood from a fetched `moods` list by its code, or null if not found (e.g. a deactivated/renamed one). */
export const findMood = (moods, code) => moods.find((m) => m.code === code) ?? null;

/** The 6 moods this app originally shipped with - MoodFace/MOOD_TILE (kid theme) know how to draw exactly these. */
export const LEGACY_MOOD_CODES = ['calm', 'tense', 'tired', 'distracted', 'overwhelmed', 'ready_to_focus'];

/**
 * True when a mood should use the built-in illustrated art (MoodFace/
 * MOOD_TILE) rather than its admin-supplied icon/colour - one of the 6
 * legacy codes, untouched by an admin override.
 */
export const usesLegacyArt = (mood) =>
  Boolean(mood) && LEGACY_MOOD_CODES.includes(mood.code) && !mood.iconUrl && !mood.backgroundColor;

/**
 * Static name/emoji for the 6 legacy moods, for read-only summaries (Teacher/
 * Parent Progress) that show a check-in's mood without the live, admin-edited
 * Emotional States list in context - those pages aren't wrapped in
 * TodayCheckInProvider and aren't necessarily a Student/Parent session either,
 * so they can't call the /onboarding lookup findMood() above relies on. Any
 * other mood code just falls back to showing the code itself.
 */
const LEGACY_MOOD_INFO = {
  calm: { name: 'Calm', emoji: '😌' },
  tense: { name: 'Tense', emoji: '😬' },
  tired: { name: 'Tired', emoji: '😴' },
  distracted: { name: 'Distracted', emoji: '😵‍💫' },
  overwhelmed: { name: 'Overwhelmed', emoji: '😩' },
  ready_to_focus: { name: 'Ready to focus', emoji: '🙂' },
};

export const describeMood = (code) => LEGACY_MOOD_INFO[code] ?? { name: code, emoji: null };
