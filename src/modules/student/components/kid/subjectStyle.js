import {
  LuBookOpen,
  LuCalculator,
  LuFlaskConical,
  LuGlobe,
  LuHeartPulse,
  LuLandmark,
  LuMonitor,
  LuMusic,
  LuPalette,
  LuPencil,
} from 'react-icons/lu';

/**
 * Icon + paper colour for a subject, so every task card is recognisable at a
 * glance - including for students who are still learning to read. `emoji`
 * is the big picture on the K-4 week tiles (the "My week" mockup draws a
 * book, a flask, a calculator, a globe); the line icon stays for small spots.
 *
 * Subjects are free text from Master Management, so this matches keywords
 * (English and French names) rather than exact values. First match wins, so
 * specific rules sit above general ones; anything unmatched gets a pencil.
 */
const SUBJECT_STYLES = [
  {
    match: /(english|reading|writing|literacy|language arts|spelling|phonics|lecture|[ée]criture)/i,
    icon: LuBookOpen,
    emoji: '📖',
    tile: 'bg-kid-lavender',
    ink: 'text-kid-purple',
  },
  {
    match: /(french|fran[cç]ais|spanish|espa[nñ]ol|mandarin|punjabi|arabic|german|langu|second language)/i,
    icon: LuGlobe,
    emoji: '🌍',
    tile: 'bg-kid-orange',
    ink: 'text-[#8a4a12]',
  },
  { match: /(math|numera|arithm|math[ée]matiques)/i, icon: LuCalculator, emoji: '🧮', tile: 'bg-kid-yellow', ink: 'text-[#7a5a06]' },
  { match: /(science|stem|biolog|chemi|physics|sciences)/i, icon: LuFlaskConical, emoji: '🧪', tile: 'bg-kid-mint', ink: 'text-[#1f6b52]' },
  {
    match: /(social|history|histoire|geograph|g[ée]ograph|civics|indigenous)/i,
    icon: LuLandmark,
    emoji: '🗺️',
    tile: 'bg-kid-sky',
    ink: 'text-kid-navy',
  },
  { match: /(art|drawing|dessin|craft)/i, icon: LuPalette, emoji: '🎨', tile: 'bg-kid-pink', ink: 'text-[#8f2f45]' },
  { match: /(music|musique|band|choir)/i, icon: LuMusic, emoji: '🎵', tile: 'bg-kid-lavender', ink: 'text-kid-purple' },
  {
    match: /(phys|gym|health|sant[ée]|wellness|sport|[ée]ducation physique)/i,
    icon: LuHeartPulse,
    emoji: '⚽',
    tile: 'bg-kid-coral-soft',
    ink: 'text-kid-coral',
  },
  { match: /(computer|coding|tech|informatique|digital)/i, icon: LuMonitor, emoji: '💻', tile: 'bg-kid-sky', ink: 'text-kid-navy' },
];

const FALLBACK = { icon: LuPencil, emoji: '✏️', tile: 'bg-kid-sky', ink: 'text-kid-navy' };

export function getSubjectStyle(subject) {
  if (!subject) return FALLBACK;
  return SUBJECT_STYLES.find((s) => s.match.test(subject)) ?? FALLBACK;
}

export default getSubjectStyle;
