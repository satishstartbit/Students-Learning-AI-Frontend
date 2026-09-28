import { useId, useRef, useState } from 'react';
import { AnimatedCircularProgressBar } from '../../../../components/ui/animated-circular-progress-bar';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { cn } from '../../../../lib/utils';
import { useMyTasks } from '../../hooks/useMyTasks';
import { NotebookIcon, SparkleIcon, StarIcon } from '../../components/kid/KidIcons';
import { KidPageHeader } from '../../components/kid/KidPageHeader';
import { KidEmpty, KidOops, KidSkeleton } from '../../components/kid/KidStates';
import { TaskCard } from '../../components/kid/TaskCard';

const TABS = [
  {
    value: 'toDo',
    label: 'To do',
    emptyIcon: StarIcon,
    emptyTitle: 'Nothing to do right now!',
    emptyText: 'When your teacher gives you a task, it will show up here.',
  },
  {
    value: 'sent',
    label: 'Sent to teacher',
    emptyIcon: SparkleIcon,
    emptyTitle: 'Nothing waiting',
    emptyText: 'Work you hand in waits here until your teacher looks at it.',
  },
  {
    value: 'done',
    label: 'Done',
    emptyIcon: NotebookIcon,
    emptyTitle: 'No finished work yet',
    emptyText: 'When your teacher checks your work, it moves here.',
  },
];

/** How much of the student's work is handed in - a ring, since a fraction means little at five. */
function ProgressRing({ finished, total }) {
  if (!total) return null;

  return (
    <div className="flex items-center gap-3">
      {/* The ring's own percentage is hidden - "2 of 3" beside it is what a young student can read. */}
      <div aria-hidden="true">
        <AnimatedCircularProgressBar
          value={finished}
          max={total}
          gaugePrimaryColor="var(--kid-green-deep)"
          gaugeSecondaryColor="var(--kid-paper-deep)"
          className="size-16 [&_[data-current-value]]:hidden"
        />
      </div>
      <p className="max-w-[9rem] font-kid-display text-lg leading-snug text-kid-ink">
        {finished} of {total} handed in
      </p>
    </div>
  );
}

/**
 * K-5 Assignments: three simple piles - To do, Sent to teacher, Done - as
 * ARIA tabs (arrow keys move between them), each a grid of big task cards.
 * Opening a card goes to the existing assignment page.
 */
export default function KidAssignmentsPage() {
  const tasks = useMyTasks();
  const [active, setActive] = useState('toDo');
  const tabRefs = useRef({});
  const uid = useId();

  const finished = tasks.sent.length + tasks.done.length;
  const total = finished + tasks.toDo.length;
  const activeTab = TABS.find((t) => t.value === active);
  const items = tasks[active];

  const onTabKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = TABS.findIndex((t) => t.value === active);
    const next = TABS[(index + step + TABS.length) % TABS.length].value;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div data-kid-page className="kid-ui mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:py-10">
      <KidPageHeader icon={NotebookIcon} title="My Assignments" subtitle="Tap a task to open it.">
        {!tasks.isLoading && !tasks.error && <ProgressRing finished={finished} total={total} />}
      </KidPageHeader>

      <div role="tablist" aria-label="My assignments" className="mt-7 flex flex-wrap gap-2.5" onKeyDown={onTabKeyDown}>
        {TABS.map((tab) => {
          const selected = tab.value === active;
          return (
            <button
              key={tab.value}
              ref={(el) => {
                tabRefs.current[tab.value] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-${tab.value}-tab`}
              aria-selected={selected}
              aria-controls={`${uid}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.value)}
              className={cn(
                'inline-flex h-12 items-center gap-2 rounded-full px-5 font-kid-display text-lg transition-colors',
                selected
                  ? 'bg-kid-teal font-semibold text-white shadow-[0_4px_0_var(--kid-teal-deep)]'
                  : 'bg-kid-sheet text-kid-navy shadow-paper hover:bg-white'
              )}
            >
              {tab.label}
              {!tasks.isLoading && (
                <span
                  className={cn(
                    'grid min-w-7 place-items-center rounded-full px-1.5 text-base',
                    selected ? 'bg-white/25' : 'bg-kid-paper-deep'
                  )}
                >
                  {tasks[tab.value].length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-${active}-tab`} className="mt-6">
        {tasks.isLoading ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading your tasks">
            {[0, 1, 2].map((i) => (
              <li key={i}>
                <KidSkeleton className="h-24" />
              </li>
            ))}
          </ul>
        ) : tasks.error ? (
          <KidOops message="We couldn't load your tasks." onRetry={tasks.reload} error={tasks.error} />
        ) : items.length === 0 ? (
          <KidEmpty icon={activeTab.emptyIcon} title={activeTab.emptyTitle}>
            {activeTab.emptyText}
          </KidEmpty>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((task, i) => (
              <li key={task.recipientId}>
                <BlurFade delay={Math.min(i, 8) * 0.04}>
                  <TaskCard task={task} />
                </BlurFade>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
