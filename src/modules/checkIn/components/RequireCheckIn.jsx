import { Navigate, useLocation } from 'react-router-dom';
import { ErrorState, Loader } from '../../../components/common';
import { useStudentExperience } from '../../student/hooks/useStudentExperience';
import { KidOops, KidSkeleton } from '../../student/components/kid/KidStates';
import { useTodayCheckIn } from '../hooks/useTodayCheckIn';

/**
 * Route guard: work screens (Assignments, Plan, Focus, AI Assistant) need
 * today's check-in first. Without one, the student is sent to Check In with
 * `?next=` set, and returned here once they've checked in.
 *
 * Only for the kid band, though: `checkInRequired` (useStudentExperience,
 * from the server's KIDS_UI with VITE_KIDS_UI as the fallback) is true for
 * K-5 and false above it. An older student can still check in whenever they
 * want - Check In stays in their nav and their day still records it - but
 * nothing here blocks their way to the work. Moving KIDS_UI moves which
 * grades are held at this gate, with no code change.
 *
 * Applied per route through `guards` in routes/routeConfig.js.
 */
export function RequireCheckIn({ children }) {
  const { checkedIn, isLoading, error, refresh } = useTodayCheckIn();
  const { isJunior, checkInRequired } = useStudentExperience();
  const location = useLocation();

  // Optional for this student: straight through, and no waiting on the
  // check-in lookup to decide it.
  if (!checkInRequired) return children;

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
        <KidOops message="We couldn't check your check-in." onRetry={refresh} />
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
