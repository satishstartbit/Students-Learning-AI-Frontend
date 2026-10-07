/**
 * The Exercises side of Grade 6+ Brain Boosters (FocusBoostersCard), built to
 * the Focus mockup: five kinds of exercise - Breathing, Grounding, Movement,
 * Sound, Mindfulness - each holding the admin's toolkit exercises (Master
 * Management > Regulation Activities, GET /regulation-toolkit) and the
 * built-in guided ones (boosters.js EXERCISE_BOOSTERS).
 *
 * The categories are admin data: a group only gives a category its tile
 * picture, colour and wording, matched by name (the way kid/subjectStyle.js
 * dresses subjects). "Calming Sounds" and "Music" share the Sound tile; a
 * category no group knows gets a tile of its own under its own name. Pure
 * functions, no React - tested in exerciseGroups.test.js.
 */

export const EXERCISE_GROUPS = [
  { key: 'breathing', label: 'Breathing', icon: 'wind', tone: 'blue', noun: 'breathing exercise', match: /breath/i },
  { key: 'grounding', label: 'Grounding', icon: 'leaf', tone: 'green', noun: 'grounding exercise', match: /ground/i },
  { key: 'movement', label: 'Movement', icon: 'zap', tone: 'orange', noun: 'movement break', match: /move|stretch|yoga/i },
  { key: 'sound', label: 'Sound', icon: 'music', tone: 'lavender', noun: 'sound', match: /sound|music|listen|audio|song/i },
  { key: 'mindfulness', label: 'Mindfulness', icon: 'target', tone: 'yellow', noun: 'mindfulness exercise', match: /mindful|meditat/i },
];

const OTHER = 'Other';

/** A toolkit tool as an exercise card. */
export function exerciseFromTool(tool) {
  return {
    key: `tool:${tool.id}`,
    source: 'toolkit',
    id: tool.id,
    name: tool.name,
    description: tool.description || tool.instructions || '',
    minutes: tool.durationMinutes ?? null,
    category: tool.category || OTHER,
    toolType: tool.toolType ?? '',
    mediaUrl: tool.mediaUrl ?? null,
    tool,
  };
}

/** A built-in guided exercise (boosters.js) as an exercise card. */
export function exerciseFromBooster(booster) {
  return {
    key: `booster:${booster.id}`,
    source: 'booster',
    id: booster.id,
    name: booster.label,
    description: booster.blurb,
    minutes: booster.minutes ?? null,
    category: booster.categories?.[0] || OTHER,
    toolType: booster.exercise ?? '',
    mediaUrl: booster.mediaUrl ?? null,
    booster,
  };
}

function knownGroupFor(exercise) {
  return EXERCISE_GROUPS.find((g) => g.match.test(exercise.category)) ?? EXERCISE_GROUPS.find((g) => g.match.test(exercise.toolType)) ?? null;
}

/** The colour of an exercise's tile (the same in the dialog and on its page as on Focus). */
export function toneOf(exercise) {
  return knownGroupFor(exercise)?.tone ?? 'pink';
}

/**
 * The tiles to show: `categories` is GET /regulation-toolkit ([{ category,
 * tools }], admin display order), `boosters` the built-in exercises. Known
 * groups come in the mockup's order, then any other category in the order
 * the admin's list has it; inside a group the admin's exercises come first.
 * Groups with nothing in them are left out.
 */
export function groupExercises(categories = [], boosters = []) {
  const exercises = [
    ...(Array.isArray(categories) ? categories : []).flatMap((c) => (c?.tools ?? []).map(exerciseFromTool)),
    ...(boosters ?? []).map(exerciseFromBooster),
  ];

  const known = new Map(EXERCISE_GROUPS.map((g) => [g.key, []]));
  const others = new Map();
  for (const exercise of exercises) {
    const group = knownGroupFor(exercise);
    if (group) {
      known.get(group.key).push(exercise);
    } else {
      const key = `category:${exercise.category.toLowerCase()}`;
      if (!others.has(key)) others.set(key, { key, label: exercise.category, icon: 'sparkles', tone: 'pink', noun: 'exercise', exercises: [] });
      others.get(key).exercises.push(exercise);
    }
  }

  return [
    ...EXERCISE_GROUPS.filter((g) => known.get(g.key).length).map((g) => ({
      key: g.key,
      label: g.label,
      icon: g.icon,
      tone: g.tone,
      noun: g.noun,
      exercises: known.get(g.key),
    })),
    ...others.values(),
  ];
}

/**
 * Where today's suggested exercise sits: the server's pick for the check-in
 * (`tool`, which already fits the time the student has), else the first
 * exercise in the earliest of the server's ranked `categories`. Null when
 * nothing matches. Returns { group, index, exercise }.
 */
export function pickSuggestion(groups = [], { tool = null, categories = [] } = {}) {
  const all = groups.flatMap((g) => g.exercises.map((exercise, index) => ({ group: g.key, index, exercise })));
  if (tool) {
    const hit = all.find((x) => x.exercise.source === 'toolkit' && x.exercise.id === tool.id);
    if (hit) return hit;
  }
  for (const category of categories ?? []) {
    const hit = all.find((x) => x.exercise.category === category);
    if (hit) return hit;
  }
  return null;
}

/** "1 minute", "3 minutes"; null when unknown. */
export function minutesLabel(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n === 1 ? '1 minute' : `${n} minutes`;
}

const VIDEO = new Set(['mp4', 'webm', 'ogv', 'mov', 'm4v']);
const IMAGE = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif']);
const AUDIO = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg', 'oga', 'flac']);

/**
 * What an exercise's media link is, so the card can play it:
 *   youtube / vimeo   { kind, src } - src is the privacy-friendly embed address
 *   video / image / audio   { kind, src } - a file to play or show
 *   link              { kind, src } - a web page we can't play here
 *   none              no link, or not an http(s) address
 */
export function exerciseMedia(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return { kind: 'none' };
  let u;
  try {
    u = new URL(raw);
  } catch {
    return { kind: 'none' };
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { kind: 'none' };

  const host = u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
  let youtubeId = null;
  if (host === 'youtu.be') youtubeId = u.pathname.split('/')[1] ?? null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    youtubeId = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] ?? null;
  }
  if (youtubeId && /^[\w-]{11}$/.test(youtubeId)) {
    return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&playsinline=1` };
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = u.pathname.match(/\/(\d+)(?:\/|$)/)?.[1];
    if (id) return { kind: 'vimeo', src: `https://player.vimeo.com/video/${id}?dnt=1` };
  }

  const ext = u.pathname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (ext && VIDEO.has(ext)) return { kind: 'video', src: u.href };
  if (ext && IMAGE.has(ext)) return { kind: 'image', src: u.href };
  if (ext && AUDIO.has(ext)) return { kind: 'audio', src: u.href };
  return { kind: 'link', src: u.href };
}

/** Which built-in picture explains an exercise when it has no video or image of its own. */
export function illustrationFor(exercise) {
  const text = `${exercise?.name ?? ''} ${exercise?.toolType ?? ''} ${exercise?.category ?? ''}`.toLowerCase();
  if (/box/.test(text) && /breath/.test(text)) return 'box';
  if (/breath/.test(text)) return 'breath';
  if (/5-4-3-2-1|54321|senses/.test(text)) return 'senses';
  if (/cross|tap/.test(text)) return 'taps';
  if (/ground/.test(text)) return 'senses';
  if (/stretch|move|yoga/.test(text)) return 'stretch';
  if (/rain|nature|ocean|wave/.test(text)) return 'rain';
  if (/music|sound|song|listen/.test(text)) return 'music';
  if (/mindful|meditat/.test(text)) return 'mindful';
  return 'default';
}
