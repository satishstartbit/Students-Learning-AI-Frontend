export function getMemorySettings(mode, isJunior) {
  return {
    startLength: mode === 'clap' ? (isJunior ? 2 : 3) : 1,
    maxLength: isJunior ? 6 : 9,
    stepMs: isJunior ? 1500 : 1200,
  };
}

export function createMemoryState(maxLength) {
  return {
    phase: 'ready',
    sequence: [],
    answers: [],
    activeIndex: null,
    cueOn: false,
    round: 1,
    score: 0,
    maxLength,
    playbackId: 0,
  };
}

export function createMemorySequence(length, optionCount, random = Math.random) {
  return Array.from({ length }, () => Math.floor(random() * optionCount));
}

// Both playback and input are guarded here so queued clicks and stale timers
// cannot advance a different round or award the same round twice.
export function memoryGameReducer(state, action) {
  switch (action.type) {
    case 'start':
      if (state.phase !== 'ready') return state;
      return {
        ...state,
        sequence: action.sequence,
        phase: 'watch',
        playbackId: state.playbackId + 1,
      };
    case 'show':
      if (state.phase !== 'watch' || action.playbackId !== state.playbackId) return state;
      return { ...state, activeIndex: action.index, cueOn: true };
    case 'cue-off':
      if (state.phase !== 'watch' || action.playbackId !== state.playbackId) return state;
      return { ...state, cueOn: false };
    case 'manual-next':
      if (state.phase !== 'watch') return state;
      if (state.activeIndex === state.sequence.length - 1) return { ...state, phase: 'input', activeIndex: null, cueOn: false };
      return { ...state, activeIndex: state.activeIndex === null ? 0 : state.activeIndex + 1, cueOn: true };
    case 'your-turn':
      if (state.phase !== 'watch' || action.playbackId !== state.playbackId) return state;
      return { ...state, phase: 'input', activeIndex: null, cueOn: false };
    case 'answer': {
      if (state.phase !== 'input') return state;
      if (action.item !== state.sequence[state.answers.length]) {
        return { ...state, phase: 'mistake', activeIndex: null };
      }
      const answers = [...state.answers, action.item];
      if (answers.length !== state.sequence.length) return { ...state, answers };
      return {
        ...state,
        answers,
        score: state.score + state.sequence.length * 10,
        phase: state.sequence.length >= state.maxLength ? 'complete' : 'success',
      };
    }
    case 'pause':
      if (state.phase !== 'watch') return state;
      return { ...state, phase: 'paused', activeIndex: null, playbackId: state.playbackId + 1 };
    case 'replay':
      if (!['input', 'mistake', 'paused'].includes(state.phase)) return state;
      return {
        ...state,
        phase: 'watch',
        answers: [],
        activeIndex: null,
        playbackId: state.playbackId + 1,
      };
    case 'next':
      if (state.phase !== 'success') return state;
      return {
        ...state,
        sequence: action.sequence ?? [...state.sequence, action.item],
        answers: [],
        activeIndex: null,
        round: state.round + 1,
        phase: 'watch',
        playbackId: state.playbackId + 1,
      };
    case 'reset':
      return { ...createMemoryState(state.maxLength), playbackId: state.playbackId + 1 };
    default:
      return state;
  }
}
