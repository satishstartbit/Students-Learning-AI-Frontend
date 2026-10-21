import { useEffect, useState } from 'react';
import masterGenericService from '../../masterManagement/services/masterGeneric.service';

/** The default lookup source: Master Management, for Super-Admin sessions only. */
const defaultLookupFetcher = (masterType) =>
  masterGenericService
    .listItems(masterType, { status: 'active', sortBy: 'display_order', sortOrder: 'asc', limit: 100 })
    .then((res) => (res?.data ?? []).map((item) => ({ value: item.name, label: item.name })));

/**
 * Options for one master lookup (Subjects, Grade Levels, ...).
 *
 * Defaults to `/admin/master`, which requires a Super Admin session. Callers
 * without one (the parent's Add Child form, Complete your profile) pass
 * `lookupFetcher` to read the same data from a role-appropriate endpoint.
 */
export function useMasterOptions(masterType, lookupFetcher = defaultLookupFetcher) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    lookupFetcher(masterType)
      .then((items) => {
        if (cancelled) return;
        setOptions(items ?? []);
      })
      .catch(() => {
        /* an empty list just means nothing to pick from */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [masterType, lookupFetcher]);

  return { options, loading };
}

export default useMasterOptions;
