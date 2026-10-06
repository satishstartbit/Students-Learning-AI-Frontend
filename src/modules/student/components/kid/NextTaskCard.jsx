import { Link } from 'react-router-dom';
import { LuArrowRight, LuClock } from 'react-icons/lu';
import { ASSIGNMENT_RECIPIENT_STATUS as STATUS } from '../../../../utils/constants';
import { EarnedStars, HomeSticker, HomeTape } from './home/HomeBits';
import { KidButton } from './KidButton';
import { StarIcon } from './KidIcons';
import { KidOops, KidSkeleton } from './KidStates';
import { formatMinutes, getStartLabel, starsForMinutes } from './kidFormat';
import { getSubjectStyle } from './subjectStyle';
import { DueChip, SubjectTile } from './PaperKit';

/**
 * The one thing to do next, as big as the page allows - the heart of the
 * home page. One task and one button, so starting is a single, obvious tap.
 *
 * Drawn to the "Good morning, Alex!" mockup: a sheet of paper on a second
 * sheet, a pin, the "Your next task" tape, a bookworm sticker that floats on
 * the corner, and the button's arrow nudging on hover.
 */
export function NextTaskCard({ task, isLoading, error, onRetry }) {
  return (
    <div className="relative pt-3.5">
      {/* The sheet underneath, peeking out. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-3 -bottom-2 top-7 rotate-[1.3deg] rounded-[1.6rem] bg-kid-paper-deep/90 shadow-paper"
      />

      <section
        aria-labelledby="kid-next-task"
        className="relative rounded-[1.6rem] border border-kid-edge/60 bg-kid-sheet px-5 pb-6 pt-10 shadow-paper-lg sm:px-8 sm:pb-7"
      >
        <span aria-hidden="true" className="absolute left-4 top-4 size-3 rounded-full bg-kid-ink/20 shadow-[inset_0_1px_1px_rgb(0_0_0/0.2)]" />
        <HomeTape as="h2" id="kid-next-task" className="-top-3.5 left-9 -rotate-2 text-base">
          Your next task
        </HomeTape>
        <HomeSticker slug="bookworm" motion="float" tilt={8} className="-right-2 -top-6 size-12 sm:size-14" />

        <NextTaskBody task={task} isLoading={isLoading} error={error} onRetry={onRetry} />
      </section>
    </div>
  );
}

function NextTaskBody({ task, isLoading, error, onRetry }) {
  if (isLoading) {
    return (
      <div className="relative flex items-center gap-5" role="status" aria-label="Loading your next task">
        <KidSkeleton className="size-16 shrink-0 rounded-[1.4rem] sm:size-20" />
        <div className="flex flex-1 flex-col gap-3">
          <KidSkeleton className="h-8 w-3/4" />
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
      <div className="relative flex flex-col items-center gap-2 py-1 text-center sm:flex-row sm:gap-5 sm:text-left">
        <StarIcon className="kh-twinkle size-16 shrink-0" />
        <div>
          <p className="font-kid-display text-2xl font-semibold text-kid-ink sm:text-3xl">You&apos;re all caught up!</p>
          <p className="mt-1 text-lg text-kid-ink-soft">No tasks right now. Great job - enjoy your day!</p>
        </div>
      </div>
    );
  }

  const assignment = task.assignment ?? {};
  const minutes = formatMinutes(assignment.estimatedMinutes);
  const { icon: SubjectIcon } = getSubjectStyle(assignment.subject);

  return (
    // Phone: picture + title, the button full width under them. Tablet: the
    // button under the title. Wide: picture | title | button in one row.
    <div className="relative grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-4 sm:items-center sm:gap-x-6 xl:grid-cols-[auto_minmax(0,1fr)_auto]">
      <SubjectTile
        subject={assignment.subject}
        size="xl"
        className="size-16 rounded-[1.25rem] sm:size-20 sm:rounded-[1.4rem] [&_svg]:size-8 sm:[&_svg]:size-10"
      />

      <div className="min-w-0">
        <h3 className="font-kid-display text-[clamp(1.3rem,2.3vw,1.85rem)] font-semibold leading-tight text-kid-ink">
          {assignment.title}
        </h3>

        {task.status === STATUS.RETURNED && (
          <p className="mt-2 text-base font-bold text-kid-coral sm:text-lg">Your teacher sent this back - take a look at their note!</p>
        )}

        <ul className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-base text-kid-ink-soft">
          {assignment.subject && (
            <li className="flex items-center gap-1.5">
              <SubjectIcon className="size-4.5" aria-hidden="true" />
              {assignment.subject}
            </li>
          )}
          {minutes && (
            <li className="flex items-center gap-1.5">
              <LuClock className="size-4.5" aria-hidden="true" />
              {minutes}
            </li>
          )}
          <li>
            <EarnedStars stars={starsForMinutes(assignment.estimatedMinutes)} />
          </li>
          <li>
            <DueChip dueDate={assignment.dueDate} status={task.status} />
          </li>
        </ul>
      </div>

      <KidButton
        asChild
        size="md"
        className="group col-span-2 w-full justify-center rounded-2xl px-6 sm:col-span-1 sm:col-start-2 sm:w-auto sm:justify-self-start xl:col-start-3 xl:row-start-1"
      >
        <Link to={`/student/assignments/${assignment.id}`}>
          {getStartLabel(task.status)}
          <LuArrowRight className="kh-nudge size-5" aria-hidden="true" />
        </Link>
      </KidButton>
    </div>
  );
}

export default NextTaskCard;
