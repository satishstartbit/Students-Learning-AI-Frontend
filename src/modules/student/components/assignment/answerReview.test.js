import test from 'node:test';
import assert from 'node:assert/strict';
import { optionState, reviewAnswers, starsFor } from './answerReview.js';

const mcq = (id, correctOptionId) => ({ id, answerType: 'mcq', required: true, options: [{ id: `${id}a` }, { id: `${id}b` }], ...(correctOptionId ? { correctOptionId } : {}) });

test('counts right, wrong and look-again answers the way the quiz summary does', () => {
  const questions = [
    mcq('q1'),
    mcq('q2'),
    { id: 'q3', answerType: 'free_text', required: true },
    { id: 'q4', answerType: 'matching', required: true },
    { id: 'q5', answerType: 'mcq', required: false, options: [] },
    mcq('q6'),
  ];
  const submission = {
    answers: [
      { questionId: 'q1', selectedOptionId: 'q1a', isCorrect: true },
      { questionId: 'q2', selectedOptionId: 'q2b', isCorrect: false },
      { questionId: 'q3', textAnswer: 'Because they talk', isCorrect: null },
      { questionId: 'q4', matchedPairs: [{ leftId: 'l', rightId: 'r' }], partialScore: 0.5 },
      // q5 optional and blank; q6 required and blank.
    ],
  };
  const review = reviewAnswers(questions, submission);
  assert.deepEqual(
    review.rows.map((r) => r.state),
    ['right', 'wrong', 'waiting', 'partly', 'skipped', 'wrong']
  );
  assert.equal(review.right, 1);
  assert.equal(review.graded, 5, 'the skipped optional question is left out');
  assert.equal(review.lookAgain, 3);
  assert.deepEqual(review.rows.map((r) => r.number), [1, 2, 3, 4, 5, 6]);
});

test('a matching answer with every pair right counts as right, none right as wrong', () => {
  const q = { id: 'm', answerType: 'matching', required: true };
  const pairs = [{ leftId: 'l', rightId: 'r' }];
  assert.equal(reviewAnswers([q], { answers: [{ questionId: 'm', matchedPairs: pairs, partialScore: 1 }] }).rows[0].state, 'right');
  assert.equal(reviewAnswers([q], { answers: [{ questionId: 'm', matchedPairs: pairs, partialScore: 0 }] }).rows[0].state, 'wrong');
});

test('the right answer is pointed at only when the question carries it (after review)', () => {
  const before = reviewAnswers([mcq('q1')], { answers: [{ questionId: 'q1', selectedOptionId: 'q1b', isCorrect: false }] }).rows[0];
  assert.equal(optionState(before, 'q1b'), 'chosen-wrong');
  assert.equal(optionState(before, 'q1a'), 'plain', 'no hint before the teacher has reviewed it');

  const after = reviewAnswers([mcq('q1', 'q1a')], { answers: [{ questionId: 'q1', selectedOptionId: 'q1b', isCorrect: false }] }).rows[0];
  assert.equal(optionState(after, 'q1a'), 'answer');
  assert.equal(optionState(after, 'q1b'), 'chosen-wrong');

  const right = reviewAnswers([mcq('q1', 'q1a')], { answers: [{ questionId: 'q1', selectedOptionId: 'q1a', isCorrect: true }] }).rows[0];
  assert.equal(optionState(right, 'q1a'), 'chosen-right');
  assert.equal(optionState(right, 'q1b'), 'plain');
});

test('no submission yet: every required question is a miss, nothing crashes', () => {
  const review = reviewAnswers([mcq('q1')], null);
  assert.equal(review.rows[0].state, 'wrong');
  assert.equal(review.rows[0].chosenOptionId, null);
});

test('stars: one per question for a short quiz, five in proportion for a long one', () => {
  assert.deepEqual(starsFor(4, 6), { filled: 4, total: 6 });
  assert.deepEqual(starsFor(0, 0), { filled: 0, total: 0 });
  assert.deepEqual(starsFor(20, 20), { filled: 5, total: 5 });
  assert.deepEqual(starsFor(19, 20), { filled: 4, total: 5 }, 'not all stars unless every answer is right');
  assert.deepEqual(starsFor(6, 12), { filled: 3, total: 5 });
});
