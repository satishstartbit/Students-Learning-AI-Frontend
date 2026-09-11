import { Navigate } from 'react-router-dom';
import RoutePlaceholder from '../../../routes/RoutePlaceholder';
import { useStudentExperience } from '../hooks/useStudentExperience';

/**
 * One student route, two experiences: the K-5 page for students in
 * Kindergarten-Grade 5, the standard page for everyone else.
 *
 * Configured per route through `props` in routes/routeConfig.js, so the
 * route table stays the one place that says what each path shows:
 *
 *   junior            page for K-5 students
 *   standard          page for Grade 6+ (and unknown grades)
 *   standardRedirect  send Grade 6+ here instead - for K-5-only pages
 *   label             placeholder title when there's no standard page yet
 *
 * Any other props are passed through to whichever page renders.
 */
export default function GradeBandPage({
  junior: JuniorPage,
  standard: StandardPage,
  standardRedirect,
  label,
  ...pageProps
}) {
  const { isJunior } = useStudentExperience();

  if (isJunior && JuniorPage) return <JuniorPage {...pageProps} />;
  if (StandardPage) return <StandardPage {...pageProps} />;
  if (standardRedirect) return <Navigate to={standardRedirect} replace />;
  return <RoutePlaceholder label={label} />;
}
