import { LuCloudRain, LuMoon, LuShuffle, LuTarget, LuWaves, LuZap } from 'react-icons/lu';

/**
 * The built-in art for the six moods this app ships with: a line icon and
 * the paper tone its circle takes. Rendered by MoodArt.jsx, which decides
 * per mood whether this or the admin's own icon applies.
 */
export const MOOD_TILE = {
  calm: { icon: LuWaves, tone: 'bg-kid-sky', ink: 'text-kid-navy' },
  tense: { icon: LuZap, tone: 'bg-kid-orange', ink: 'text-[#7a4a12]' },
  tired: { icon: LuMoon, tone: 'bg-kid-lavender', ink: 'text-kid-purple' },
  distracted: { icon: LuShuffle, tone: 'bg-kid-pink', ink: 'text-kid-coral' },
  overwhelmed: { icon: LuCloudRain, tone: 'bg-[#dbe4ee]', ink: 'text-kid-navy' },
  ready_to_focus: { icon: LuTarget, tone: 'bg-kid-green', ink: 'text-kid-green-deep' },
};


export default MOOD_TILE;
