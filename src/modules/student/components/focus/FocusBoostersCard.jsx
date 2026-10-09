import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuArrowRight, LuBrain, LuChevronRight, LuClock3 } from 'react-icons/lu';
import { Modal } from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import DifficultyPicker from '../../../checkIn/components/DifficultyPicker';
import { useMoodLookup } from '../../../checkIn/hooks/useMoodLookup';
import { useTodayCheckIn } from '../../../checkIn/hooks/useTodayCheckIn';
import regulationToolkitService from '../../services/regulationToolkit.service';
import { BoosterIcon } from '../brainBoosters/BoosterIcon';
import { BRAIN_GAMES, EXERCISE_BOOSTERS, boosterPath, suggestBooster } from '../brainBoosters/boosters';
import RegulationToolkitCard from '../RegulationToolkitCard';
import BoosterPreview from './BoosterPreview';
import ExerciseMedia from './ExerciseMedia';
import ExerciseModal from './ExerciseModal';
import { groupExercises, minutesLabel, pickSuggestion } from './exerciseGroups';

const TABS = [
  { key: 'exercises', label: 'Exercises' },
  { key: 'games', label: 'Brain Games' },
];

/**
 * "Brain Boosters" on the Grade 6+ Focus page (the Focus mockups): short 1-5
 * minute breaks - Exercises or Brain Games.
 *
 * Exercises: five kinds - Breathing, Grounding, Movement, Sound, Mindfulness
 * (exerciseGroups.js) - each holding the admin's Regulation Activities and the
 * built-in guided exercises. Today's check-in picks a starting point ("You
 * checked in feeling tense with 30 minutes free - Box Breathing is a good
 * place to start", the server's pick for the mood and the time); "Try a
 * different breathing exercise" steps through the rest of the kind. Beside
 * it, how to do it: the exercise's video, else its image, else a built-in
 * picture of the steps (ExerciseMedia). Start exercise runs an admin exercise
 * here (ExerciseModal) and opens a built-in one on its own page.
 *
 * Brain Games: three tiles, the check-in suggestion ("A quick eye game… Try
 * Finger Follow"), and the picked game with Play and How to play.
 *
 * "What's making it hard?" (the difficulty picker) and the full toolkit sit
 * at the foot.
 *
 *   initialTab       'games' (default) or 'exercises' - ?boost= on /student/focus
 *   onBeforeOpen()   runs before leaving for a booster (pauses a running clock)
 *   onExerciseOpenChange(open)  a toolkit exercise opened / closed in place
 */
export function FocusBoostersCard({ initialTab = 'games', scrollIntoView = false, onBeforeOpen, onExerciseOpenChange }) {
  const navigate = useNavigate();
  const ref = useRef(null);
  const { checkIn } = useTodayCheckIn();
  const { moodFor } = useMoodLookup();
  const recommendation = useApi(regulationToolkitService.getRecommendation);
  const { run: runRecommendation } = recommendation;
  const toolkit = useApi(regulationToolkitService.listCategories, { immediate: true });

  const [tab, setTab] = useState(initialTab === 'exercises' ? 'exercises' : 'games');
  const [pickedGame, setPickedGame] = useState(null);
  const [exPick, setExPick] = useState({ group: null, index: {} });
  const [howOpen, setHowOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [toolkitOpen, setToolkitOpen] = useState(false);
  const [tool, setTool] = useState(null);

  useEffect(() => {
    if (checkIn) runRecommendation().catch(() => {});
  }, [checkIn, runRecommendation]);

  // Arriving from Home's Brain Boosters card (?boost=…) brings this card into view.
  useEffect(() => {
    if (scrollIntoView) ref.current?.scrollIntoView({ block: 'start' });
  }, [scrollIntoView]);

  const rec = recommendation.data;
  const checkedIn = Boolean(rec?.checkedIn ?? checkIn);
  const moodCode = rec?.checkIn?.mood ?? checkIn?.mood ?? null;
  const mood = moodCode ? moodFor(moodCode) : null;
  const moodName = mood ? String(mood.name).toLowerCase() : null;
  const freeMinutes = minutesLabel(rec?.checkIn?.availableMinutes ?? checkIn?.availableMinutes);

  // --- Exercises
  const groups = useMemo(() => groupExercises(toolkit.data, EXERCISE_BOOSTERS), [toolkit.data]);
  const exSuggestion = checkedIn ? pickSuggestion(groups, { tool: rec?.tool, categories: rec?.categories }) : null;
  const group = groups.find((g) => g.key === exPick.group) ?? groups.find((g) => g.key === exSuggestion?.group) ?? groups[0] ?? null;
  const exIndex = group ? (exPick.index[group.key] ?? (exSuggestion?.group === group.key ? exSuggestion.index : 0)) % group.exercises.length : 0;
  const exercise = group?.exercises[exIndex] ?? null;

  const pickGroup = (key) => setExPick((p) => ({ ...p, group: key }));
  const tryAnother = () => setExPick((p) => ({ group: group.key, index: { ...p.index, [group.key]: (exIndex + 1) % group.exercises.length } }));
  const pickHit = (hit) => setExPick((p) => ({ group: hit.group, index: { ...p.index, [hit.group]: hit.index } }));
  // The server suggests a few (client: 2-3 at a time); the others are offered after the first.
  const alsoSuggested = exSuggestion
    ? (rec?.suggestions ?? [])
        .filter((t) => t.id !== exSuggestion.exercise.id)
        .map((t) => pickSuggestion(groups, { tool: t }))
        .filter((hit) => hit && hit.exercise.source === 'toolkit')
    : [];

  // --- Brain games
  const gameSuggestion = checkedIn ? suggestBooster(rec?.categories ?? [], BRAIN_GAMES) : null;
  const game = pickedGame ?? gameSuggestion ?? BRAIN_GAMES[0];

  const open = async (booster) => {
    await onBeforeOpen?.();
    navigate(boosterPath(booster));
  };
  const openTool = (t) => {
    setToolkitOpen(false);
    setTool(t);
    onExerciseOpenChange?.(true);
  };
  const closeTool = () => {
    setTool(null);
    onExerciseOpenChange?.(false);
  };
  const startExercise = (ex) => (ex.source === 'toolkit' ? openTool(ex.tool) : open(ex.booster));

  const moodIcon = mood && (
    <span className="fs-boost-suggest__mood" aria-hidden="true">
      {mood.iconUrl ? <img src={mood.iconUrl} alt="" /> : mood.icon ?? '🙂'}
    </span>
  );

  return (
    <section ref={ref} className="fs-card fs-boosters" id="brain-boosters" aria-labelledby="fs-boosters-title">
      <header className="fs-card__head">
        <span className="fs-card__icon" aria-hidden="true">
          <LuBrain size={18} />
        </span>
        <div>
          <h2 id="fs-boosters-title" className="fs-card__title">
            Brain Boosters
          </h2>
          <p className="fs-card__sub">Short 1–5 minute breaks to calm down, move or play.</p>
        </div>
      </header>

      <div className="fs-boost-tabs" role="group" aria-label="Kind of break">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            onClick={() => {
              setTab(t.key);
              setHowOpen(false);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'exercises' ? (
        <>
          {exSuggestion && moodName && (
            <p className="fs-boost-suggest" role="note">
              {moodIcon}
              <span>
                You checked in feeling {moodName}
                {freeMinutes ? ` with ${freeMinutes} free` : ''} —{' '}
                <button type="button" className="fs-link fs-link--inline" onClick={() => pickHit(exSuggestion)}>
                  {exSuggestion.exercise.name}
                </button>{' '}
                is a good place to start.
                {alsoSuggested.length > 0 && (
                  <>
                    {' '}Or try{' '}
                    {alsoSuggested.map((hit, i) => (
                      <Fragment key={hit.exercise.key}>
                        {i > 0 && (i === alsoSuggested.length - 1 ? ' or ' : ', ')}
                        <button type="button" className="fs-link fs-link--inline" onClick={() => pickHit(hit)}>
                          {hit.exercise.name}
                        </button>
                      </Fragment>
                    ))}
                    .
                  </>
                )}
              </span>
            </p>
          )}

          {groups.length > 0 && (
            <div
              className="fs-boost-tiles fs-boost-tiles--groups"
              role="group"
              aria-label="Kinds of exercise"
              style={{ '--cols': Math.min(groups.length, 6), '--cols-narrow': groups.length === 4 ? 2 : Math.min(groups.length, 3) }}
            >
              {groups.map((g) => (
                <button key={g.key} type="button" className="fs-boost-tile" data-tone={g.tone} aria-pressed={group?.key === g.key} onClick={() => pickGroup(g.key)}>
                  <span className="fs-boost-tile__icon">
                    <BoosterIcon name={g.icon} size={18} />
                  </span>
                  <span className="fs-boost-tile__label">{g.label}</span>
                </button>
              ))}
            </div>
          )}

          {exercise && (
            <div className="fs-boost-detail fs-boost-detail--exercise" data-tone={group.tone}>
              <div className="fs-boost-detail__text">
                <h3 className="fs-boost-detail__title" aria-live="polite">
                  {exercise.name}
                </h3>
                {exercise.description && <p className="fs-boost-detail__blurb">{exercise.description}</p>}
                {minutesLabel(exercise.minutes) && (
                  <p className="fs-boost-detail__meta">
                    <LuClock3 size={14} aria-hidden="true" /> {minutesLabel(exercise.minutes)}
                  </p>
                )}
                <div className="fs-boost-detail__actions">
                  <button type="button" className="fs-btn fs-btn--primary" onClick={() => startExercise(exercise)}>
                    Start exercise <LuArrowRight size={16} aria-hidden="true" />
                  </button>
                  {group.exercises.length > 1 && (
                    <button type="button" className="fs-link" onClick={tryAnother}>
                      Try a different {group.noun} <LuChevronRight size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <ExerciseMedia key={exercise.key} exercise={exercise} tone={group.tone} />
            </div>
          )}
        </>
      ) : (
        <>
          {gameSuggestion && moodName && (
            <p className="fs-boost-suggest" role="note">
              {moodIcon}
              <span>
                You checked in feeling {moodName}. {gameSuggestion.reason} Try{' '}
                <button
                  type="button"
                  className="fs-link fs-link--inline"
                  onClick={() => {
                    setPickedGame(gameSuggestion);
                    setHowOpen(false);
                  }}
                >
                  {gameSuggestion.label}
                </button>
                .
              </span>
            </p>
          )}

          <div className="fs-boost-tiles" role="group" aria-label="Brain games">
            {BRAIN_GAMES.map((b) => (
              <button
                key={b.id}
                type="button"
                className="fs-boost-tile"
                data-tone={b.tone}
                aria-pressed={game.id === b.id}
                onClick={() => {
                  setPickedGame(b);
                  setHowOpen(false);
                }}
              >
                <span className="fs-boost-tile__icon">
                  <BoosterIcon name={b.icon} size={18} />
                </span>
                <span className="fs-boost-tile__label">{b.label}</span>
              </button>
            ))}
          </div>

          <div className="fs-boost-detail" data-tone={game.tone}>
            <div className="fs-boost-detail__text">
              <h3 className="fs-boost-detail__title">{game.label}</h3>
              <p className="fs-boost-detail__blurb">{game.blurb}</p>
              <p className="fs-boost-detail__meta">
                <LuClock3 size={13} aria-hidden="true" /> {game.meta}
              </p>
              <div className="fs-boost-detail__actions">
                <button type="button" className="fs-btn fs-btn--primary" onClick={() => open(game)}>
                  Play {game.label} <LuArrowRight size={15} aria-hidden="true" />
                </button>
                <button type="button" className="fs-link" aria-expanded={howOpen} onClick={() => setHowOpen((v) => !v)}>
                  How to play <LuChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
              {howOpen && (
                <ol className="fs-boost-how">
                  {game.how.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
            <BoosterPreview booster={game} />
          </div>
        </>
      )}

      <footer className="fs-boost-foot">
        {/* Before reaching for a break, a student can say what is actually in
            the way - the reasons and what they get back are Super Admin's lists. */}
        <button type="button" className="fs-link" onClick={() => setAsking(true)}>
          What&apos;s making it hard? <LuChevronRight size={14} aria-hidden="true" />
        </button>
        <button type="button" className="fs-link" onClick={() => setToolkitOpen(true)}>
          More calming tools <LuChevronRight size={14} aria-hidden="true" />
        </button>
      </footer>

      <DifficultyPicker isOpen={asking} onClose={() => setAsking(false)} />
      <Modal isOpen={toolkitOpen} onClose={() => setToolkitOpen(false)} title="Regulation toolkit" size="lg">
        <RegulationToolkitCard onStartExercise={openTool} embedded />
      </Modal>
      <ExerciseModal tool={tool} isOpen={Boolean(tool)} onClose={closeTool} onDone={closeTool} />
    </section>
  );
}

export default FocusBoostersCard;
