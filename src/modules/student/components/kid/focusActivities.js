import { LuArrowDown, LuArrowUp, LuMusic2, LuRefreshCw, LuWind, LuZap } from 'react-icons/lu';

/**
 * The three K-5 calming activities, shared by the Focus page's tiles and the
 * activity screens they open.
 *
 * `categories` points at the real admin-managed regulation-toolkit categories
 * (GET /regulation-toolkit) so the Focus page can still badge a tile with the
 * mood-based "Try this" suggestion - "Calming Sounds" and "Music" both read as
 * "Listen" here, the same way they read as one "Sound" tab for Grade 6+.
 *
 * The choreography below (breath pattern, moves, sounds, "How to do it"
 * steps) is deliberately local content, not API data: regulation_tools stores
 * one free-text `instructions` blob per tool and nothing that could drive a
 * guided, counted exercise. Giving these to an admin to author needs a
 * backend model for steps/moves/sounds first.
 */

/** In for 4, out for 6 - a longer out-breath is the part that settles a body down. */
const BREATHE = {
  key: 'breathe',
  label: 'Breathe',
  blurb: 'In and out, nice and slow.',
  tone: 'sky',
  icon: LuWind,
  categories: ['Breathing'],
  steps: [
    'Sit up tall and put your hands on your tummy.',
    'Breathe in while the circle grows.',
    'Breathe out while it shrinks.',
  ],
  quitLabel: 'Stop',
  breaths: 5,
  phases: [
    { key: 'in', label: 'Breathe in', seconds: 4 },
    { key: 'out', label: 'Breathe out', seconds: 6 },
  ],
};

const WIGGLE = {
  key: 'wiggle',
  label: 'Wiggle',
  blurb: 'Shake the fidgets out.',
  tone: 'green',
  icon: LuZap,
  categories: ['Movement'],
  steps: ['Stand up and make some space.', 'Do each move with the picture.', 'Tap I feel better when you are ready.'],
  quitLabel: 'Skip this move',
  moves: [
    { name: 'Reach up high', count: '10 times', seconds: 20, icon: LuArrowUp },
    { name: 'Shake your hands', count: '10 times', seconds: 20, icon: LuZap },
    { name: 'Twist side to side', count: '10 times', seconds: 20, icon: LuRefreshCw },
    { name: 'Touch your toes', count: '5 times', seconds: 20, icon: LuArrowDown },
  ],
};

/** The same calm audio the app already ships for task background sound (public/audio). */
const LISTEN = {
  key: 'listen',
  label: 'Listen',
  blurb: 'Quiet sounds to help you settle.',
  tone: 'pink',
  icon: LuMusic2,
  categories: ['Calming Sounds', 'Music'],
  steps: [
    'Get comfy and close your eyes if you like.',
    'Listen to the sound all the way through.',
    'Notice how your body feels.',
  ],
  quitLabel: 'Pick another sound',
  seconds: 120,
  sounds: [
    { name: 'Gentle rain', src: '/audio/soft-rain.wav' },
    { name: 'Ocean waves', src: '/audio/ocean-waves.wav' },
    { name: 'Calm tones', src: '/audio/calm-tones.wav' },
  ],
};

export const FOCUS_ACTIVITIES = [BREATHE, WIGGLE, LISTEN];

export const getFocusActivity = (key) => FOCUS_ACTIVITIES.find((a) => a.key === key) ?? null;

/** How long one run of an activity takes, straight from its own choreography. */
export function activitySeconds(activity) {
  if (activity.key === 'breathe') {
    return activity.breaths * activity.phases.reduce((total, p) => total + p.seconds, 0);
  }
  if (activity.key === 'wiggle') {
    return activity.moves.reduce((total, m) => total + m.seconds, 0);
  }
  return activity.seconds;
}
