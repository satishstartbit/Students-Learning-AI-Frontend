import { Link } from 'react-router-dom';
import { LuArrowRight, LuClock } from 'react-icons/lu';
import { cn } from '../../../../../lib/utils';
import { useStudentSettings } from '../../../hooks/useStudentSettings';
import { formatMinutes, starsForMinutes } from '../kidFormat';
import { Sprout } from '../KidScenery';
import { KidSkeleton } from '../KidStates';
import { DueChip, StatusCircle, SubjectTile } from '../PaperKit';
import { EarnedStars, HomeSticker } from './HomeBits';

/**
 * The K-5 Home's task lists, from the "Good morning, Alex!" mockup:
 * "Still to finish" (each with a speech bubble saying why it's there),
 * "Other tasks today", and the "Want to do more?" card.
 */

/** One task as a wide card: subject picture, title, time and stars, the status circle at the end. The whole card is the link. */
export function HomeTaskCard({ task, className }) {
  const assignment = task.assignment ?? {};
  const minutes = formatMinutes(assignment.estimatedMinutes);
  // "Make it yours" -> My card style, the same as the other K-5 task cards (TaskCard).
  const { settings } = useStudentSettings();
  const cardStyle = settings?.cardStyle ?? 'taped';

  return (
    <Link
      to={`/student/assignments/${assignment.id}`}
      className={cn(
        'group relative flex h-full min-h-[5.5rem] items-center gap-3 rounded-[1.25rem] border border-kid-edge/60 bg-kid-sheet p-3.5 no-underline shadow-paper transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-paper-lg',
        cardStyle === 'folded' && '[clip-path:polygon(0_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%)]',
        className
      )}
    >
      {cardStyle === 'taped' && (
        <span aria-hidden="true" className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 -rotate-3 rounded-[3px] bg-kid-ink/10" />
      )}
      {cardStyle === 'pinned' && (
        <span aria-hidden="true" className="absolute -top-1.5 left-1/2 size-3.5 -translate-x-1/2 rounded-full bg-kid-teal shadow-paper" />
      )}
      {cardStyle === 'folded' && <span aria-hidden="true" className="absolute bottom-0 right-0 size-5 rounded-tl-md bg-kid-paper-deep" />}

      <SubjectTile
        subject={assignment.subject}
        size="md"
        className="size-12 transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-105 [&_svg]:size-6"
      />

      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block font-kid-display text-[1.05rem] font-semibold leading-snug text-kid-ink">
          {assignment.title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-kid-ink-soft">
          {minutes && (
            <span className="inline-flex items-center gap-1">
              <LuClock className="size-4" aria-hidden="true" />
              {minutes}
            </span>
          )}
          <EarnedStars stars={starsForMinutes(assignment.estimatedMinutes)} size="sm" />
          <DueChip dueDate={assignment.dueDate} status={task.status} className="px-2.5 text-xs" />
        </span>
      </span>

      <StatusCircle status={task.status} className="size-8 border-[2.5px]" />
    </Link>
  );
}

const BUBBLE = {
  yesterday: 'From yesterday. You can do it now or later today.',
  earlier: 'From before. You can do it now or later today.',
  started: 'You started this one. You can finish it now or later today.',
  returned: 'Your teacher sent this back. Take a look at their note!',
};

/** "Still to finish": work carried over or already started, each with a friendly note beside it. */
export function StillToFinish({ items }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="kid-still-title">
      <h2 id="kid-still-title" className="font-kid-display text-lg font-semibold text-kid-ink sm:text-xl">
        Still to finish
      </h2>
      <ul className="mt-3 grid gap-5">
        {items.map(({ task, reason }, i) => (
          // Bubble beside the card on a tablet and a wide screen; under it on a
          // phone and a laptop (the rail leaves too little room there).
          <li
            key={task.recipientId}
            className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:items-center sm:gap-4 lg:grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
          >
            <HomeTaskCard task={task} />
            <p className="kh-bubble kh-pop px-4 pb-4 pt-3 pr-10 text-[0.95rem] leading-snug text-kid-ink" style={{ '--kh-delay': `${0.35 + i * 0.1}s` }}>
              {BUBBLE[reason]}
              <span aria-hidden="true" className="kh-sway absolute bottom-1 right-2 block w-7" style={{ '--kh-delay': `${i * 0.4}s` }}>
                <Sprout className="w-full" />
              </span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * "Other tasks today": two to a row on a tablet (the page is one column
 * there) and on a wide screen, one to a row on a laptop, where the rail
 * leaves the main column too narrow for two.
 */
export function OtherTasks({ tasks, isLoading, allToday }) {
  if (!isLoading && !tasks.length) return null;
  return (
    <section aria-labelledby="kid-other-tasks">
      <h2 id="kid-other-tasks" className="font-kid-display text-lg font-semibold text-kid-ink sm:text-xl">
        {allToday ? 'Other tasks today' : 'Other tasks'}
      </h2>
      <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {isLoading
          ? [0, 1].map((i) => (
              <li key={i}>
                <KidSkeleton className="h-[5.5rem]" />
              </li>
            ))
          : tasks.map((task, i) => (
              <li key={task.recipientId} className="kh-pop" style={{ '--kh-delay': `${0.25 + i * 0.07}s` }}>
                <HomeTaskCard task={task} />
              </li>
            ))}
      </ul>
    </section>
  );
}

/**
 * "Want to do more?" - tomorrow's task when one is waiting off the page,
 * else the rest of the student's tasks (the old "See all my tasks").
 */
export function MoreToDoCard({ tomorrowTask, moreCount }) {
  const to = tomorrowTask ? `/student/assignments/${tomorrowTask.assignment?.id}` : '/student/assignments';
  const line = tomorrowTask
    ? `Try tomorrow's task: ${tomorrowTask.assignment?.title ?? ''}`
    : moreCount > 0
      ? `See ${moreCount} more ${moreCount === 1 ? 'task' : 'tasks'}`
      : 'See all my tasks';

  return (
    <Link
      to={to}
      className="group relative flex items-center gap-4 overflow-hidden rounded-[1.4rem] border border-kid-teal/15 bg-[color-mix(in_srgb,var(--kid-teal)_13%,var(--kid-sheet))] px-4 py-4 no-underline shadow-paper transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-paper-lg sm:px-5"
    >
      <span aria-hidden="true" className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-kid-sheet shadow-paper">
        <HomeSticker slug="star" tilt={-8} className="relative size-9" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-kid-display text-lg font-semibold text-kid-ink">Want to do more?</span>
        <span className="block truncate text-base text-kid-ink-soft">{line}</span>
      </span>
      <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-kid-teal text-white shadow-[0_3px_0_var(--kid-teal-deep)]">
        <LuArrowRight className="kh-nudge size-5" />
      </span>
      <span aria-hidden="true" className="kh-sway absolute -bottom-1 right-14 hidden w-7 sm:block" style={{ '--kh-delay': '1.2s' }}>
        <Sprout className="w-full" />
      </span>
    </Link>
  );
}
