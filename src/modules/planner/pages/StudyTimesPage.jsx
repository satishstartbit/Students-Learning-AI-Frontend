import { Link } from 'react-router-dom';
import { LuArrowLeft } from 'react-icons/lu';
import { EmptyState, Loader, PageHeader } from '../../../components/common';
import { formatName } from '../../../utils/format';
import { useViewingChild } from '../../parent/hooks/useViewingChild';
import AvailabilityEditor from '../components/AvailabilityEditor';
import CommitmentsEditor from '../components/CommitmentsEditor';
import '../planner.css';

/** When the student can study and when they're busy - the planner's inputs (PDF Q5, Q6). */
function StudyTimes({ studentId, title, description, backHref, backLabel }) {
  return (
    <div className="td-page pl-page">
      {backHref && (
        <Link className="pl-link" to={backHref}>
          <LuArrowLeft size={14} aria-hidden="true" /> {backLabel}
        </Link>
      )}
      <PageHeader title={title} description={description} />
      <div className="pl-grid">
        <section className="pl-card" aria-labelledby="pl-times-title">
          <div className="pl-card__head">
            <div>
              <h2 id="pl-times-title" className="pl-card__title">
                Study times
              </h2>
              <p className="pl-card__sub">The times each week that work can be planned into.</p>
            </div>
          </div>
          <AvailabilityEditor studentId={studentId} />
        </section>
        <section className="pl-card" aria-labelledby="pl-busy-title">
          <div className="pl-card__head">
            <div>
              <h2 id="pl-busy-title" className="pl-card__title">
                Busy times
              </h2>
              <p className="pl-card__sub">Practice, family time, plans with friends, appointments - never planned over, and shown on the calendar.</p>
            </div>
          </div>
          <CommitmentsEditor studentId={studentId} />
        </section>
      </div>
    </div>
  );
}

/** /student/study-times */
export function StudentStudyTimesPage() {
  return (
    <StudyTimes
      studentId="me"
      title="Study times"
      description="Tell the planner when you can work. It fits everything around your week."
      backHref="/student/calendar"
      backLabel="Back to Plan"
    />
  );
}

/** /parent/schedule/study-times - for the child picked in the sidebar. */
export function ParentStudyTimesPage() {
  const { viewingChild, children, isLoading } = useViewingChild();
  if (!children.length && !isLoading) {
    return <EmptyState title="No children on your account yet" description="Add a child on My Children first." />;
  }
  if (!viewingChild) return <Loader message="Loading…" />;
  const first = viewingChild.firstName ?? formatName(viewingChild);
  return (
    <StudyTimes
      key={viewingChild.id}
      studentId={viewingChild.id}
      title={`${first}’s study times`}
      description={`When ${first} can work and when they're busy. The plan updates as soon as you save.`}
      backHref="/parent/schedule"
      backLabel="Back to Schedule"
    />
  );
}

export default StudentStudyTimesPage;
