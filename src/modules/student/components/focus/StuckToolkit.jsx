import { useEffect, useMemo, useState } from 'react';
import { LuChevronRight, LuHeadphones, LuLeaf, LuMusic, LuSparkles, LuWind, LuZap } from 'react-icons/lu';
import { Modal } from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { useTodayCheckIn } from '../../../checkIn/hooks/useTodayCheckIn';
import DifficultyPicker from '../../../checkIn/components/DifficultyPicker';
import regulationToolkitService from '../../services/regulationToolkit.service';
import RegulationToolkitCard from '../RegulationToolkitCard';
import ExerciseModal from './ExerciseModal';

/**
 * "Feeling stuck? Take two minutes." - three quick exercises under the focus
 * timer, from the admin-managed Regulation Toolkit (Master Management >
 * Regulation Activities), not a hardcoded list.
 *
 * Which three: the categories today's check-in suggests come first
 * (GET /regulation-toolkit/recommendation), then the rest in admin order;
 * within a category the shortest tool wins, so these really are two-minute
 * options. "Open the toolkit" shows everything in a dialog.
 */

const CATEGORY_ICONS = {
  breathing: LuWind,
  grounding: LuLeaf,
  movement: LuZap,
  mindfulness: LuSparkles,
  'calming sounds': LuHeadphones,
  music: LuMusic,
};

const slug = (category) => String(category ?? '').toLowerCase().replace(/\s+/g, '-');

export function StuckToolkit({ onExerciseOpenChange }) {
  const [asking, setAsking] = useState(false);
  const { checkIn } = useTodayCheckIn();
  const categories = useApi(regulationToolkitService.listCategories, { immediate: true });
  const recommendation = useApi(regulationToolkitService.getRecommendation);
  const { run: runRecommendation } = recommendation;

  const [openAll, setOpenAll] = useState(false);
  const [exercise, setExercise] = useState(null);

  useEffect(() => {
    if (checkIn) runRecommendation().catch(() => {});
  }, [checkIn, runRecommendation]);

  const suggestedCategories = recommendation.data?.categories;

  const quickTools = useMemo(() => {
    const groups = categories.data ?? [];
    const suggested = suggestedCategories ?? [];
    const rank = (category) => {
      const index = suggested.indexOf(category);
      return index === -1 ? suggested.length + 1 : index;
    };
    return [...groups]
      .sort((a, b) => rank(a.category) - rank(b.category))
      .map((group) => [...group.tools].sort((a, b) => (a.durationMinutes ?? 99) - (b.durationMinutes ?? 99))[0])
      .filter(Boolean)
      .slice(0, 3);
  }, [categories.data, suggestedCategories]);

  const openExercise = (tool) => {
    setExercise(tool);
    setOpenAll(false);
    onExerciseOpenChange?.(true);
  };

  const closeExercise = () => {
    setExercise(null);
    onExerciseOpenChange?.(false);
  };

  return (
    <section className="fs-card" aria-labelledby="fs-stuck-title">
      <header className="fs-stuck__head">
        <h2 id="fs-stuck-title" className="fs-stuck__title">
          Feeling stuck? Take two minutes.
        </h2>
        <div className="fs-stuck__links">
          {/* Before reaching for a calming tool, a student can say what is
              actually in the way - the reasons and the strategies they get
              back are Super Admin's own lists. */}
          <button type="button" className="fs-link" onClick={() => setAsking(true)}>
            What&apos;s making it hard? <LuChevronRight size={14} aria-hidden="true" />
          </button>
          <button type="button" className="fs-link" onClick={() => setOpenAll(true)}>
            Open the toolkit <LuChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      <DifficultyPicker isOpen={asking} onClose={() => setAsking(false)} />

      {categories.isLoading && !categories.data ? (
        <div className="fs-tools" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ minHeight: 150, borderRadius: 14, background: 'var(--color-bg-surface-sunken)' }} />
          ))}
        </div>
      ) : quickTools.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          No toolkit exercises yet - ask your teacher or parent to add some.
        </p>
      ) : (
        <div className="fs-tools">
          {quickTools.map((tool) => {
            const Icon = CATEGORY_ICONS[String(tool.category ?? '').toLowerCase()] ?? LuSparkles;
            return (
              <button key={tool.id} type="button" className="fs-tool" data-cat={slug(tool.category)} onClick={() => openExercise(tool)}>
                <span className="fs-tool__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="fs-tool__cat">{tool.category}</span>
                <span className="fs-tool__name">{tool.name}</span>
                <span className="fs-tool__mins">{tool.durationMinutes} min</span>
              </button>
            );
          })}
        </div>
      )}

      <Modal isOpen={openAll} onClose={() => setOpenAll(false)} title="Regulation toolkit" size="lg">
        <RegulationToolkitCard onStartExercise={openExercise} embedded />
      </Modal>

      <ExerciseModal tool={exercise} isOpen={Boolean(exercise)} onClose={closeExercise} onDone={closeExercise} />
    </section>
  );
}

export default StuckToolkit;
