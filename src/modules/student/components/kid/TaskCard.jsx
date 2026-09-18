import { Link } from 'react-router-dom';
import { LuClock } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import { useStudentSettings } from '../../hooks/useStudentSettings';
import { formatMinutes, starsForMinutes } from './kidFormat';
import { DueChip, StarRating, StatusCircle, SubjectTile } from './PaperKit';

/**
 * One assignment as a small flat card: subject picture and status circle up
 * top, title, then time/stars/due below. The whole card is the link, so
 * it's one big tap target; its accessible name reads the title, time, due
 * date and status in order.
 */
export function TaskCard({ task, className }) {
  const assignment = task.assignment ?? {};
  const minutes = formatMinutes(assignment.estimatedMinutes);
  // "Make it yours" -> My card style. Decoration only; "plain" adds nothing.
  const { settings } = useStudentSettings();
  const cardStyle = settings?.cardStyle ?? 'taped';

  return (
    <Link
      to={`/student/assignments/${assignment.id}`}
      className={cn(
        'group relative flex min-h-24 flex-col gap-3 rounded-3xl bg-kid-sheet p-4 no-underline shadow-paper transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-paper-lg',
        cardStyle === 'folded' && '[clip-path:polygon(0_0,100%_0,100%_calc(100%-22px),calc(100%-22px)_100%,0_100%)]',
        className
      )}
    >
      {cardStyle === 'taped' && (
        <span
          aria-hidden="true"
          className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 -rotate-3 rounded-[3px] bg-kid-ink/10"
        />
      )}
      {cardStyle === 'pinned' && (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 left-1/2 size-3.5 -translate-x-1/2 rounded-full bg-kid-teal shadow-paper"
        />
      )}
      {cardStyle === 'folded' && (
        <span aria-hidden="true" className="absolute bottom-0 right-0 size-[22px] rounded-tl-md bg-kid-paper-deep" />
      )}

      <span className="flex items-start justify-between">
        <SubjectTile subject={assignment.subject} size="sm" />
        <StatusCircle status={task.status} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block font-kid-display text-lg font-medium leading-snug text-kid-ink">
          {assignment.title}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-kid-ink-soft">
          {minutes && (
            <span className="inline-flex items-center gap-1.5">
              <LuClock className="size-4" aria-hidden="true" />
              {minutes}
            </span>
          )}
          <StarRating stars={starsForMinutes(assignment.estimatedMinutes)} size="sm" />
          <DueChip dueDate={assignment.dueDate} status={task.status} />
        </span>
      </span>
    </Link>
  );
}

export default TaskCard;
