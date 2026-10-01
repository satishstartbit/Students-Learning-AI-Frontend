import { useId } from 'react';
import { LuCheck } from 'react-icons/lu';
import { cn } from '../../../../lib/utils';
import QuestionAnswer from '../../../assignments/components/QuestionAnswer';
import QuestionPicture from '../../../assignments/media/QuestionPicture';
import { isMcqLike, optionState, starsFor } from '../assignment/answerReview';
import { personName } from '../assignment/assignmentLabels';
import { PaperCard, StarRating } from './PaperKit';

/**
 * The K-5 assignment page once the work is handed in - the "Busy Bee quiz"
 * mockup: "Your teacher checked your work! You got 4 of 6 right!" with a
 * star for each right answer and what the teacher said, then "Your answers":
 * each question with the pick ("You got it!"), and for a miss the right one
 * marked "This one!" (the API sends it only after the teacher's review) and
 * "Let's look again together."
 *
 * `review` is reviewAnswers() for this submission (both bands share it).
 */

const OPTION_LOOK = {
  'chosen-right': 'border-kid-green-deep/45 bg-kid-mint/45',
  'chosen-wrong': 'border-kid-orange bg-kid-yellow/45',
  chosen: 'border-kid-teal/50 bg-kid-sky/50',
  answer: 'border-2 border-dashed border-kid-green-deep/60 bg-kid-sheet',
  plain: 'border-kid-edge bg-kid-sheet',
};

const MARK_LOOK = {
  'chosen-right': 'border-kid-green-deep bg-kid-green-deep text-white',
  'chosen-wrong': 'border-(--color-warning-solid) bg-(--color-warning-solid) text-white',
  chosen: 'border-kid-teal bg-kid-teal',
  answer: 'border-kid-green-deep bg-kid-sheet',
  plain: 'border-kid-edge bg-kid-sheet',
};

const SR_LABEL = {
  'chosen-right': 'your answer, right',
  'chosen-wrong': 'your answer',
  chosen: 'your answer',
  answer: 'the right answer',
  plain: '',
};

const RESULT = {
  right: { text: 'You got it!', className: 'text-kid-green-deep' },
  wrong: { text: "Let's look again together.", className: 'text-(--color-warning-fg)' },
  partly: { text: 'Some of these are right!', className: 'text-kid-ink-soft' },
  waiting: { text: 'Your teacher will check this one.', className: 'text-kid-ink-soft' },
  skipped: { text: 'You skipped this one. That is okay!', className: 'text-kid-ink-soft' },
};

/** "Your teacher checked your work! You got 4 of 6 right!" - or, before the review, that it's handed in. */
export function KidReviewCard({ item, review, reviewed }) {
  const submission = item.submission ?? {};
  const teacher = personName(submission.reviewedBy) || personName(item.assignment.createdBy);
  const stars = starsFor(review.right, review.graded);
  const hasScore = submission.score !== null && submission.score !== undefined;

  return (
    <section aria-labelledby="kid-result-title" className="rounded-[1.75rem] border border-kid-mint bg-kid-mint/35 px-5 py-5 shadow-paper sm:px-7 sm:py-6">
      <p className="font-kid-body text-base text-kid-ink-soft">{reviewed ? 'Your teacher checked your work!' : 'You handed it in!'}</p>
      <p id="kid-result-title" className="mt-1 font-kid-display text-2xl font-semibold leading-tight text-kid-ink sm:text-3xl">
        {review.graded ? `You got ${review.right} of ${review.graded} right!` : reviewed ? 'All done!' : 'Your teacher will check it soon.'}
      </p>
      {stars.total > 0 && (
        <span aria-hidden="true" className="mt-3 block">
          <StarRating stars={stars.filled} max={stars.total} className="flex-wrap gap-1 [&_svg]:size-7" />
        </span>
      )}
      {!reviewed && review.graded > 0 && <p className="mt-3 text-base text-kid-ink-soft">Your teacher will check it soon.</p>}
      {reviewed && hasScore && review.graded === 0 && (
        <p className="mt-2 font-kid-display text-lg font-semibold text-kid-ink">Score: {Number(submission.score)} out of 100</p>
      )}
      {reviewed && submission.feedback && (
        <div className="mt-4 rounded-2xl bg-kid-sheet px-4 py-3">
          <p className="text-sm text-kid-ink-soft">{teacher ? `${teacher} says` : 'Your teacher says'}</p>
          <p className="mt-1 whitespace-pre-wrap text-lg leading-snug text-kid-ink">{submission.feedback}</p>
        </div>
      )}
    </section>
  );
}

function KidReviewedQuestion({ row }) {
  const promptId = useId();
  const { question } = row;
  const result = RESULT[row.state];

  // Matching keeps the kid matching board, read-only with its own result line.
  if (question.answerType === 'matching') {
    return (
      <QuestionAnswer
        question={question}
        number={row.number}
        answer={row.answer ?? {}}
        onChange={() => {}}
        readOnly
        result={{ isCorrect: row.answer?.isCorrect ?? null, partialScore: row.answer?.partialScore ?? null }}
      />
    );
  }

  return (
    <PaperCard as="article" tone="sheet" aria-labelledby={promptId} className="border border-kid-edge/70 px-4 py-4 sm:px-5">
      <h3 id={promptId} className="font-kid-display text-lg font-semibold leading-snug text-kid-ink">
        {row.number}. {question.prompt}
      </h3>
      {question.image && <QuestionPicture image={question.image} size="md" className="mt-3" />}
      {question.answerType === 'passage_mcq' && question.passage && (
        <details className="mt-2 text-base text-kid-ink-soft">
          <summary className="cursor-pointer font-kid-display font-medium text-kid-teal">Read the story again</summary>
          <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-kid-paper px-4 py-3 text-kid-ink">{question.passage}</p>
        </details>
      )}

      {isMcqLike(question) ? (
        // One per row on a phone (the phone mockup), side by side from `sm` up.
        <ul className="mt-3 grid list-none grid-cols-1 gap-2.5 p-0 sm:[grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
          {(question.options ?? []).map((option) => {
            const state = optionState(row, option.id);
            return (
              <li key={option.id} className={cn('flex items-start gap-2.5 rounded-xl border px-3 py-3 text-base text-kid-ink', OPTION_LOOK[state])}>
                <span aria-hidden="true" className={cn('mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 font-kid-display text-sm font-bold', MARK_LOOK[state])}>
                  {state === 'chosen-right' ? <LuCheck className="size-3.5" strokeWidth={3.5} /> : state === 'chosen-wrong' ? '!' : null}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  {option.image ? <QuestionPicture image={option.image} size="xs" /> : null}
                  {option.text && <span className="break-words">{option.text}</span>}
                  {state === 'answer' && <span className="font-kid-display text-sm font-semibold text-kid-green-deep">This one!</span>}
                  {SR_LABEL[state] && state !== 'answer' && <span className="ui-sr-only">({SR_LABEL[state]})</span>}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-kid-paper px-4 py-3 text-base text-kid-ink">
          {row.answer?.textAnswer?.trim() || 'No answer'}
        </p>
      )}

      {result && <p className={cn('mt-3 font-kid-display text-base font-medium', result.className)}>{result.text}</p>}
    </PaperCard>
  );
}

/** "Your answers": every question the way it went, and anything the student wrote. */
export function KidAnswerList({ review, content }) {
  if (!review.total && !content) return null;

  return (
    <section aria-labelledby="kid-answers-title" className="flex flex-col gap-4">
      <h2 id="kid-answers-title" className="font-kid-display text-xl font-semibold text-kid-ink">
        {review.total ? 'Your answers' : 'Your work'}
      </h2>
      {review.rows.map((row) => (
        <KidReviewedQuestion key={row.question.id} row={row} />
      ))}
      {content && (
        <PaperCard tone="sheet" className="border border-kid-edge/70 px-4 py-4 sm:px-5">
          <p className="text-sm text-kid-ink-soft">{review.total ? 'Your note for your teacher' : 'What you wrote'}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-lg text-kid-ink">{content}</p>
        </PaperCard>
      )}
    </section>
  );
}
