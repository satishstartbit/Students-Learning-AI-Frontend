import { useCallback, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  LuBell,
  LuChartLine,
  LuCreditCard,
  LuLayoutDashboard,
  LuSparkles,
  LuUser,
  LuUsersRound,
} from 'react-icons/lu';
import AppSettingsProvider from '../components/appearance/AppSettingsProvider';
import { Loader } from '../components/common';
import { useApi } from '../hooks/useApi';
import onboardingService from '../modules/onboarding/services/onboarding.service';
import { ParentOnboardingContext } from '../modules/parent/hooks/useParentOnboarding';
import { SubscriptionAccessContext, useAccessStatus } from '../modules/subscription/hooks/useSubscriptionAccess';
import AuthenticatedLayout from './AuthenticatedLayout';
import usePortalTheme from './usePortalTheme';

/**
 * Navigation for the parent area (/parent/*).
 *
 * "My Profile" (the parent's own details) and "My Children" are kept as two
 * distinct entries on purpose - editing yourself and editing a child are
 * different operations with different ownership rules.
 */
const NAV_ITEMS = [
  {
    group: 'Family',
    items: [
      { to: '/parent', label: 'Overview', icon: LuLayoutDashboard, end: true },
      { to: '/parent/profile', label: 'My Profile', icon: LuUser },
      { to: '/parent/children', label: 'My Children', icon: LuUsersRound },
      { to: '/parent/progress', label: 'Progress', icon: LuChartLine },
      { to: '/parent/learning-summary', label: 'Learning Summary', icon: LuSparkles },
      { to: '/parent/subscription', label: 'Subscription', icon: LuCreditCard },
      { to: '/parent/notifications', label: 'Notifications', icon: LuBell },
    ],
  },
];

const ONBOARDING_PATH = '/parent/onboarding';
const SUBSCRIPTION_PATH = '/parent/subscription';

/**
 * Parent pages that stay reachable without a subscription: choosing and paying
 * for one, their own account (details, password, log out), and the one-time
 * family form. Everything else redirects to Subscription.
 */
const SUBSCRIPTION_EXEMPT_PATHS = [SUBSCRIPTION_PATH, '/parent/subscription/checkout', '/parent/profile', ONBOARDING_PATH];

/**
 * The parent area's shell, and its two gates, in order:
 *   1. onboarding - until the family context form is completed once, every
 *      parent page redirects to it.
 *   2. subscription - without a subscription in force, every page outside
 *      SUBSCRIPTION_EXEMPT_PATHS redirects to Subscription. The API refuses
 *      the same requests on its own; this is the friendly version.
 */
export function ParentLayout({ children }) {
  usePortalTheme();
  const location = useLocation();
  const onboarding = useApi(onboardingService.getMyOnboarding, { immediate: true });
  const { run } = onboarding;
  const accessStatus = useAccessStatus();

  const completed = Boolean(onboarding.data?.completed);
  const refresh = useCallback(() => run().catch(() => {}), [run]);
  const context = useMemo(() => ({ completed, refresh }), [completed, refresh]);

  const { loaded, isLoading: accessLoading, hasAccess, reason, refresh: refreshAccess } = accessStatus;
  const access = useMemo(
    () => ({ loaded, isLoading: accessLoading, hasAccess, reason, refresh: refreshAccess }),
    [loaded, accessLoading, hasAccess, reason, refreshAccess]
  );

  const { pathname } = location;
  // If a status couldn't be loaded we can't tell - don't trap the parent.
  const needsOnboarding = Boolean(onboarding.data) && !completed && pathname !== ONBOARDING_PATH;
  const needsSubscription = access.loaded && !access.hasAccess && !SUBSCRIPTION_EXEMPT_PATHS.includes(pathname);

  let content = children;
  if ((onboarding.isLoading && !onboarding.data) || access.isLoading) content = <Loader message="Loading…" />;
  else if (needsOnboarding) content = <Navigate to={ONBOARDING_PATH} replace />;
  else if (needsSubscription) content = <Navigate to={SUBSCRIPTION_PATH} replace />;

  return (
    <ParentOnboardingContext.Provider value={context}>
      <SubscriptionAccessContext.Provider value={access}>
        {/* The parent's own colour theme and light/dark - the same picker and
            stored setting the teacher and student areas use. Inside the
            gates, so it applies on the locked screen too. */}
        <AppSettingsProvider>
          <AuthenticatedLayout navItems={NAV_ITEMS} title="Parent Portal" subtitle="Parent" brand="FP">
            {content}
          </AuthenticatedLayout>
        </AppSettingsProvider>
      </SubscriptionAccessContext.Provider>
    </ParentOnboardingContext.Provider>
  );
}

export default ParentLayout;
