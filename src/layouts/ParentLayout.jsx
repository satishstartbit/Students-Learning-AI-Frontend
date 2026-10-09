import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  LuBell,
  LuCalendarDays,
  LuChartLine,
  LuCreditCard,
  LuLayoutGrid,
  LuSparkles,
  LuStickyNote,
  LuUser,
  LuUsersRound,
} from 'react-icons/lu';
import AppSettingsProvider from '../components/appearance/AppSettingsProvider';
import { Loader } from '../components/common';
import SubjectColorsProvider from '../components/subjects/SubjectColorsProvider';
import { useApi } from '../hooks/useApi';
import onboardingService from '../modules/onboarding/services/onboarding.service';
import ConsentGate from '../components/legal/ConsentGate';
import { ParentOnboardingContext } from '../modules/parent/hooks/useParentOnboarding';
import ViewingChildPicker from '../modules/parent/components/ViewingChildPicker';
import ViewingChildChip from '../modules/parent/components/ViewingChildChip';
import { ViewingChildContext } from '../modules/parent/hooks/useViewingChild';
import parentService from '../modules/parent/services/parent.service';
import AccessBanner from '../modules/subscription/components/AccessBanner';
import { SubscriptionAccessContext, useAccessStatus } from '../modules/subscription/hooks/useSubscriptionAccess';
import AuthenticatedLayout from './AuthenticatedLayout';
import usePortalTheme from './usePortalTheme';

const VIEWING_CHILD_KEY = 'eflp.viewingChildId';

/**
 * Navigation for the parent area (/parent/*).
 *
 * Matches the sidebar mockup: the VIEWING child card and the child-specific
 * pages (Overview, Progress, Learning Summary) share one outlined box
 * (`withExtra` puts the picker inside it; styles `vc-frame`), then the
 * family-level pages (My Children - children and parents on one page -
 * My Profile, Subscription, Notifications) in a labelled "Family" group.
 */
const NAV_ITEMS = [
  {
    group: null,
    withExtra: true,
    className: 'vc-frame',
    items: [
      { to: '/parent', label: 'Overview', icon: LuLayoutGrid, end: true },
      { to: '/parent/progress', label: 'Progress', icon: LuChartLine },
      { to: '/parent/schedule', label: 'Schedule', icon: LuCalendarDays },
      { to: '/parent/notes', label: 'Notes', icon: LuStickyNote },
      { to: '/parent/learning-summary', label: 'Learning Summary', icon: LuSparkles },
    ],
  },
  {
    group: 'Family',
    className: 'vc-section',
    items: [
      { to: '/parent/children', label: 'My Children', icon: LuUsersRound },
      { to: '/parent/profile', label: 'My Profile', icon: LuUser },
      { to: '/parent/subscription', label: 'Subscription', icon: LuCreditCard },
      { to: '/parent/notifications', label: 'Notifications', icon: LuBell },
    ],
  },
];

/**
 * The phone tab bar (the My Children mobile mockup). My Profile and
 * Notifications are in the avatar's "More" sheet.
 */
const MOBILE_TABS = [
  { to: '/parent', label: 'Overview', icon: LuLayoutGrid, end: true },
  { to: '/parent/children', label: 'Children', icon: LuUsersRound },
  { to: '/parent/progress', label: 'Progress', icon: LuChartLine },
  { to: '/parent/learning-summary', label: 'Learning', icon: LuSparkles },
  { to: '/parent/subscription', label: 'Plan', icon: LuCreditCard },
];

const ONBOARDING_PATH = '/parent/onboarding';
const SUBSCRIPTION_PATH = '/parent/subscription';

/**
 * Parent pages that stay reachable without a subscription: choosing and paying
 * for one, their own account (details, password, log out), the one-time
 * family form, and Notifications - so billing notices ("Payment refunded…")
 * reach a parent whose plan has ended (the API doesn't paywall them either).
 * Everything else redirects to Subscription.
 */
const SUBSCRIPTION_EXEMPT_PATHS = [SUBSCRIPTION_PATH, '/parent/subscription/checkout', '/parent/profile', ONBOARDING_PATH, '/parent/notifications'];

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

  // --- Viewing child (sidebar picker) -----------------------------------
  const childrenApi = useApi(parentService.listChildren);
  const { run: runChildren } = childrenApi;
  const [viewingChildId, setViewingChildIdRaw] = useState(() => {
    try { return localStorage.getItem(VIEWING_CHILD_KEY) || ''; } catch { return ''; }
  });

  const completed = Boolean(onboarding.data?.completed);

  // Fetch the children list once onboarding is complete.
  useEffect(() => {
    if (completed) runChildren({ limit: 100 }).catch(() => {});
  }, [completed, runChildren]);

  const childrenList = useMemo(() => childrenApi.data ?? [], [childrenApi.data]);
  // Archived children keep their history but don't count as "Parent of N".
  const activeChildCount = childrenList.filter((c) => !c.archived).length;

  const viewingChild = useMemo(() => {
    if (!childrenList.length) return null;
    return childrenList.find((c) => c.id === viewingChildId) || childrenList[0];
  }, [childrenList, viewingChildId]);

  const setViewingChildId = useCallback((id) => {
    setViewingChildIdRaw(id);
    try { localStorage.setItem(VIEWING_CHILD_KEY, id); } catch { /* private browsing */ }
  }, []);

  // Stable on purpose: pages put it in effect deps (My Children's load), and a
  // new function per fetch re-ran their effect, which refetched, forever.
  const refreshChildren = useCallback(() => runChildren({ limit: 100 }).catch(() => {}), [runChildren]);

  // Loading until the first answer: the fetch only starts in an effect after
  // onboarding is known, so "not loading yet" must not read as "no children"
  // (the Overview would flash "Add your first child").
  const childrenLoading = completed && !childrenApi.data && !childrenApi.error;

  const viewingContext = useMemo(
    () => ({
      viewingChild,
      children: childrenList,
      setViewingChildId,
      isLoading: childrenLoading,
      refresh: refreshChildren,
    }),
    [viewingChild, childrenList, setViewingChildId, childrenLoading, refreshChildren],
  );

  // --- Onboarding + subscription gates ----------------------------------
  const refresh = useCallback(() => run().catch(() => {}), [run]);
  const context = useMemo(() => ({ completed, refresh }), [completed, refresh]);

  const { loaded, isLoading: accessLoading, hasAccess, reason, state, readOnly, capabilities, message, graceEndsAt, refresh: refreshAccess } =
    accessStatus;
  const access = useMemo(
    () => ({ loaded, isLoading: accessLoading, hasAccess, reason, state, readOnly, capabilities, message, graceEndsAt, refresh: refreshAccess }),
    [loaded, accessLoading, hasAccess, reason, state, readOnly, capabilities, message, graceEndsAt, refreshAccess]
  );

  const { pathname } = location;
  const needsOnboarding = Boolean(onboarding.data) && !completed && pathname !== ONBOARDING_PATH;
  // After grace (readOnly) the family keeps reading everything saved - no redirect (PDF Q11).
  const needsSubscription = access.loaded && !access.hasAccess && !access.readOnly && !SUBSCRIPTION_EXEMPT_PATHS.includes(pathname);

  let content = (
    <>
      <AccessBanner access={access} role="PARENT" />
      {children}
    </>
  );
  if ((onboarding.isLoading && !onboarding.data) || access.isLoading) content = <Loader message="Loading…" />;
  else if (needsOnboarding) content = <Navigate to={ONBOARDING_PATH} replace />;
  else if (needsSubscription) content = <Navigate to={SUBSCRIPTION_PATH} replace />;

  return (
    <ParentOnboardingContext.Provider value={context}>
      <SubscriptionAccessContext.Provider value={access}>
        <ViewingChildContext.Provider value={viewingContext}>
          <AppSettingsProvider>
            {/* The admin's subject colours, so subjects look the same here as on the child's screens. */}
            <SubjectColorsProvider>
              <AuthenticatedLayout
                navItems={NAV_ITEMS}
                mobileTabs={MOBILE_TABS}
                title="Parent Portal"
                subtitle="Parent"
                brand="FP"
                sidebarExtra={<ViewingChildPicker />}
                // Phones: the child being viewed sits next to the logo (the "child view" mockup).
                mobileBrandSlot={childrenList.length ? <ViewingChildChip /> : undefined}
                // "Parent of 3" under the name, as teachers get their school and students their grade.
                accountSubtitle={activeChildCount ? `Parent of ${activeChildCount}` : undefined}
                // The bell is a link to Notifications (no dropdown list).
                notificationsPath="/parent/notifications"
              >
                {/* Terms/Privacy and consent for each child come first (Phase 1 §12). */}
                <ConsentGate>{content}</ConsentGate>
              </AuthenticatedLayout>
            </SubjectColorsProvider>
          </AppSettingsProvider>
        </ViewingChildContext.Provider>
      </SubscriptionAccessContext.Provider>
    </ParentOnboardingContext.Provider>
  );
}

export default ParentLayout;
