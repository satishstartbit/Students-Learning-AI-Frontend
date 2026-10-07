import { Link } from 'react-router-dom';
import { LuArrowRight, LuCheck, LuSend } from 'react-icons/lu';
import { cn } from '../../../../../lib/utils';
import { ASSIGNMENT_RECIPIENT_STATUS as STATUS } from '../../../../../utils/constants';
import { HomeSticker } from '../home/HomeBits';
import { SubjectPicture } from '../PaperKit';

/**
 * The K-5 "My work" cards (pages/kid/KidAssignmentsPage.jsx), drawn to the
 * "My work" mockup: the subject's picture, the title and subject, dots for
 * the steps done, and what's next at the end - an arrow, a paper plane once
 * it's with the teacher, a green tick (and a star sticker) when finished.
 */

const DONE = [STATUS.REVIEWED, STATUS.COMPLETED];
const MAX_DOTS = 8;

/** Where a task is, in words a young student reads, and how it looks. */
function statusOf(task, steps) {
  if (DONE.includes(task.status)) return { tone: 'done', label: 'All done!' };
  if (task.status === STATUS.SUBMITTED) return { tone: 'sent', label: 'Sent to your teacher' };
  if (task.status === STATUS.RETURNED) return { tone: 'back', label: 'Your teacher sent it back' };
  if (steps?.total > 0) {
    if (steps.done === 0 && task.status === STATUS.ASSIGNED) return { tone: 'going', label: 'Not started yet' };
    return { tone: 'going', label: `${steps.done} of ${steps.total} done` };
  }
  return { tone: 'going', label: task.status === STATUS.IN_PROGRESS ? 'Started' : 'Not started yet' };
}

/** One dot per step (at most eight), filled as steps are done; finished work fills them all. */
function ProgressDots({ total, done, finished, delay = 0 }) {
  const count = Math.min(total, MAX_DOTS);
  const filled = finished ? count : Math.round((Math.min(done, total) / total) * count);
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center gap-1">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            'size-2.5 rounded-full',
            i < filled ? cn('kh-pop', finished ? 'bg-kid-green-deep' : 'bg-kid-teal') : 'bg-kid-paper-deep'
          )}
          style={i < filled ? { '--kh-delay': `${delay + 0.08 * i}s` } : undefined}
        />
      ))}
    </span>
  );
}

/**
 * One piece of work. `steps` = { total, done } from the plan's work list
 * when known; without it the card still says where the work is.
 */
export function WorkCard({ task, steps, delay = 0 }) {
  const assignment = task.assignment ?? {};
  const status = statusOf(task, steps);
  const finished = status.tone === 'done';
  const dots = finished ? steps?.total || 5 : steps?.total || 0;

  return (
    <Link
      to={`/student/assignments/${assignment.id}`}
      className={cn(
        'kh-pop group relative flex h-full items-center gap-4 rounded-[1.3rem] border p-4 no-underline shadow-paper transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-paper-lg',
        finished
          ? 'border-kid-green-deep/25 bg-[color-mix(in_srgb,var(--kid-mint)_55%,var(--kid-sheet))]'
          : 'border-kid-edge/60 bg-kid-sheet'
      )}
      style={{ '--kh-delay': `${delay}s` }}
    >
      {finished && <HomeSticker slug="star" tilt={12} delay={0.3 + delay} className="-right-2 -top-3.5 size-9" />}

      <SubjectPicture
        subject={assignment.subject}
        className="size-14 text-[1.9rem] transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110 sm:size-16 sm:text-[2.15rem]"
      />

      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block font-kid-display text-lg font-semibold leading-snug text-kid-ink">{assignment.title}</span>
        {assignment.subject && <span className="block truncate font-kid-body text-sm text-kid-ink-soft">{assignment.subject}</span>}
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {dots > 0 && <ProgressDots total={dots} done={steps?.done ?? 0} finished={finished} delay={delay + 0.2} />}
          <span
            className={cn(
              'font-kid-body text-sm',
              finished ? 'font-semibold text-kid-green-deep' : status.tone === 'back' ? 'font-semibold text-kid-coral' : 'text-kid-ink-soft'
            )}
          >
            {status.label}
          </span>
        </span>
      </span>

      <span
        aria-hidden="true"
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-full transition-transform duration-200',
          finished
            ? 'kh-pop bg-kid-green-deep text-white shadow-[0_3px_0_#2c6a2a]'
            : status.tone === 'sent'
              ? 'bg-kid-lavender text-kid-purple'
              : 'border-2 border-kid-edge bg-kid-sheet text-kid-ink group-hover:border-kid-teal group-hover:text-kid-teal'
        )}
        style={finished ? { '--kh-delay': `${delay + 0.5}s` } : undefined}
      >
        {finished ? <LuCheck className="size-5" strokeWidth={3} /> : status.tone === 'sent' ? <LuSend className="size-4" /> : <LuArrowRight className="kh-nudge size-4.5" />}
      </span>
    </Link>
  );
}

/** A dashed note in a section that has nothing in it yet. */
export function WorkEmpty({ title, children }) {
  return (
    <div className="kh-pop rounded-[1.3rem] border-2 border-dashed border-kid-edge bg-kid-sheet/60 px-5 py-5 text-center sm:text-left">
      <p className="font-kid-display text-lg font-semibold text-kid-ink">{title}</p>
      <p className="mt-0.5 font-kid-body text-base text-kid-ink-soft">{children}</p>
    </div>
  );
}
