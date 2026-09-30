import { useMemo } from 'react';
import { useApi } from '../../../hooks/useApi';
import lookupService from '../../../services/lookup.service';

/**
 * The "what is making it hard right now?" vocabulary, straight from Master
 * Management: the groups, the reasons inside each, and the one or two
 * strategies each reason points at (backend: /lookups/difficulty-picker,
 * which resolves that mapping so no screen has to).
 *
 * Both students' versions read it through this hook - the Grade 6+ dialog
 * and the K-5 one - so adding, rewording or deactivating any of it is a
 * Super Admin edit, never a release.
 *
 * `strategiesFor(codes)` answers the other half: given what a student
 * picked, which strategies to offer back, most-pointed-at first and never
 * more than a couple, because a child who says they are stuck does not need
 * a list of fifteen things to try.
 */
export function useDifficultyPicker({ immediate = true } = {}) {
  const api = useApi(lookupService.getDifficultyPicker, { immediate });
  const data = api.data ?? null;

  const groups = useMemo(() => {
    if (!data) return [];
    const extra = data.ungrouped?.length
      ? [{ id: 'ungrouped', code: 'ungrouped', name: 'Something else', reasons: data.ungrouped }]
      : [];
    // A group with nothing active in it is noise on a long list.
    return [...(data.categories ?? []), ...extra].filter((group) => group.reasons?.length);
  }, [data]);

  const byCode = useMemo(() => {
    const map = new Map();
    groups.forEach((group) => group.reasons.forEach((reason) => map.set(reason.code, reason)));
    return map;
  }, [groups]);

  const strategiesFor = useMemo(
    () => (codes = [], limit = 2) => {
      // How often each strategy is pointed at by what they picked - the one
      // that answers several reasons at once is the one worth offering.
      const score = new Map();
      codes.forEach((code) => {
        byCode.get(code)?.strategies?.forEach((strategy) => {
          const seen = score.get(strategy.code) ?? { strategy, count: 0 };
          seen.count += 1;
          score.set(strategy.code, seen);
        });
      });

      return [...score.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((entry) => entry.strategy);
    },
    [byCode]
  );

  return {
    groups,
    reasonByCode: byCode,
    // Every active strategy - to name one by its code (e.g. "Did that help?").
    strategies: data?.strategies ?? [],
    strategiesFor,
    isLoading: api.isLoading && !api.data,
    error: api.data ? null : api.error,
    reload: api.run,
  };
}

export default useDifficultyPicker;
