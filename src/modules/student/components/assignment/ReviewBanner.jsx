import { LuCheck, LuHourglass } from 'react-icons/lu';
import { REVIEWED_STATUSES, personName } from './assignmentLabels';

/**
 * Grade 6+ assignment page, once the work is handed in (the "Detail
 * (Reviewed)" mockup): "Your teacher reviewed your work · You got 4 of 6
 * right", the score, and what the teacher said. Before the review it says
 * the work is waiting for the teacher, with the auto-marked result so far.
 *
 * @param review  reviewAnswers() for this submission
 */
export function ReviewBanner({ item, review }) {
  const submission = item.submission ?? {};
  const reviewed = REVIEWED_STATUSES.includes(item.status);
  const teacher = personName(submission.reviewedBy) || personName(item.assignment.createdBy);
  const result = review.graded ? `You got ${review.right} of ${review.graded} right` : null;
  const written = review.waiting;

  return (
    <section className="ad-review" data-state={reviewed ? 'reviewed' : 'waiting'} aria-labelledby="ad-review-title">
      <div className="ad-review__head">
        <span className="ad-review__icon" aria-hidden="true">
          {reviewed ? <LuCheck size={18} strokeWidth={3} /> : <LuHourglass size={17} />}
        </span>
        <div className="ad-review__text">
          <p className="ad-review__eyebrow">{reviewed ? 'Your teacher reviewed your work' : 'Handed in'}</p>
          <h2 id="ad-review-title" className="ad-review__title">
            {reviewed ? result ?? 'Your work has been reviewed' : 'Waiting for your teacher to check it'}
          </h2>
          {!reviewed && result && (
            <p className="ad-review__sub">
              {result} so far
              {written ? `, and ${written} written ${written === 1 ? 'answer' : 'answers'} for your teacher to mark` : ''}.
            </p>
          )}
        </div>
        {reviewed && submission.score !== null && submission.score !== undefined && (
          <div className="ad-review__score">
            <span>Score</span>
            <strong>{Number(submission.score)}/100</strong>
          </div>
        )}
      </div>

      {reviewed && submission.feedback && (
        <div className="ad-review__note">
          <p className="ad-review__who">{teacher ? `${teacher} says` : 'Your teacher says'}</p>
          <p className="ad-review__feedback">{submission.feedback}</p>
        </div>
      )}
    </section>
  );
}

export default ReviewBanner;
