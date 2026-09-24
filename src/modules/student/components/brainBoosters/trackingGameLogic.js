export const BALLOON_TARGET_COUNT = 10;
export const BALLOON_FEEDBACK_MS = 650;

export function createTrackingSession(config = {}, version = 0) {
  const settings = { totalTargets: BALLOON_TARGET_COUNT, durationMs: 7000, minimumDurationMs: 4600, ...config };
  return { phase: 'ready', resumePhase: null, config: settings, target: 0, completed: 0, hits: 0, misses: 0, durationMs: settings.durationMs, lastResult: null, version };
}

export function balloonPosition(progress, width, height, target = 0) {
  const x = (width - 74) * (.12 + ((target * 31) % 77) / 100);
  const y = height - 112 - Math.max(0, Math.min(1, progress)) * (height - 32);
  return { x, y };
}

export function trackingSessionReducer(state, action) {
  switch (action.type) {
    case 'start':
      if (!['ready', 'complete'].includes(state.phase)) return state;
      return { ...createTrackingSession(action.config, state.version + 1), phase: 'playing' };
    case 'reset': return createTrackingSession(state.config, state.version + 1);
    case 'pause':
      return ['playing', 'feedback'].includes(state.phase) ? { ...state, phase: 'paused', resumePhase: state.phase } : state;
    case 'resume':
      return state.phase === 'paused' ? { ...state, phase: state.resumePhase, resumePhase: null } : state;
    case 'hit':
    case 'expired': {
      if (state.phase !== 'playing' || action.target !== state.target || action.version !== state.version) return state;
      const caught = action.type === 'hit';
      const completed = state.completed + 1;
      return { ...state, completed, hits: state.hits + Number(caught), misses: state.misses + Number(!caught),
        lastResult: caught ? 'caught' : 'missed', phase: completed === state.config.totalTargets ? 'complete' : 'feedback' };
    }
    case 'next':
      if (state.phase !== 'feedback' || action.version !== state.version) return state;
      return { ...state, phase: 'playing', target: state.target + 1, version: state.version + 1,
        durationMs: Math.max(state.config.minimumDurationMs, state.config.durationMs - Math.floor(state.hits / 3) * 450) };
    default: return state;
  }
}
