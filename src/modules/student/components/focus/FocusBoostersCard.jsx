import { useEffect, useRef, useState } from 'react';
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
import ExerciseModal from './ExerciseModal';

const TABS = [
  { key: 'exercises', label: 'Exercises', list: EXERCISE_BOOSTERS },
  { key: 'games', label: 'Brain Games', list: BRAIN_GAMES },
];

/**
 * "Brain Boosters" on the Grade 6+ Focus page (the Focus mockup): short 1-5
 * minute breaks - Exercises or Brain Games. Today's check-in suggests one
 * ("You checked in feeling tense. A quick eye game… Try Finger Follow."),
 * from the admin-managed toolkit categories the server ranks for that mood.
 * Pick a tile to read about it; Play / Start opens its own page
 * (pages/BoosterPage.jsx). What used to be "Feeling stuck?" lives here too:
 * "What's making it hard?" (the difficulty picker) and the full toolkit.
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

  const [tab, setTab] = useState(initialTab === 'exercises' ? 'exercises' : 'games');
  const [picked, setPicked] = useState({});
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

  const list = TABS.find((t) => t.key === tab).list;
  const checkedIn = Boolean(recommendation.data?.checkedIn ?? checkIn);
  const suggestion = checkedIn ? suggestBooster(recommendation.data?.categories ?? [], list) : null;
  const selected = picked[tab] ?? suggestion ?? list[0];
  const moodCode = recommendation.data?.checkIn?.mood ?? checkIn?.mood ?? null;
  const mood = moodCode ? moodFor(moodCode) : null;

  const select = (booster) => {
    setPicked((p) => ({ ...p, [tab]: booster }));
    setHowOpen(false);
  };
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

      {suggestion && mood && (
        <p className="fs-boost-suggest" role="note">
          <span className="fs-boost-suggest__mood" aria-hidden="true">
            {mood.iconUrl ? <img src={mood.iconUrl} alt="" /> : mood.icon ?? '🙂'}
          </span>
          <span>
            You checked in feeling {String(mood.name).toLowerCase()}. {suggestion.reason} Try{' '}
            <button type="button" className="fs-link fs-link--inline" onClick={() => select(suggestion)}>
              {suggestion.label}
            </button>
            .
          </span>
        </p>
      )}

      <div className="fs-boost-tiles" role="group" aria-label={tab === 'games' ? 'Brain games' : 'Exercises'}>
        {list.map((b) => (
          <button key={b.id} type="button" className="fs-boost-tile" data-tone={b.tone} aria-pressed={selected.id === b.id} onClick={() => select(b)}>
            <span className="fs-boost-tile__icon">
              <BoosterIcon name={b.icon} size={18} />
            </span>
            <span className="fs-boost-tile__label">{b.label}</span>
          </button>
        ))}
      </div>

      <div className="fs-boost-detail" data-tone={selected.tone}>
        <div className="fs-boost-detail__text">
          <h3 className="fs-boost-detail__title">{selected.label}</h3>
          <p className="fs-boost-detail__blurb">{selected.blurb}</p>
          <p className="fs-boost-detail__meta">
            <LuClock3 size={13} aria-hidden="true" /> {selected.meta}
          </p>
          <div className="fs-boost-detail__actions">
            <button type="button" className="fs-btn fs-btn--primary" onClick={() => open(selected)}>
              {selected.kind === 'game' ? 'Play' : 'Start'} {selected.label} <LuArrowRight size={15} aria-hidden="true" />
            </button>
            <button type="button" className="fs-link" aria-expanded={howOpen} onClick={() => setHowOpen((v) => !v)}>
              {selected.kind === 'game' ? 'How to play' : 'How it works'} <LuChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          {howOpen && (
            <ol className="fs-boost-how">
              {selected.how.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
        </div>
        <BoosterPreview booster={selected} />
      </div>

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
