export const FOLLOW_ROUND_MS = 20000;
export const FOLLOW_ROUNDS = 3;
export const FOLLOW_RADIUS = 26;
export const FOLLOW_PACES = {
  slow: { label: 'Slow', icon: '🐢', cycleMs: 11000, glowEveryMs: 4000 },
  medium: { label: 'Medium', icon: '🌪️', cycleMs: 8000, glowEveryMs: 3400 },
  fast: { label: 'Fast', icon: '🚀', cycleMs: 5500, glowEveryMs: 2800 },
};

export function createFollowState({ isJunior = false, calm = false, pace = 'slow' } = {}) {
  return { phase: 'ready', isJunior, calm, pace, elapsedMs: 0, taps: 0, streak: 0, rounds: 0, claimed: -1, notice: '', noticeUntil: 0 };
}

export function followPosition(state, width, height) {
  const angle = state.calm ? 0 : state.elapsedMs / FOLLOW_PACES[state.pace].cycleMs * Math.PI * 2;
  const margin = FOLLOW_RADIUS + 18;
  return { x: width / 2 + Math.max(0, width / 2 - margin) * Math.sin(angle), y: height / 2 + Math.max(0, height / 2 - 72) * Math.sin(angle * .5) };
}

export function followCue(state) {
  if (state.calm) return { window: state.taps, glowing: state.phase === 'playing' };
  const period = FOLLOW_PACES[state.pace].glowEveryMs;
  const offset = state.elapsedMs % period;
  const duration = state.isJunior ? 1500 : 1150;
  const window = Math.floor(state.elapsedMs / period);
  return { window, glowing: state.phase === 'playing' && offset >= 1200 && offset < 1200 + duration && state.claimed !== window };
}

export function startFollow(state) {
  return state.phase === 'ready' || state.phase === 'complete' ? { ...createFollowState(state), phase: 'playing' } : state;
}
export function pauseFollow(state) { return state.phase === 'playing' ? { ...state, phase: 'paused' } : state; }
export function resumeFollow(state) { return state.phase === 'paused' ? { ...state, phase: 'playing' } : state; }
export function resetFollow(state) { return createFollowState(state); }
export function changeFollowPace(state, pace) { return FOLLOW_PACES[pace] ? { ...createFollowState({ ...state, pace }) } : state; }

export function advanceFollow(state, elapsedMs) {
  if (state.phase !== 'playing' || state.calm) return state;
  const elapsed = Math.min(FOLLOW_ROUND_MS * FOLLOW_ROUNDS, state.elapsedMs + Math.max(0, Math.min(40, elapsedMs)));
  const period = FOLLOW_PACES[state.pace].glowEveryMs;
  const glowEnd = 1200 + (state.isJunior ? 1500 : 1150);
  const oldWindow = Math.floor(state.elapsedMs / period);
  const missed = state.elapsedMs % period < glowEnd && elapsed >= oldWindow * period + glowEnd && state.claimed !== oldWindow;
  return { ...state, elapsedMs: elapsed, rounds: Math.floor(elapsed / FOLLOW_ROUND_MS), streak: missed ? 0 : state.streak,
    phase: elapsed === FOLLOW_ROUND_MS * FOLLOW_ROUNDS ? 'complete' : 'playing',
    notice: elapsed >= state.noticeUntil ? '' : state.notice };
}

export function tapFollow(state, inside) {
  if (state.phase !== 'playing') return state;
  if (!inside) return { ...state, taps: 0, streak: 0, notice: 'Outside the circle — points reset to 0.', noticeUntil: state.elapsedMs + 1800 };
  const cue = followCue(state);
  if (!cue.glowing) return state.claimed === cue.window ? state : { ...state, streak: 0, notice: 'Watch the dot. Tap when it glows!', noticeUntil: state.elapsedMs + 1400 };
  const taps = state.taps + 1;
  // Calm play has no moving target or timed cue: five deliberate taps per round.
  const rounds = state.calm ? Math.floor(taps / 5) : state.rounds;
  return { ...state, taps, streak: state.streak + 1, claimed: cue.window, rounds,
    phase: state.calm && rounds === FOLLOW_ROUNDS ? 'complete' : state.phase,
    notice: 'Nice tap! +1', noticeUntil: state.elapsedMs + 1000 };
}
