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
 * Icon + colour tone for a subject, so a task reads at a glance across
 * Home/Plan/Assignments - Grade 6+'s own version of the K-5 area's
 * kid/subjectStyle.js (same idea, kept as a separate file rather than
 * shared, matching this codebase's existing per-band convention - e.g.
 * kidNav.js vs StudentLayout's own NAV_ITEMS).
 *
 * Reuses the six sticky-note tones (utils/constants.js#STICKY_NOTE_TONES)
 * rather than inventing a new colour set - a subject tile is the same kind
 * of decoration as a sticky note's paper colour, never a status signal.
 *
 * Subjects are free text from Master Management, so this matches keywords
 * (English and French names) rather than exact values. First match wins.
 */
const SUBJECT_VISUALS = [
  {
    match: /(english|reading|writing|literacy|language arts|spelling|phonics|lecture|[ée]criture)/i,
    icon: LuBookOpen,
    tone: 'pink',
  },
  {
    match: /(french|fran[cç]ais|spanish|espa[nñ]ol|mandarin|punjabi|arabic|german|langu|second language)/i,
    icon: LuGlobe,
    tone: 'blue',
  },
  // Tones for the five core subjects follow the Grade 6+ dashboard mockup.
  { match: /(math|numera|arithm|math[ée]matiques)/i, icon: LuCalculator, tone: 'lavender' },
  { match: /(science|stem|biolog|chemi|physics|sciences)/i, icon: LuFlaskConical, tone: 'green' },
  {
    match: /(social|history|histoire|geograph|g[ée]ograph|civics|indigenous)/i,
    icon: LuLandmark,
    tone: 'orange',
  },
  { match: /(art|drawing|dessin|craft)/i, icon: LuPalette, tone: 'pink' },
  { match: /(music|musique|band|choir)/i, icon: LuMusic, tone: 'lavender' },
  {
    match: /(phys|gym|health|sant[ée]|wellness|sport|[ée]ducation physique)/i,
    icon: LuHeartPulse,
    tone: 'pink',
  },
  { match: /(computer|coding|tech|informatique|digital)/i, icon: LuMonitor, tone: 'blue' },
];

const FALLBACK = { icon: LuPencil, tone: 'blue' };

export function getSubjectVisual(subject) {
  if (!subject) return FALLBACK;
  return SUBJECT_VISUALS.find((s) => s.match.test(subject)) ?? FALLBACK;
}

export default getSubjectVisual;
