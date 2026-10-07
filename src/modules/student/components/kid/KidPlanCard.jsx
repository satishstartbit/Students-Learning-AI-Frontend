import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuCamera, LuFootprints, LuLifeBuoy, LuMic, LuPencil, LuPlay } from 'react-icons/lu';
import { formatTime } from '../../../../utils/date';
import AddWorkDialog from '../../../planner/components/AddWorkDialog';
import PendingIntakes from '../../../planner/components/PendingIntakes';
import SupportCheckBack from '../../../planner/components/SupportCheckBack';
import { usePlan } from '../../../planner/hooks/usePlan';
import '../../../planner/planner.css';
import { KidDifficultyPicker } from './KidDifficultyPicker';
import { PaperCard } from './PaperKit';

const WAYS = [
  { key: 'voice', icon: LuMic, label: 'Say it' },
  { key: 'photo', icon: LuCamera, label: 'Photo' },
  { key: 'typed', icon: LuPencil, label: 'Type it' },
];

/**
 * K-5 / Grades 4-5 plan card (PDF Q14): ONE clear next step from the plan,
 * and adding work the easy way - voice and photo first, big buttons, and a
 * single simple date question afterwards (the guided intake).
 */
export function KidPlanCard() {
  const { plan, reload } = usePlan('me');
  const [adding, setAdding] = useState(null);
  const [tricky, setTricky] = useState(false);
  const next = plan?.nextActions?.[0] ?? null;

  return (
    <PaperCard
      as="section"
      aria-labelledby="kid-plan-title"
      tone="sheet"
      className="flex flex-col gap-4 rounded-[1.4rem] border border-kid-edge/60 px-5 py-5 sm:px-6"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-kid-lavender text-kid-purple">
          <LuFootprints className="size-5" strokeWidth={2.2} />
        </span>
        <h2 id="kid-plan-title" className="font-kid-display text-lg font-semibold text-kid-ink">
          My next step
        </h2>
      </div>
      {next ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-[1_1_14rem]">
            <p className="font-kid-display text-xl text-kid-ink">{next.title}</p>
            <p className="font-kid-body text-kid-ink-soft">
              {next.date === plan.today ? 'Today' : 'Soon'} at {formatTime(next.startAt, { timeZone: plan.timezone })}
              {next.assignmentTitle && next.assignmentTitle !== next.title ? ` · ${next.assignmentTitle}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTricky(true)}
              className="group inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-kid-edge bg-kid-sheet px-5 font-kid-display text-base text-kid-ink transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-kid-teal"
            >
              <LuLifeBuoy className="size-5 text-kid-teal transition-transform duration-300 group-hover:rotate-45" aria-hidden="true" /> It’s tricky
            </button>
            {next.assignmentId && (
              <Link
                to={`/student/focus?assignment=${next.assignmentId}${next.stepId ? `&step=${next.stepId}` : ''}`}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-kid-teal px-6 font-kid-display text-lg font-semibold text-kid-sheet no-underline shadow-[0_4px_0_var(--kid-teal-deep)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-kid-teal-deep active:translate-y-[3px] active:shadow-[0_1px_0_var(--kid-teal-deep)]"
              >
                <LuPlay className="size-5" aria-hidden="true" /> Start
              </Link>
            )}
          </div>
        </div>
      ) : (
        <p className="font-kid-body text-kid-ink-soft">Nothing planned yet. Add some work and we’ll plan it with you.</p>
      )}

      <div>
        <p className="font-kid-display text-base font-medium text-kid-ink">Got new work?</p>
        <div className="mt-2 grid grid-cols-3 gap-2.5 sm:gap-3">
          {WAYS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setAdding(key)}
              className="group flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-kid-edge bg-kid-paper/70 px-1 font-kid-display text-base text-kid-ink transition-[transform,border-color,background-color] duration-150 hover:-translate-y-0.5 hover:border-kid-teal hover:bg-kid-sheet"
            >
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-kid-sheet shadow-paper transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110">
                <Icon className="size-5 text-kid-teal" />
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <SupportCheckBack compact />
      <PendingIntakes guided onChanged={reload} />
      <KidDifficultyPicker
        isOpen={tricky}
        assignmentId={next?.assignmentId}
        stepId={next?.stepId}
        onChanged={reload}
        onClose={() => setTricky(false)}
      />

      <AddWorkDialog key={adding ?? 'closed'} isOpen={Boolean(adding)} method={adding} guided onClose={() => setAdding(null)} onAdded={reload} />
    </PaperCard>
  );
}

export default KidPlanCard;
