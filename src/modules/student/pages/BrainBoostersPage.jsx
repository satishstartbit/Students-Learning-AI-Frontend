import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuArrowLeft, LuBrain, LuGamepad2, LuMove, LuSparkles, LuTimer } from 'react-icons/lu';
import { useMotionAllowed } from '../hooks/useKidPreferences';
import { useStudentExperience } from '../hooks/useStudentExperience';
import { useStudentSettings } from '../hooks/useStudentSettings';
import FingerFollow from '../components/brainBoosters/FingerFollow';
import BalloonEyes from '../components/brainBoosters/BalloonEyes';
import MemoryGames from '../components/brainBoosters/MemoryGames';
import ExerciseBreak from '../components/brainBoosters/ExerciseBreak';
import '../components/brainBoosters/brainBoosters.css';

const GAMES = [
  { id: 'finger', label: 'Finger Follow', icon: '👆', hint: 'Follow & tap', component: FingerFollow },
  { id: 'balloon', label: 'Balloon Eyes', icon: '🎈', hint: 'Spot & pop', component: BalloonEyes },
  { id: 'memory', label: 'Memory Games', icon: '🧠', hint: 'Watch & remember', component: MemoryGames },
];

const INSTRUCTIONS = {
  finger: ['Choose Slow, Medium or Fast, then select Let?s go!', 'Follow the moving dot with your eyes. Tap it once when it glows gold; each successful glow earns one tap point.', 'Complete three 20-second rounds. A missed glow breaks your streak; tapping outside the circle resets taps and streak to 0. Changing speed starts a fresh game.'],
  balloon: ['Start a set of ten balloons.', 'Notice the colour and pop the balloon before it leaves the sky. Calm play has no time limit.', 'Each balloon counts once. Three pops unlock a slightly quicker level.'],
  memory: ['Choose an action pattern, Simon-style colour sequence, or a shopping list.', 'Watch first. When it is your turn, repeat the full sequence in order.', 'Read the practice rules for scoring and retries. Step-by-step playback lets you set the pace.'],
  exercises: ['Choose a short exercise and get comfortable.', 'Follow each gentle prompt at your own pace.', 'Pause or skip a step whenever you need to.'],
};

export default function BrainBoostersPage() {
  const { isJunior } = useStudentExperience();
  const { settings } = useStudentSettings();
  const motionAllowed = useMotionAllowed();
  const reducedMotion = !motionAllowed || Boolean(settings?.reduceMotion);
  const [section, setSection] = useState('games');
  const [game, setGame] = useState('finger');
  const activeGame = GAMES.find((item) => item.id === game);
  const Game = activeGame.component;
  const instructions = INSTRUCTIONS[section === 'exercises' ? 'exercises' : game];

  return (
    <div className={`bb-page${section === 'games' && game === 'finger' ? ' bb-page--finger' : ''}${isJunior ? ' bb-page--junior kid-ui' : ''}`} data-kid-page={isJunior || undefined} data-reduced-motion={reducedMotion || undefined}>
      <div className="bb-page__inner">
        <Link to="/student" className="bb-back"><LuArrowLeft aria-hidden="true" /> Back to my day</Link>
        <header className="bb-hero">
          <div>
            <span className="bb-eyebrow"><LuSparkles aria-hidden="true" /> A LITTLE BREAK, A FRESH START</span>
            <h1>Brain Boosters <span aria-hidden="true">✨</span></h1>
            <p>{isJunior ? 'Ready, set, play! A little movement and a little memory fun.' : 'Step away from your work for a moment. Move, play, and refocus.'}</p>
          </div>
          <span className="bb-duration"><LuTimer aria-hidden="true" /> 1–5 minute breaks</span>
        </header>

        <div className="bb-layout">
          <div className="bb-main">
            <div className="bb-section-switch" role="group" aria-label="Activity type">
              <button type="button" aria-pressed={section === 'exercises'} onClick={() => setSection('exercises')}><LuMove aria-hidden="true" /> Exercises</button>
              <button type="button" aria-pressed={section === 'games'} onClick={() => setSection('games')}><LuGamepad2 aria-hidden="true" /> Brain Games</button>
            </div>

            {section === 'games' && (
              <div className="bb-game-switch" role="group" aria-label="Choose a brain game">
                {GAMES.map((item) => (
                  <button key={item.id} type="button" aria-pressed={game === item.id} onClick={() => setGame(item.id)}>
                    <span className="bb-game-switch__icon" aria-hidden="true">{item.icon}</span>
                    <span><strong>{item.label}</strong><small>{item.hint}</small></span>
                  </button>
                ))}
              </div>
            )}

            <section className="bb-panel" aria-label={section === 'exercises' ? 'Exercises' : activeGame.label}>
              {section === 'games'
                ? <Game key={`${game}-${isJunior}`} isJunior={isJunior} reducedMotion={reducedMotion} />
                : <ExerciseBreak isJunior={isJunior} reducedMotion={reducedMotion} />}
            </section>
          </div>

          <aside className="bb-aside" aria-label="Activity guide">
            <div className="bb-guide">
              <span className="bb-guide__icon"><LuBrain aria-hidden="true" /></span>
              <h2>{isJunior ? 'Let’s play!' : 'A moment for you'}</h2>
              <p>Small breaks fit between big ideas.</p>
              <h3>How it works</h3>
              <ol>{instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
            </div>
            <div className="bb-pace">
              <LuSparkles aria-hidden="true" />
              <div><h3>Your pace, your space</h3><p>{isJunior ? 'Start small. There is no rush to get it right.' : 'Longer patterns and a quicker starting pace keep things interesting.'}</p>
                {reducedMotion && <p>Calm play is on. Targets stay still; you control the pace.</p>}
                <p className="bb-session-note">Scores are just for this session. Changing games starts a new session.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
