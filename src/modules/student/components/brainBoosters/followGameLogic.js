export const FOLLOW_ROUND_MS = 20000;
export const FOLLOW_ROUNDS = 3;

export function followPosition(elapsedMs, cycleMs, path = 'horizontal') {
  const phase = 2 * Math.PI * elapsedMs / cycleMs;
  return {
    x: path === 'vertical' ? .5 : .5 + .34 * Math.sin(phase),
    y: path === 'horizontal' ? .5 : .5 + .28 * Math.sin(phase * (path === 'eight' ? 2 : 1)),
  };
}
export function createFollowState() { return { phase: 'ready', elapsedMs: 0, run: 0 }; }
export function followReducer(state, action) {
  switch (action.type) {
    case 'start': return { ...createFollowState(), phase: 'playing', run: state.run + 1 };
    case 'reset': return { ...createFollowState(), run: state.run + 1 };
    case 'pause': return state.phase === 'playing' ? { ...state, phase: 'paused' } : state;
    case 'resume': return state.phase === 'paused' ? { ...state, phase: 'playing' } : state;
    case 'tick':
      if (state.phase !== 'playing' || action.run !== state.run) return state;
      return { ...state, elapsedMs: Math.min(action.elapsedMs, FOLLOW_ROUND_MS * FOLLOW_ROUNDS) };
    case 'finish':
      return state.phase === 'playing' && action.run === state.run
        ? { ...state, phase: 'complete', elapsedMs: FOLLOW_ROUND_MS * FOLLOW_ROUNDS } : state;
    case 'calm-next': {
      if (state.phase !== 'playing') return state;
      const elapsedMs = Math.min(state.elapsedMs + FOLLOW_ROUND_MS, FOLLOW_ROUND_MS * FOLLOW_ROUNDS);
      return { ...state, elapsedMs, phase: elapsedMs === FOLLOW_ROUND_MS * FOLLOW_ROUNDS ? 'complete' : 'playing' };
    }
    default: return state;
  }
}
