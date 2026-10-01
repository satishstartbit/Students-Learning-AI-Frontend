/**
 * How each handed-in answer went, for the assignment page's "Your answers"
 * (both bands). Pure, so it has tests (answerReview.test.js).
 *
 *   right    an mcq pick marked correct, a written answer the teacher marked
 *            right, or every pair matched
 *   wrong    marked wrong, no pairs matched, or a required question left blank
 *   partly   some pairs matched (matching only)
 *   waiting  the teacher hasn't marked it yet (written answers)
 *   skipped  an optional question left blank - neither helps nor hurts
 *
 * The same rules as the backend's quiz summary (assignmentQuestion.service
 * #summarize), so "4 right · 2 to look at again" matches "You got 4 of 6".
 * `correctOptionId` is on a question only once the teacher has reviewed the
 * work; before that a wrong answer says so without showing the right one.
 */

const MCQ_LIKE = ['mcq', 'passage_mcq'];

export const isMcqLike = (question) => MCQ_LIKE.includes(question?.answerType);

function isAnswered(question, answer) {
  if (!answer) return false;
  if (isMcqLike(question)) return Boolean(answer.selectedOptionId);
  if (question.answerType === 'matching') return (answer.matchedPairs ?? []).length > 0;
  return Boolean(answer.textAnswer?.trim());
}

function stateOf(question, answer) {
  const answered = isAnswered(question, answer);
  if (!answered && question.required === false) return 'skipped';
  if (question.answerType === 'matching') {
    if (!answered) return 'wrong';
    const score = answer.partialScore;
    if (score === null || score === undefined) return 'waiting';
    if (score >= 1) return 'right';
    return score <= 0 ? 'wrong' : 'partly';
  }
  if (!answered) return 'wrong';
  if (answer.isCorrect === true) return 'right';
  if (answer.isCorrect === false) return 'wrong';
  return 'waiting';
}

export function reviewAnswers(questions = [], submission = null) {
  const byQuestion = new Map((submission?.answers ?? []).map((a) => [a.questionId, a]));
  const rows = questions.map((question, index) => {
    const answer = byQuestion.get(question.id) ?? null;
    return {
      question,
      number: index + 1,
      answer,
      state: stateOf(question, answer),
      chosenOptionId: answer?.selectedOptionId ?? null,
      correctOptionId: question.correctOptionId ?? null,
    };
  });
  const count = (state) => rows.filter((r) => r.state === state).length;
  const right = count('right');
  const wrong = count('wrong');
  const partly = count('partly');
  const waiting = count('waiting');
  return {
    rows,
    total: rows.length,
    right,
    wrong,
    partly,
    waiting,
    skipped: count('skipped'),
    /** Everything that counts towards "X of Y right". */
    graded: right + wrong + partly + waiting,
    /** "Look again": wrong or only partly right. */
    lookAgain: wrong + partly,
  };
}

/** How an option looks in a reviewed question: the pick (right or not), the right answer, or neither. */
export function optionState(row, optionId) {
  const chosen = row.chosenOptionId === optionId;
  if (chosen) return row.state === 'right' ? 'chosen-right' : row.state === 'wrong' ? 'chosen-wrong' : 'chosen';
  if (row.state === 'wrong' && row.correctOptionId === optionId) return 'answer';
  return 'plain';
}

/**
 * Stars for "You got 4 of 6 right": one per question for a short quiz,
 * otherwise `max` stars filled in proportion. Never shows zero stars for a
 * perfect score or all stars for a miss.
 */
export function starsFor(right, graded, max = 10) {
  if (!graded) return { filled: 0, total: 0 };
  if (graded <= max) return { filled: right, total: graded };
  const total = 5;
  const filled = right === graded ? total : Math.min(total - 1, Math.round((right / graded) * total));
  return { filled, total };
}
