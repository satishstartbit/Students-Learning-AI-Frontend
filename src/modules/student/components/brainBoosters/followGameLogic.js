export const HUB_RADIUS = 28;
export const HOLD_MS = 3000;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// One continuous world shared by rendering and collisions. Frequency has a ceiling
// so an endless run never generates an impossibly tight corridor on a phone.
export function corridorAt(worldX, isJunior = false, seed = 0) {
  const ramp = clamp((worldX - .25) / .9, 0, 1);
  const turn = 2.8 * worldX + .18 * worldX * Math.min(worldX, 4);
  return {
    centre: .5 + ramp * (.16 * Math.sin(turn + seed * .8) + .025 * Math.sin(4 * worldX + seed)),
    half: (isJunior ? .32 : .29) - Math.min(.025, Math.max(0, worldX - 1) * .006),
  };
}

export function followSpeed(distance, isJunior = false) {
  return (isJunior ? .10 : .13) * (1 + Math.min(1, distance * .12));
}

export function createFollowState({ isJunior = false, calm = false, seed = 0 } = {}) {
  return { phase: 'paused', reason: 'ready', x: .17, y: .5, distance: 0, score: 0, level: 1, isJunior, calm, seed, furthestX: .17, holdMs: 0 };
}

export function insideHub(state, point, bounds) {
  return Math.hypot((point.x - state.x) * bounds.width, (point.y - state.y) * bounds.height) <= HUB_RADIUS;
}

export function insideCourse(state, point, bounds) {
  if (bounds.width <= 0 || bounds.height <= 0) return false;
  const horizontalRadius = HUB_RADIUS / bounds.width;
  const verticalRadius = HUB_RADIUS / bounds.height;
  if (point.x < horizontalRadius || point.x > 1 - horizontalRadius || point.y < verticalRadius || point.y > 1 - verticalRadius) return false;
  // Test the circle's curved footprint, not a square around it. The old full
  // vertical radius at +/- horizontalRadius caused invisible corner collisions.
  for (let dx = -HUB_RADIUS; dx <= HUB_RADIUS; dx += 1) {
    const extent = Math.sqrt(HUB_RADIUS * HUB_RADIUS - dx * dx) / bounds.height;
    const corridor = corridorAt(state.distance + point.x + dx / bounds.width, state.isJunior, state.seed);
    if (Math.abs(point.y - corridor.centre) + extent > corridor.half) return false;
  }
  return true;
}

export function resetFollow(state) {
  return createFollowState({ ...state, seed: state.seed + 1 });
}

function failFollow(state, reason) {
  // Keep the scene at the failure location. Only an explicit retry resets it.
  return { ...state, phase: 'failed', reason, score: 0, holdMs: 0 };
}

export function pressFollow(state, point, bounds) {
  if (!insideHub(state, point, bounds)) return failFollow(state, 'outside');
  if (state.phase === 'complete' || state.phase === 'failed') return state;
  return { ...state, phase: 'countdown', reason: 'holding', holdMs: 0 };
}

export function pauseFollow(state, reason = 'released') {
  return state.phase === 'playing' || state.phase === 'countdown' ? { ...state, phase: 'paused', reason, holdMs: 0 } : state;
}

export function moveFollow(state, point, bounds) {
  if (state.phase === 'countdown') return insideHub(state, point, bounds) ? state : pauseFollow(state, 'reposition');
  if (state.phase !== 'playing') return state;
  if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return pauseFollow(state, 'left-board');
  const pixels = Math.hypot((point.x - state.x) * bounds.width, (point.y - state.y) * bounds.height);
  const steps = Math.max(1, Math.ceil(pixels / 3));
  let lastSafe = state;
  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;
    const sample = { x: state.x + (point.x - state.x) * progress, y: state.y + (point.y - state.y) * progress };
    if (!insideCourse(state, sample, bounds)) return failFollow(lastSafe, 'wall');
    lastSafe = { ...state, ...sample };
  }
  const furthestX = Math.max(state.furthestX, point.x);
  const score = state.calm ? Math.floor((furthestX - .17) * 100) : state.score;
  const complete = state.calm && point.x >= 1 - (HUB_RADIUS + 16) / bounds.width;
  return { ...state, x: point.x, y: point.y, furthestX, score, phase: complete ? 'complete' : 'playing', reason: complete ? 'finished' : 'holding' };
}

export function advanceFollow(state, elapsedMs, bounds) {
  const elapsed = clamp(elapsedMs, 0, 40);
  if (state.phase === 'countdown') {
    const holdMs = Math.min(HOLD_MS, state.holdMs + elapsed);
    return { ...state, holdMs, phase: holdMs === HOLD_MS ? 'playing' : 'countdown' };
  }
  if (state.phase !== 'playing' || state.calm) return state;
  const distance = state.distance + followSpeed(state.distance, state.isJunior) * elapsed / 1000;
  const next = { ...state, distance };
  if (!insideCourse(next, next, bounds)) return failFollow(state, 'wall');
  const score = Math.floor(distance * 100);
  return { ...next, score, level: Math.floor(score / 50) + 1, reason: 'holding' };
}
