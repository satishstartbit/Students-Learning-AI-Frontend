import { Link } from 'react-router-dom';
import { LuArrowRight, LuClock } from 'react-icons/lu';
import { ASSIGNMENT_RECIPIENT_STATUS as STATUS } from '../../../../utils/constants';
import { KidButton } from './KidButton';
import { StarIcon } from './KidIcons';
import { KidOops, KidSkeleton } from './KidStates';
import { formatMinutes, getStartLabel, starsForMinutes } from './kidFormat';
import { getSubjectStyle } from './subjectStyle';
import { DueChip, PaperCard, StarRating, SubjectTile, TapeLabel } from './PaperKit';

/**
 * The one thing to do next, as big as the page allows - the heart of the
 * home page. One task and one button, so starting is a single, obvious tap.
 */
export function NextTaskCard({ task, isLoading, error, onRetry }) {
  return (
    <PaperCard as="section" aria-labelledby="kid-next-task" tone="sheet" className="px-5 pb-7 pt-11 sm:px-9 sm:pb-9 sm:pt-12">
      <TapeLabel as="h2" tone="yellow" id="kid-next-task" className="absolute -top-4 left-7 sm:left-9">
        Your next task
      </TapeLabel>

      <NextTaskBody task={task} isLoading={isLoading} error={error} onRetry={onRetry} />
    </PaperCard>
  );
}

function NextTaskBody({ task, isLoading, error, onRetry }) {
  if (isLoading) {
    return (
      <div className="relative flex items-center gap-6" role="status" aria-label="Loading your next task">
        <KidSkeleton className="size-24 shrink-0 sm:size-28" />
        <div className="flex flex-1 flex-col gap-3">
          <KidSkeleton className="h-9 w-3/4" />
          <KidSkeleton className="h-6 w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return <KidOops className="relative shadow-none" message="We couldn't load your tasks." onRetry={onRetry} />;
  }

  if (!task) {
    return (
      <div className="relative flex flex-col items-center gap-2 py-2 text-center sm:flex-row sm:gap-6 sm:text-left">
        <StarIcon className="size-20 shrink-0" />
        <div>
          <p className="font-kid-display text-3xl font-semibold text-kid-ink">You&apos;re all caught up!</p>
          <p className="mt-1 text-lg text-kid-ink-soft">No tasks right now. Great job - enjoy your day!</p>
        </div>
      </div>
    );
  }

  const assignment = task.assignment ?? {};
  const minutes = formatMinutes(assignment.estimatedMinutes);
  const { icon: SubjectIcon } = getSubjectStyle(assignment.subject);

  return (
    <div className="relative grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-8">
      <SubjectTile subject={assignment.subject} size="xl" />

      <div className="min-w-0">
        <h3 className="font-kid-display text-[clamp(1.6rem,3vw,2.35rem)] font-semibold leading-tight text-kid-ink">
          {assignment.title}
        </h3>

        {task.status === STATUS.RETURNED && (
          <p className="mt-2 text-lg font-bold text-kid-coral">
            Your teacher sent this back - take a look at their note!
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-lg text-kid-ink-soft">
            {assignment.subject && (
              <li className="flex items-center gap-2">
                <SubjectIcon className="size-5" aria-hidden="true" />
                {assignment.subject}
              </li>
            )}
            {minutes && (
              <li className="flex items-center gap-2">
                <LuClock className="size-5" aria-hidden="true" />
                {minutes}
              </li>
            )}
            <li>
              <StarRating stars={starsForMinutes(assignment.estimatedMinutes)} />
            </li>
            <li>
              <DueChip dueDate={assignment.dueDate} status={task.status} />
            </li>
          </ul>

          <KidButton asChild className="transition-transform duration-150 hover:scale-[1.03]">
            <Link to={`/student/assignments/${assignment.id}`}>
              {getStartLabel(task.status)}
              <LuArrowRight className="size-6" aria-hidden="true" />
            </Link>
          </KidButton>
        </div>
      </div>
    </div>
  );
}

export default NextTaskCard;
