import { Navigate, useLocation } from 'react-router-dom';
import { ErrorState, Loader } from '../../../components/common';
import { useStudentExperience } from '../../student/hooks/useStudentExperience';
import { KidOops, KidSkeleton } from '../../student/components/kid/KidStates';
import { useTodayCheckIn } from '../hooks/useTodayCheckIn';
import SkipCheckInPrompt from './SkipCheckInPrompt';

/**
 * Route guard: work screens (Assignments, Plan, Focus, AI Assistant) need
 * today's check-in first. Without one, the student is sent to Check In with
 * `?next=` set, and returned here once they've checked in.
 *
 * Only for the grades the "Daily check-in" setting names (`checkInRequired`
 * from GET /auth/me - the client's rule is Kindergarten to Grade 6). An older
 * student is never blocked: the first time each day they go to work without
 * checking in, SkipCheckInPrompt asks gently ("Check in now" / "Continue to
 * my work"), and a skip is recorded so Home can invite them back later.
 *
 * Applied per route through `guards` in routes/routeConfig.js.
 */
export function RequireCheckIn({ children }) {
  const { checkedIn, isLoading, error, refresh } = useTodayCheckIn();
  const { isJunior, checkInRequired } = useStudentExperience();
  const location = useLocation();

  // Optional for this student: straight through, no waiting on the lookup -
  // just the once-a-day gentle question on top (client answers, 4).
  if (!checkInRequired) {
    return (
      <>
        {children}
        <SkipCheckInPrompt />
      </>
    );
  }

  if (isLoading) {
    return isJunior ? (
      <div data-kid-page className="kid-ui mx-auto max-w-2xl px-4 py-10">
        <KidSkeleton className="h-64" />
      </div>
    ) : (
      <Loader message="Getting your day ready…" />
    );
  }

  // Can't tell whether they've checked in - don't guess either way.
  if (error) {
    return isJunior ? (
      <div data-kid-page className="kid-ui mx-auto max-w-2xl px-4 py-10">
        <KidOops message="We couldn't check your check-in." onRetry={refresh} error={error} />
      </div>
    ) : (
      <ErrorState title="We couldn't load your check-in" error={error} onRetry={refresh} />
    );
  }

  if (!checkedIn) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/student/check-in?next=${next}`} replace />;
  }

  return children;
}

export default RequireCheckIn;
