import { useMemo } from 'react';
import { useApi } from '../../../hooks/useApi';
import rewardService from '../services/reward.service';

/**
 * The student's collectible rewards, shared by the K-4 and Grade 6+ Rewards
 * pages (and Home's progress card):
 *
 *   points      lifetime earned points - rewards are collected against this
 *   stickers / emojis   the catalog split by reward type, cheapest first,
 *               each with `collected` from the server
 *   next        the cheapest reward not collected yet (null when all are)
 *   toGo        points still needed for `next`
 *   progress    0..1 towards `next`
 */
export function useRewards() {
  const summary = useApi(rewardService.getSummary, { immediate: true });
  const catalog = useApi(rewardService.listCatalog, { immediate: true });

  const derived = useMemo(() => {
    const points = summary.data?.totalPoints ?? 0;
    const items = Array.isArray(catalog.data) ? catalog.data : [];
    const next = items.filter((r) => !r.collected).sort((a, b) => a.pointsCost - b.pointsCost)[0] ?? null;
    return {
      points,
      items,
      stickers: items.filter((r) => r.rewardType !== 'emoji'),
      emojis: items.filter((r) => r.rewardType === 'emoji'),
      collectedCount: items.filter((r) => r.collected).length,
      next,
      toGo: next ? Math.max(next.pointsCost - points, 0) : 0,
      progress: next && next.pointsCost > 0 ? Math.min(points / next.pointsCost, 1) : items.length ? 1 : 0,
    };
  }, [summary.data, catalog.data]);

  return {
    ...derived,
    isLoading: (summary.isLoading && !summary.data) || (catalog.isLoading && !catalog.data),
    error: summary.data && catalog.data ? null : summary.error ?? catalog.error,
    reload: () => Promise.all([summary.run().catch(() => {}), catalog.run().catch(() => {})]),
  };
}

export default useRewards;
