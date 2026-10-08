/**
 * Labels for the onboarding answers that have no Master Management list.
 *
 * The `value` keys mirror the backend's ONBOARDING_OPTIONS
 * (utils/constants.js), which is what's validated and stored. `kidLabel` is
 * the K-4 wording where it differs.
 */

export const FOCUS_HELPERS = [
  { value: 'quiet_space', label: 'A quiet space', emoji: '🤫' },
  { value: 'music', label: 'Music or background sound', kidLabel: 'Music', emoji: '🎧' },
  { value: 'short_breaks', label: 'Short breaks', emoji: '⏸️' },
  { value: 'checklist', label: 'A checklist', emoji: '✅' },
  { value: 'timer', label: 'A timer', emoji: '⏲️' },
  { value: 'movement_breaks', label: 'Moving around', emoji: '🤸' },
  { value: 'snack_or_water', label: 'A snack or water', emoji: '🍎' },
  { value: 'someone_nearby', label: 'Someone nearby', emoji: '🧑‍🤝‍🧑' },
];

export const DISTRACTIONS = [
  { value: 'phone_or_tablet', label: 'My phone or tablet', emoji: '📱' },
  { value: 'noise', label: 'Noise', emoji: '🔊' },
  { value: 'other_people', label: 'Other people', emoji: '👥' },
  { value: 'games_or_videos', label: 'Games or videos', emoji: '🎮' },
  { value: 'hungry_or_tired', label: 'Feeling hungry or tired', emoji: '🥱' },
  { value: 'hard_to_start', label: 'Getting started is hard', emoji: '🧱' },
  { value: 'other_thoughts', label: 'Thinking about other things', emoji: '💭' },
];

export const WORK_WITH = [
  { value: 'alone', label: 'On my own', emoji: '🙋' },
  { value: 'partner', label: 'With a partner', kidLabel: 'With a friend', emoji: '👫' },
  { value: 'group', label: 'In a group', emoji: '👨‍👩‍👧' },
  { value: 'mix', label: 'A mix', kidLabel: 'All of them!', emoji: '🔀' },
];

export const LEARN_BEST_BY = [
  { value: 'seeing', label: 'Seeing - pictures, diagrams, videos', kidLabel: 'Looking', emoji: '👀' },
  { value: 'listening', label: 'Listening - someone explaining', kidLabel: 'Listening', emoji: '👂' },
  { value: 'doing', label: 'Doing - hands-on, trying it out', kidLabel: 'Doing', emoji: '✋' },
  { value: 'reading', label: 'Reading - notes or a textbook', kidLabel: 'Reading', emoji: '📖' },
];

export const TASK_APPROACH = [
  { value: 'small_steps', label: 'Break it into small steps' },
  { value: 'all_at_once', label: 'Do it all in one go' },
  { value: 'checklist', label: 'Make a checklist first' },
  { value: 'examples_first', label: 'See an example first' },
];

export const HOMEWORK_HELPERS = [
  { value: 'parent_guardian', label: 'Me, or another parent or guardian' },
  { value: 'sibling', label: 'A brother or sister' },
  { value: 'grandparent_relative', label: 'A grandparent or other relative' },
  { value: 'tutor', label: 'A tutor' },
  { value: 'after_school_program', label: 'An after-school program' },
  { value: 'works_independently', label: 'They mostly work on their own' },
];

/** { value, label } for a common-component option list. */
export const asOptions = (list, { kid = false } = {}) =>
  list.map((o) => ({ value: o.value, label: (kid && o.kidLabel) || o.label, emoji: o.emoji }));
