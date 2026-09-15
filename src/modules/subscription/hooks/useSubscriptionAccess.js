import { createContext, useCallback, useContext, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import { SUBSCRIPTION_REQUIRED_EVENT } from '../../../utils/constants';
import subscriptionService from '../services/subscription.service';

/**
 * Subscription access for the signed-in parent or student.
 *
 * `useAccessStatus` is used once per area by its layout (ParentLayout,
 * StudentLayout), which redirects or locks from it and shares it through
 * SubscriptionAccessContext - so pages like Checkout can `refresh()` right
 * after a payment instead of waiting for a reload.
 *
 * The API enforces the same rule on every protected request; when it refuses
 * one mid-session (utils/apiClient.js fires SUBSCRIPTION_REQUIRED_EVENT), the
 * status re-checks itself.
 */
export function useAccessStatus() {
  const access = useApi(subscriptionService.getAccess, { immediate: true });
  const { run } = access;

  const refresh = useCallback(() => run().catch(() => {}), [run]);

  useEffect(() => {
    window.addEventListener(SUBSCRIPTION_REQUIRED_EVENT, refresh);
    return () => window.removeEventListener(SUBSCRIPTION_REQUIRED_EVENT, refresh);
  }, [refresh]);

  return {
    // Unknown (still loading, or the check itself failed) is reported as
    // `loaded: false` - layouts don't lock on a guess; the API still enforces.
    loaded: Boolean(access.data),
    isLoading: access.isLoading && !access.data,
    hasAccess: Boolean(access.data?.hasAccess),
    reason: access.data?.reason ?? null,
    refresh,
  };
}

export const SubscriptionAccessContext = createContext({
  loaded: false,
  isLoading: false,
  hasAccess: true,
  reason: null,
  refresh: () => Promise.resolve(),
});

export function useSubscriptionAccess() {
  return useContext(SubscriptionAccessContext);
}

export default useSubscriptionAccess;
