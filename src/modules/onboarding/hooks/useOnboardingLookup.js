import { useMemo } from 'react';
import { useApi } from '../../../hooks/useApi';
import onboardingService from '../services/onboarding.service';

/**
 * One Master Management list for an onboarding form, as { value, label, emoji }
 * options. Values are item names - the same convention the existing profile
 * forms use - so answers line up with what parents and admins already see.
 */
export function useOnboardingLookup(type) {
  const lookup = useApi(onboardingService.listLookup, { immediate: true, args: [type] });

  const options = useMemo(
    () => (lookup.data ?? []).map((item) => ({ value: item.name, label: item.name, emoji: item.icon ?? undefined })),
    [lookup.data]
  );

  return { options, loading: lookup.isLoading, error: lookup.error };
}

export default useOnboardingLookup;
