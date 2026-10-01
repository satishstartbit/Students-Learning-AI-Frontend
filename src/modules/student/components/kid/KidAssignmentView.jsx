import { Link } from 'react-router-dom';
import { LuChevronLeft, LuClock, LuFileText } from 'react-icons/lu';
import readingScene from '../../../../assets/kid/reading-scene.webp';
import { cn } from '../../../../lib/utils';
import { formatDuration } from '../../../../utils/date';
import { useFocusSteps } from '../../hooks/useFocusSteps';
import { reviewAnswers } from '../assignment/answerReview';
import { HANDED_IN_STATUSES, REVIEWED_STATUSES } from '../assignment/assignmentLabels';
import { StickerArt } from '../rewards/StickerArt';
import { KidAnswerList, KidReviewCard } from './KidAssignmentReview';
import { KidStickerSlot } from './KidStickerSlot';
import { KidTaskFocus } from './KidTaskFocus';
import { DueChip, PaperCard, SubjectTile } from './PaperKit';

/**
 * The K-5 assignment page (pages/AssignmentDetailPage.jsx), built to the
 * "Busy Bee quiz" mockup: "Back to my work", the task on a paper header
 * (subject picture, title, subject · topic, one dot per step done), then
 *
 *   still to do   the page's background sound and overdue note (`notices`),
 *                 what to do, the files, the focus clock and the work itself
 *                 (`children`: StudentWork), in one comfortable column
 *   handed in     "How did you do?" (with a sticker slot once reviewed), the
 *                 result card and "Your answers", beside the reading scene
 *                 on wide screens; on a phone or tablet (the phone mockup)
 *                 the scene is a strip under the header and the picture sits
 *                 above the title, with the flame in the card's corner
 *
 * Grade 6+ has components/assignment/StandardAssignmentView.jsx.
 */

/** One dot per step (up to ten), filled as steps are done - "5 of 5 done". */
function StepDots({ steps }) {
  const total = steps.steps.length;
  if (!total) return null;
  const shown = Math.min(total, 10);
  const filled = Math.round((steps.doneCount / total) * shown);
  return (
    <span className="inline-flex items-center gap-2 text-base text-kid-ink-soft">
      <span aria-hidden="true" className="flex gap-1">
        {Array.from({ length: shown }, (_, i) => (
          <span key={i} className={cn('size-3 rounded-full', i < filled ? 'bg-kid-teal' : 'bg-kid-paper-deep')} />
        ))}
      </span>
      {steps.doneCount} of {total} done
    </span>
  );
}

/** What the task asks for while it's still to do: the teacher's words, how long, and the files. */
function KidTaskInfo({ assignment }) {
  const files = assignment.files ?? [];
  if (!assignment.description && !files.length && !assignment.estimatedMinutes) return null;

  return (
    <PaperCard as="section" tone="sheet" aria-labelledby="kid-todo-title" className="border border-kid-edge/70 px-5 py-5 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="kid-todo-title" className="font-kid-display text-xl font-semibold text-kid-ink">
          What to do
        </h2>
        {assignment.estimatedMinutes ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-kid-paper-deep px-3 py-1 font-kid-display text-sm font-medium text-kid-ink-soft">
            <LuClock className="size-4" aria-hidden="true" />
            About {formatDuration(assignment.estimatedMinutes)}
          </span>
        ) : null}
      </div>
      {assignment.description && <p className="mt-2 whitespace-pre-wrap text-lg leading-relaxed text-kid-ink">{assignment.description}</p>}
      {files.length > 0 && (
        <ul className="mt-4 flex list-none flex-col gap-2 p-0">
          {files.map((file) => (
            <li key={file.id}>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-kid-edge bg-kid-paper px-4 py-3 text-base text-kid-ink no-underline hover:bg-kid-paper-deep/60"
              >
                <LuFileText className="size-5 shrink-0 text-kid-teal" aria-hidden="true" />
                <span className="min-w-0 truncate">{file.originalFilename}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </PaperCard>
  );
}

export function KidAssignmentView({ item, assignmentId, working, notices, children }) {
  const a = item.assignment;
  const steps = useFocusSteps(assignmentId);
  const handedIn = HANDED_IN_STATUSES.includes(item.status);
  const reviewed = REVIEWED_STATUSES.includes(item.status);
  const review = handedIn ? reviewAnswers(a.questions ?? [], item.submission) : null;
  const kind = [a.subject, a.topic?.name ?? a.taskType?.name].filter(Boolean).join(' · ');

  return (
    <div data-kid-page className="kid-ui mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-8">
      <Link to="/student/assignments" className="inline-flex items-center gap-1 font-kid-body text-base text-kid-ink-soft no-underline hover:text-kid-ink">
        <LuChevronLeft className="size-4" aria-hidden="true" />
        Back to my work
      </Link>

      {/* Phone (the phone mockup): the subject picture on top, the title under it and the
          flame in the card's corner. From `sm` up: picture beside the title, flame after it. */}
      <PaperCard
        as="header"
        tone="sheet"
        className="mt-4 flex flex-col items-start gap-4 border border-kid-edge/70 px-5 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-7 sm:py-6"
      >
        <SubjectTile subject={a.subject} size="xl" className="size-20 rounded-[1.25rem] [&_svg]:size-10" />
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-x-2 font-kid-display text-4xl font-semibold leading-tight text-kid-ink">
            <span className="min-w-0 break-words">{a.title}</span>
            {reviewed && <StickerArt slug="flame" className="absolute right-4 top-4 size-10 shrink-0 sm:static" />}
          </h1>
          {kind && <p className="mt-1 text-base text-kid-ink-soft">{kind}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <StepDots steps={steps} />
            {!handedIn && <DueChip dueDate={a.dueDate} status={item.status} />}
          </div>
        </div>
      </PaperCard>

      {/* Phones and tablets: the reading scene as a strip under the header (the phone
          mockup). Wide screens keep it bottom-left beside the answers (below). */}
      {handedIn && (
        <div aria-hidden="true" className="mx-auto mt-5 w-full max-w-md overflow-hidden rounded-[1.75rem] lg:hidden">
          <img src={readingScene} alt="" width="640" height="803" decoding="async" className="aspect-[5/3] h-auto w-full object-cover object-[50%_58%]" />
        </div>
      )}

      {handedIn ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-10">
          <div className="flex min-w-0 flex-col gap-5 lg:col-start-2 lg:row-start-1">
            {/* A clock still running for this task stays reachable, so it can be finished. */}
            <KidTaskFocus assignmentId={assignmentId} available={false} />
            <div className="relative flex items-center gap-3">
              <h2 className="font-kid-display text-2xl font-semibold text-kid-ink">{reviewed ? 'How did you do?' : 'All handed in!'}</h2>
              {reviewed && <KidStickerSlot key={assignmentId} assignmentId={assignmentId} />}
            </div>
            <KidReviewCard item={item} review={review} reviewed={reviewed} />
            <KidAnswerList review={review} content={item.submission?.content} />
          </div>

          {/* The reading scene: bottom-left beside the answers on a wide screen, staying in view while they scroll. */}
          <div aria-hidden="true" className="hidden lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:justify-end">
            <img src={readingScene} alt="" width="640" height="803" decoding="async" className="sticky bottom-0 h-auto w-full max-w-[26rem]" />
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-5">
          {notices}
          <KidTaskInfo assignment={a} />
          <KidTaskFocus assignmentId={assignmentId} available={working} />
          {children}
        </div>
      )}
    </div>
  );
}

export default KidAssignmentView;
