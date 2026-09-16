/**
 * The daily check-in answers.
 *
 * `value` codes mirror the backend (utils/constants.js#CHECKIN_MOODS, also a
 * database CHECK constraint) - change both together. `label` is the Grade 6+
 * wording; `kidLabel`/`kidFeeling` say the same thing for a K-5 reader.
 */
export const MOODS = [
  { value: 'calm', label: 'Calm', emoji: '😌', kidLabel: 'Calm', kidFeeling: 'Feeling calm' },
  { value: 'tense', label: 'Tense', emoji: '😬', kidLabel: 'Worried', kidFeeling: 'Feeling worried' },
  { value: 'tired', label: 'Tired', emoji: '😴', kidLabel: 'Sleepy', kidFeeling: 'Feeling sleepy' },
  { value: 'distracted', label: 'Distracted', emoji: '😵‍💫', kidLabel: 'Wiggly', kidFeeling: 'Feeling wiggly' },
  { value: 'overwhelmed', label: 'Overwhelmed', emoji: '😩', kidLabel: 'Too much', kidFeeling: 'It all feels like too much' },
  { value: 'ready_to_focus', label: 'Ready to focus', emoji: '🙂', kidLabel: 'Ready!', kidFeeling: 'Ready to go!' },
];

/** Energy is 1-5, shown as dots. */
export const ENERGY_LEVELS = [1, 2, 3, 4, 5];

/** "How much time do you have?" - Grade 6+ only; K-5 students aren't asked. */
export const MINUTES_OPTIONS = [15, 30, 45, 60];

export const findMood = (value) => MOODS.find((m) => m.value === value) ?? null;
