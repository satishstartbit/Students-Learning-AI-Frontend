/**
 * Brain Boosters - the short breaks on the Focus page (both bands): three
 * brain games and, for Grade 6+, three movement/breathing exercises. K-5's
 * "Calm & move" are the Breathe / Wiggle / Listen activities
 * (components/kid/focusActivities.js).
 *
 * Each booster opens its own page (/student/focus/games/:id or
 * /student/focus/exercises/:id - pages/BoosterPage.jsx) with "Back to Focus".
 * The games and exercises themselves are built-in content, like the K-5
 * activities: nothing here is scored for points or grades.
 *
 * `categories` are the admin-managed regulation-toolkit categories
 * (GET /regulation-toolkit/recommendation) - the check-in suggestion ("You
 * checked in feeling tense… Try Finger Follow") picks the first booster that
 * matches today's categories, in the order the server ranks them.
 */

export const BRAIN_GAMES = [
  {
    id: 'finger-follow',
    kind: 'game',
    game: 'finger',
    label: 'Finger Follow',
    icon: 'eye',
    tone: 'lavender',
    minutes: 1,
    blurb: 'Follow a moving dot with just your eyes and tap when it glows gold. A quick reset for tired or jumpy focus.',
    subtitle: 'Track the dot with only your eyes.',
    meta: 'About 1 minute · 3 short rounds',
    how: [
      'Choose Slow, Medium or Fast, then press Let’s go.',
      'Follow the moving dot with your eyes. When it glows gold, tap it once.',
      'Play three 20-second rounds. A missed glow just resets your streak.',
    ],
    tip: 'Keep your head still. Only move your eyes.',
    kidBlurb: 'Follow the dot with your eyes',
    kidSubtitle: 'Follow the dot with your eyes. Tap when it glows!',
    kidHow: ['Keep your head still, like a statue.', 'Follow the dot with just your eyes.', 'Tap it when it glows gold!'],
    kidFoot: '3 short rounds',
    categories: ['Grounding', 'Mindfulness'],
    reason: 'A quick eye game helps your brain switch gears.',
  },
  {
    id: 'balloon-eyes',
    kind: 'game',
    game: 'balloon',
    label: 'Balloon Eyes',
    icon: 'balloon',
    tone: 'pink',
    minutes: 1,
    blurb: 'Notice each balloon’s colour and pop it before it leaves the sky. Ten balloons, one at a time.',
    subtitle: 'Watch the colour. Follow the balloon. Pop!',
    meta: 'About 1 minute · 10 balloons',
    how: [
      'Start a set of ten balloons.',
      'Notice the colour and pop the balloon before it leaves the sky. Calm play has no time limit.',
      'Each balloon counts once. Three pops unlock a slightly quicker level.',
    ],
    tip: 'Say the colour out loud if you like. A miss is just a chance to try the next balloon.',
    kidBlurb: 'Watch the colour, then pop it',
    kidSubtitle: 'Watch the balloon. Pop it before it floats away!',
    kidHow: ['Look at the balloon’s colour.', 'Watch it float up the sky.', 'Pop it before it flies away!'],
    kidFoot: '10 balloons',
    categories: ['Grounding', 'Movement'],
    reason: 'Spotting one balloon at a time gives busy eyes one calm thing to do.',
  },
  {
    id: 'memory',
    kind: 'game',
    game: 'memory',
    label: 'Memory',
    icon: 'brain',
    tone: 'yellow',
    minutes: 2,
    blurb: 'Watch a pattern, then repeat it - actions, Simon-style colours or a growing list. Warms up your working memory.',
    subtitle: 'Practice remembering patterns and sequences.',
    meta: 'About 2 minutes · 3 ways to play',
    how: [
      'Choose an action pattern, a Simon-style colour sequence, or a shopping list.',
      'Watch first. When it is your turn, repeat the full sequence in order.',
      'Wrong turns just replay the pattern. Step-by-step playback lets you set the pace.',
    ],
    tip: 'Say each item quietly as it lights up - it helps it stick.',
    kidBlurb: 'Copy the light-up pattern',
    kidSubtitle: 'Watch the pattern, then copy it!',
    kidHow: ['Watch the pattern light up.', 'Wait for your turn.', 'Tap the same pattern back!'],
    kidFoot: 'Start with one - it grows!',
    categories: ['Mindfulness'],
    reason: 'A short memory game helps your brain warm up.',
  },
];

/** Grade 6+ exercises (K-5 has Breathe / Wiggle / Listen). `exercise` is the id in exerciseBreaks.js. */
export const EXERCISE_BOOSTERS = [
  {
    id: 'easy-breathing',
    kind: 'exercise',
    exercise: 'breathe',
    label: 'Easy breathing',
    icon: 'wind',
    tone: 'blue',
    minutes: 1,
    blurb: 'Breathe in for four, out for six. A quiet minute to settle in before you start.',
    subtitle: 'In for four, out for six.',
    meta: 'About 1 minute · 5 slow breaths',
    how: ['Sit comfortably and relax your shoulders.', 'Breathe in gently while the circle grows.', 'Breathe out slowly while it shrinks - five breaths in all.'],
    tip: 'Breathe at a pace that feels good. You can stop any time.',
    categories: ['Breathing', 'Calming Sounds', 'Music'],
    reason: 'Slow breathing helps your body settle.',
  },
  {
    id: 'stretch-break',
    kind: 'exercise',
    exercise: 'stretch',
    label: 'Stretch break',
    icon: 'stretch',
    tone: 'green',
    minutes: 1,
    blurb: 'Reach, roll and wiggle. A minute of gentle movement to wake your body up.',
    subtitle: 'Make a little room to move.',
    meta: 'About 1 minute · 4 easy stretches',
    how: ['Sit or stand with a little space around you.', 'Follow each stretch at your own pace.', 'Skip anything that doesn’t feel right.'],
    tip: 'Move only as far as feels comfortable. You can stay seated.',
    categories: ['Movement'],
    reason: 'A little movement wakes your body up.',
  },
  {
    id: 'cross-body-taps',
    kind: 'exercise',
    exercise: 'cross',
    label: 'Cross-body taps',
    icon: 'hand',
    tone: 'orange',
    minutes: 1,
    blurb: 'A gentle left-and-right rhythm that helps you feel steady and ready.',
    subtitle: 'A gentle left-and-right rhythm.',
    meta: 'About 1 minute · 4 steps',
    how: ['Sit comfortably with your hands on your knees.', 'Tap the opposite knee with each hand, slowly.', 'Take turns, then rest your hands in your lap.'],
    tip: 'Go slowly. There is no wrong way to do this.',
    categories: ['Grounding'],
    reason: 'Left-right taps help your brain feel steady.',
  },
];

export const ALL_BOOSTERS = [...BRAIN_GAMES, ...EXERCISE_BOOSTERS];

export const getBooster = (kind, id) => ALL_BOOSTERS.find((b) => b.kind === kind && b.id === id) ?? null;

/** Where a booster's page lives. */
export const boosterPath = (booster) => `/student/focus/${booster.kind === 'game' ? 'games' : 'exercises'}/${booster.id}`;

/**
 * The booster to suggest from today's check-in: the first of `boosters` that
 * matches the earliest of the server's ranked `categories`. Null when nothing
 * matches or there was no check-in.
 */
export function suggestBooster(categories = [], boosters = ALL_BOOSTERS) {
  for (const category of categories ?? []) {
    const match = boosters.find((b) => b.categories.includes(category));
    if (match) return match;
  }
  return null;
}
