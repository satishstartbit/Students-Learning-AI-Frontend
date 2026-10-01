import BalloonEyes from './BalloonEyes';
import { ExerciseSession } from './ExerciseBreak';
import FingerFollow from './FingerFollow';
import MemoryGames from './MemoryGames';
import { getExercise } from './exerciseBreaks';
import './brainBoosters.css';
import './boosterPage.css';

const GAMES = { finger: FingerFollow, balloon: BalloonEyes, memory: MemoryGames };

/**
 * One Brain Booster, running: the game (Finger Follow, Balloon Eyes, Memory)
 * or the exercise (Easy breathing, Stretch break, Cross-body taps) from
 * boosters.js. Wrapped in `.bb-page` because the games read its colour
 * variables; the page (pages/BoosterPage.jsx, pages/kid/KidBoosterPage.jsx)
 * shows the title, so each game's own heading is hidden.
 */
export function BoosterGame({ booster, isJunior = false, reducedMotion = false }) {
  const Game = booster.kind === 'game' ? GAMES[booster.game] : null;
  const exercise = booster.kind === 'exercise' ? getExercise(booster.exercise) : null;
  return (
    <div className={`bb-page bb-game-host${isJunior ? ' bb-page--junior' : ''}`} data-reduced-motion={reducedMotion || undefined}>
      {Game && <Game key={`${booster.id}-${isJunior}`} isJunior={isJunior} reducedMotion={reducedMotion} hideHeading />}
      {exercise && <ExerciseSession key={exercise.id} exercise={exercise} reducedMotion={reducedMotion} />}
    </div>
  );
}

export default BoosterGame;
