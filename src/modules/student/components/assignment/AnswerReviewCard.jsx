import { useId, useState } from 'react';
import { LuCheck } from 'react-icons/lu';
import QuestionAnswer from '../../../assignments/components/QuestionAnswer';
import QuestionPicture from '../../../assignments/media/QuestionPicture';
import { isMcqLike, optionState } from './answerReview';

/**
 * "Your answers" on the Grade 6+ assignment page once the work is handed in
 * (the "Detail (Reviewed)" mockup): "6 questions · 4 right · 2 to look at
 * again", All / Look again, and each question with the student's pick.
 * After the teacher's review a wrong answer also shows the right option
 * (the API sends it only then). Matching questions keep the shared
 * QuestionAnswer view; a task without questions shows what was written.
 *
 * @param review  reviewAnswers() for this submission
 */

// Read out beside the pick; the right answer already says so on screen ("Right answer").
const SR_LABEL = {
  'chosen-right': 'Your answer - correct',
  'chosen-wrong': 'Your answer - not quite',
  chosen: 'Your answer',
  answer: '',
  plain: '',
};

function resultLine(row) {
  switch (row.state) {
    case 'right':
      return 'Correct. Well done!';
    case 'wrong':
      if (!row.answer) return 'You left this one blank. Look again at it.';
      if (isMcqLike(row.question)) return row.correctOptionId ? 'Not quite. The right answer is marked.' : 'Not quite. Look again at this one.';
      return 'Not quite this time. Look again at it.';
    case 'waiting':
      return 'Your teacher will check this one.';
    case 'skipped':
      return 'Optional - you skipped this one.';
    default:
      return '';
  }
}

function summaryLine(review) {
  return [
    `${review.total} ${review.total === 1 ? 'question' : 'questions'}`,
    `${review.right} right`,
    review.lookAgain ? `${review.lookAgain} to look at again` : null,
    review.waiting ? `${review.waiting} for your teacher to check` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function ReviewedQuestion({ row }) {
  const promptId = useId();
  const { question } = row;

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
    <article className="ad-q" data-state={row.state} aria-labelledby={promptId}>
      <p className="ad-q__eyebrow">
        Question {row.number}
        {question.required === false ? ' (optional)' : ''}
      </p>
      <h3 id={promptId} className="ad-q__prompt">
        {question.prompt}
      </h3>
      {question.image && <QuestionPicture image={question.image} size="md" className="ad-q__picture" />}
      {question.answerType === 'passage_mcq' && question.passage && (
        <details className="ad-q__passage">
          <summary>Read the passage again</summary>
          <p>{question.passage}</p>
        </details>
      )}

      {isMcqLike(question) ? (
        <ul className="ad-q__options">
          {(question.options ?? []).map((option) => {
            const state = optionState(row, option.id);
            return (
              <li key={option.id} className="ad-q__option" data-state={state}>
                <span className="ad-q__mark" aria-hidden="true">
                  {state === 'chosen-right' ? <LuCheck size={11} strokeWidth={3.5} /> : state === 'chosen-wrong' ? '!' : null}
                </span>
                {option.image ? <QuestionPicture image={option.image} size="xs" /> : null}
                <span className="ad-q__text">
                  {option.text}
                  {state === 'answer' && <span className="ad-q__tag">Right answer</span>}
                </span>
                {SR_LABEL[state] && <span className="ui-sr-only"> ({SR_LABEL[state]})</span>}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="ad-q__written">{row.answer?.textAnswer?.trim() || 'No answer'}</p>
      )}

      <p className="ad-q__result" data-state={row.state}>
        {resultLine(row)}
      </p>
    </article>
  );
}

export function AnswerReviewCard({ review, content }) {
  const [filter, setFilter] = useState('all');
  if (!review.total && !content) return null;

  const rows = filter === 'again' ? review.rows.filter((r) => r.state === 'wrong' || r.state === 'partly') : review.rows;

  return (
    <section className="ad-card" aria-labelledby="ad-answers-title">
      <div className="ad-answers__head">
        <div style={{ minWidth: 0 }}>
          <h2 id="ad-answers-title" className="ad-card__title">
            {review.total ? 'Your answers' : 'Your work'}
          </h2>
          {review.total > 0 && <p className="ad-card__hint">{summaryLine(review)}</p>}
        </div>
        {review.lookAgain > 0 && (
          <div className="ad-chips" role="group" aria-label="Which answers to show">
            <button type="button" className="ad-chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
              {filter === 'all' && <LuCheck size={12} strokeWidth={3} aria-hidden="true" />} All
            </button>
            <button type="button" className="ad-chip" aria-pressed={filter === 'again'} onClick={() => setFilter('again')}>
              {filter === 'again' && <LuCheck size={12} strokeWidth={3} aria-hidden="true" />} Look again · {review.lookAgain}
            </button>
          </div>
        )}
      </div>

      {review.total > 0 && (
        <ol className="ad-qlist">
          {rows.map((row) => (
            <li key={row.question.id}>
              <ReviewedQuestion row={row} />
            </li>
          ))}
        </ol>
      )}

      {content && (
        <div className="ad-written">
          <p className="ad-written__label">{review.total ? 'Your note for your teacher' : 'What you wrote'}</p>
          <p className="ad-written__text">{content}</p>
        </div>
      )}
    </section>
  );
}

export default AnswerReviewCard;
