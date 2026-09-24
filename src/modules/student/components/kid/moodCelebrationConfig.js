/**
 * How each mood is celebrated after a check-in: the big emoji, the colour the
 * ring and tint take, what drifts or bursts around it, and the line the
 * student reads.
 *
 * One object, so adding or rewording a mood is a single edit here.
 *
 * Keys are the check-in mood codes (the `code` of an Emotional States master
 * item - what a check-in actually saves). Moods are admin-editable, so:
 *
 *   - a code with no entry falls back to `calm`, and
 *   - the emoji and the name shown come from the mood's own master row when
 *     it has them, which is why an admin can add "Proud" tomorrow and get a
 *     sensible celebration with no code change.
 *
 * `tone` decides the movement: `burst` throws particles outward and keeps the
 * emoji bouncing; `soft` drifts them upward and lets it breathe. Nothing
 * confetti-like fires for the heavy moods - a child who said they feel sad
 * should not be met with a party.
 */
export const MOOD_CELEBRATIONS = {
  calm: {
    emoji: '🪷',
    color: '#5E9E7E',
    particle: '🌸',
    tone: 'soft',
    message: 'Calm minds do great work.',
  },
  ready: {
    emoji: '🚀',
    color: '#C2185B',
    particle: '✨',
    tone: 'burst',
    message: "You're ready to take on today!",
  },
  happy: {
    emoji: '😄',
    color: '#E0A100',
    particle: '⭐',
    tone: 'burst',
    message: 'Your smile is going to power your day!',
  },
  excited: {
    emoji: '🤩',
    color: '#E8590C',
    particle: '🎉',
    tone: 'burst',
    message: "Let's use that energy on something great!",
  },
  tired: {
    emoji: '😴',
    color: '#6C7BC4',
    particle: '💤',
    tone: 'soft',
    message: 'Small steps still count today.',
  },
  sad: {
    emoji: '😢',
    color: '#4A8FC9',
    particle: '💙',
    tone: 'soft',
    message: "It's okay to feel this way. We'll go gently.",
  },
  worried: {
    emoji: '😟',
    color: '#8A6FC4',
    particle: '🫧',
    tone: 'soft',
    message: "One thing at a time. You've got this.",
  },
  frustrated: {
    emoji: '😤',
    color: '#C0563A',
    particle: '🍃',
    tone: 'soft',
    message: "Let's take a deep breath first.",
  },
};

/**
 * The codes this app seeds (utils/constants + the Emotional States master)
 * don't all match the names above, so each one points at the celebration it
 * should borrow. An admin's own new code needs no entry - it falls back to
 * calm and still shows its own emoji and name.
 */
const ALIASES = {
  ready_to_focus: 'ready',
  distracted: 'excited',
  tense: 'frustrated',
  stressed: 'worried',
  anxious: 'worried',
  overwhelmed: 'worried',
  upset: 'sad',
  angry: 'frustrated',
};

export const DEFAULT_MOOD_KEY = 'calm';

/**
 * The celebration for a saved mood code, with the master row's own emoji and
 * name taking precedence over the defaults above when it has them.
 *
 * @param code  the check-in's mood code
 * @param mood  that mood's master row ({ name, icon, iconUrl }), when loaded
 */
export function celebrationFor(code, mood = null) {
  const key = MOOD_CELEBRATIONS[code] ? code : ALIASES[code] ?? DEFAULT_MOOD_KEY;
  const base = MOOD_CELEBRATIONS[key] ?? MOOD_CELEBRATIONS[DEFAULT_MOOD_KEY];

  return {
    ...base,
    key,
    // An admin-set emoji wins; an uploaded icon image is handled by the
    // component, which shows it in place of the emoji.
    emoji: mood?.icon || base.emoji,
    iconUrl: mood?.iconUrl ?? null,
    name: mood?.name ?? key,
  };
}

export default MOOD_CELEBRATIONS;
