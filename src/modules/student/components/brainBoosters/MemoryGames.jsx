import { useEffect, useReducer, useState } from 'react';
import { createMemorySequence, createMemoryState, getMemorySettings, memoryGameReducer } from './memoryGameLogic';
import './memoryGames.css';

const GAMES = {
  clap: {
    label: 'Clap Pattern',
    icon: '👏',
    description: 'Watch a short rhythm, then tap Clap, Snap and Stomp in the same order. Each round gives you a new, longer pattern.',
    juniorTip: 'Say “clap, snap, stomp” as you remember. Tapping the buttons is all you need to do!',
    seniorTip: 'Try grouping the actions into a short rhythm to remember the order.',
    items: [
      { label: 'Clap', icon: '👏', tone: 'yellow' },
      { label: 'Snap', icon: '🫰', tone: 'pink' },
      { label: 'Stomp', icon: '🦶', tone: 'blue' },
    ],
  },
  simon: {
    label: 'Simon Says',
    icon: '🟢',
    description: 'Simon-style colour memory: repeat the full sequence. It starts with one colour and adds one after each correct round.',
    juniorTip: 'Remember the names as well as the colors. You can watch the pattern again.',
    seniorTip: 'Keep the old sequence in mind, then add the new pad at the end.',
    items: [
      { label: 'Green', icon: '🍃', tone: 'green' },
      { label: 'Yellow', icon: '☀️', tone: 'yellow' },
      { label: 'Blue', icon: '🌊', tone: 'blue' },
      { label: 'Red', icon: '🍓', tone: 'red' },
    ],
  },
  chain: {
    label: 'Memory Chain',
    icon: '🛒',
    description: 'Remember the shopping list in order. After recalling it, choose one item to add and remember the longer list.',
    juniorTip: 'Make a little story with the items. Each round adds one more to your list!',
    seniorTip: 'Connect each item to the next with a mental image. Repeated items count too.',
    items: [
      { label: 'Apple', icon: '🍎', tone: 'pink' },
      { label: 'Book', icon: '📘', tone: 'blue' },
      { label: 'Ball', icon: '⚽', tone: 'green' },
      { label: 'Star', icon: '⭐', tone: 'yellow' },
      { label: 'Cat', icon: '🐱', tone: 'yellow' },
      { label: 'Tree', icon: '🌳', tone: 'green' },
      { label: 'Clock', icon: '⏰', tone: 'pink' },
      { label: 'Key', icon: '🔑', tone: 'blue' },
    ],
  },
};

function getFeedback(state, isJunior, mode) {
  switch (state.phase) {
    case 'watch': return 'Watch and remember. The pattern will hide before your turn.';
    case 'paused': return 'Playback paused. Resume to watch the pattern again from the beginning.';
    case 'input': return `Your turn! Choose item ${state.answers.length + 1} of ${state.sequence.length}.`;
    case 'mistake': return isJunior ? 'Almost! Watch once more and have another go.' : 'A different order this time. Replay the same round and try again.';
    case 'success': return mode === 'chain' ? `List remembered! +${state.sequence.length * 10} points. Choose an item below to add to the list.` : `Pattern complete! +${state.sequence.length * 10} points. Select Next round when ready.`;
    case 'complete': return `You remembered all ${state.sequence.length} items! Session complete.`;
    default: return 'Start when you are ready. Watch first, then repeat from memory.';
  }
}

function MemorySession({ mode, isJunior, reducedMotion }) {
  const game = GAMES[mode];
  const items = mode === 'chain' && isJunior ? game.items.slice(0, 6) : game.items;
  const settings = getMemorySettings(mode, isJunior);
  const [state, dispatch] = useReducer(memoryGameReducer, settings.maxLength, createMemoryState);
  const [stepByStep, setStepByStep] = useState(false);
  const manualPlayback = reducedMotion || stepByStep;

  useEffect(() => {
    if (state.phase !== 'watch' || manualPlayback) return undefined;
    const playbackId = state.playbackId;
    const timers = [];
    state.sequence.forEach((_, index) => {
      const delay = 800 + index * settings.stepMs;
      timers.push(window.setTimeout(() => dispatch({ type: 'show', index, playbackId }), delay));
      timers.push(window.setTimeout(() => dispatch({ type: 'cue-off', playbackId }), delay + settings.stepMs - 240));
    });
    timers.push(window.setTimeout(() => dispatch({ type: 'your-turn', playbackId }), 800 + state.sequence.length * settings.stepMs));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [state.phase, state.playbackId, state.sequence, settings.stepMs, manualPlayback]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) dispatch({ type: 'pause' });
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);

  const activeItemIndex = state.activeIndex === null ? null : state.sequence[state.activeIndex];
  const activeItem = activeItemIndex === null ? null : items[activeItemIndex];
  const feedback = getFeedback(state, isJunior, mode);
  const isFinished = state.phase === 'success' || state.phase === 'complete';
  const addingToChain = mode === 'chain' && state.phase === 'success';

  const mainLabel = state.phase === 'ready' ? 'Watch pattern'
    : state.phase === 'watch' ? manualPlayback ? state.activeIndex === state.sequence.length - 1 ? 'My turn' : 'Show next item' : 'Pause'
      : state.phase === 'paused' ? 'Resume playback'
        : state.phase === 'input' ? 'Watch again'
          : state.phase === 'mistake' ? 'Watch and try again'
            : state.phase === 'complete' ? 'Play again'
              : addingToChain ? 'Choose an item to add' : 'Next round';

  function mainAction() {
    if (state.phase === 'ready') start();
    else if (state.phase === 'watch') dispatch({ type: manualPlayback ? 'manual-next' : 'pause' });
    else if (['paused', 'input', 'mistake'].includes(state.phase)) dispatch({ type: 'replay' });
    else if (state.phase === 'complete') dispatch({ type: 'reset' });
    else if (state.phase === 'success' && !addingToChain) dispatch({
      type: 'next', item: createMemorySequence(1, items.length)[0],
      ...(mode === 'clap' ? { sequence: createMemorySequence(state.sequence.length + 1, items.length) } : {}),
    });
  }

  function start() {
    dispatch({ type: 'start', sequence: createMemorySequence(settings.startLength, items.length) });
  }

  return (
    <div className={`bb-memory-session bb-memory-session--${mode}`} data-phase={state.phase} data-reduced-motion={reducedMotion ? 'true' : 'false'}>
      <p className="bb-memory-description">{game.description}</p>
      <label className="bb-memory-manual"><input type="checkbox" checked={manualPlayback} disabled={reducedMotion || state.phase !== 'ready'} onChange={(event) => setStepByStep(event.target.checked)} /> Show one item at a time, at my pace</label>
      <p className="bb-memory-scoring">Practice rules: 10 points per item in a completed round. A mistake earns no points; replay and try again. Finish at {settings.maxLength} items. Tapping the buttons records your answer.</p>
      <div className="bb-stats bb-memory-stats" aria-label="Game progress">
        <div className="bb-stat"><strong>{state.round}</strong><span>Round</span></div>
        <div className="bb-stat"><strong>{state.score}</strong><span>Score</span></div>
        <div className="bb-stat"><strong>{state.sequence.length || settings.startLength}</strong><span>Items</span></div>
      </div>

      <p className={`bb-feedback bb-memory-feedback bb-memory-feedback--${state.phase}`} role="status">{feedback}</p>
      <div className={`bb-memory-stage ${state.phase === 'watch' ? 'is-playing' : ''}`}>
        {state.phase === 'watch' ? (
          <div className="bb-memory-current" aria-live="polite" aria-atomic="true">
            {activeItem ? (
              <>
                <span className={`bb-memory-cue bb-memory-tone--${activeItem.tone}`} aria-hidden="true">{activeItem.icon}</span>
                <strong>{state.activeIndex + 1}. {activeItem.label}</strong>
              </>
            ) : <span className="bb-memory-stage-placeholder">{manualPlayback ? 'Select Show next item when ready' : 'Watch the first item…'}</span>}
          </div>
        ) : state.phase === 'paused' ? (
          <span className="bb-memory-stage-placeholder">Paused — your pattern is waiting</span>
        ) : state.phase === 'ready' ? (
          <span className="bb-memory-stage-placeholder">Your pattern will appear here</span>
        ) : (
          <div className="bb-memory-answer-list" aria-label={`${state.answers.length} of ${state.sequence.length} items recalled`}>
            {state.sequence.map((_, index) => {
              const answeredItem = index < state.answers.length ? items[state.answers[index]] : null;
              return (
                <span key={index} className={`bb-memory-answer ${answeredItem ? `bb-memory-tone--${answeredItem.tone}` : ''}`}>
                  {answeredItem ? <><span aria-hidden="true">{answeredItem.icon}</span><span className="bb-memory-answer-label">{answeredItem.label}</span></> : <span aria-label={`Item ${index + 1}, hidden`}>?</span>}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="bb-memory-pads" aria-label={`${game.label} choices`}>
        {items.map((item, index) => (
          <button
            key={item.label}
            type="button"
            className={`bb-memory-pad bb-memory-tone--${item.tone} ${state.phase === 'watch' && state.cueOn && activeItemIndex === index ? 'is-lit' : ''}`}
            disabled={state.phase !== 'input' && !addingToChain}
            onClick={() => dispatch({ type: addingToChain ? 'next' : 'answer', item: index })}
            aria-label={item.label}
          >
            <span className="bb-memory-pad-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="bb-memory-controls">
        <button type="button" className="bb-primary-button" onClick={mainAction} disabled={addingToChain}>{mainLabel}</button>
        <button type="button" className="bb-secondary-button" disabled={state.phase === 'ready'} onClick={() => dispatch({ type: 'reset' })}>Reset</button>
      </div>
      <p className="bb-tip bb-memory-tip"><span aria-hidden="true">{isFinished ? '✨' : '💡'}</span> {isJunior ? game.juniorTip : game.seniorTip}</p>
    </div>
  );
}

/** `hideHeading`: on its own page (pages/BoosterPage.jsx) the page shows the title. */
export default function MemoryGames({ isJunior = false, reducedMotion = false, hideHeading = false }) {
  const [mode, setMode] = useState('clap');

  return (
    <div className="bb-memory">
      {!hideHeading && (
        <div className="bb-game-heading">
          <span className="bb-memory-heading-icon" aria-hidden="true">🧠</span>
          <div><h2>Memory Games</h2><p>{isJunior ? 'Watch, remember, and play!' : 'Practice remembering patterns and sequences.'}</p></div>
        </div>
      )}
      <div className="bb-memory-tabs" role="group" aria-label="Choose a memory game">
        {Object.entries(GAMES).map(([key, game]) => (
          <button key={key} type="button" className={`bb-memory-tab ${mode === key ? 'is-selected' : ''}`} aria-pressed={mode === key} onClick={() => setMode(key)}>
            <span aria-hidden="true">{game.icon}</span> {game.label}
          </button>
        ))}
      </div>
      <MemorySession key={`${mode}-${isJunior}`} mode={mode} isJunior={isJunior} reducedMotion={reducedMotion} />
    </div>
  );
}
