import { useCallback, useMemo } from 'react';

/**
 * Shared answer-state helpers for a matching question, so the tap-to-pair
 * (K-4) and drag-and-drop (Grade 6+) interactions both write the same
 * `{ leftId, rightId }[]` shape and can't disagree on what "matched" means.
 *
 * Setting a pair for a left item that's already matched, or to a right item
 * already used elsewhere, replaces the old pairing rather than allowing two
 * matches to point at the same item.
 */
export function useMatchingAnswer(question, answer, onChange, { readOnly = false } = {}) {
  const matched = useMemo(() => answer?.matchedPairs ?? [], [answer]);

  const pairForLeft = useMemo(() => new Map(matched.map((m) => [m.leftId, m.rightId])), [matched]);
  const leftForRight = useMemo(() => new Map(matched.map((m) => [m.rightId, m.leftId])), [matched]);
  const usedRightIds = useMemo(() => new Set(matched.map((m) => m.rightId)), [matched]);

  const setPair = useCallback(
    (leftId, rightId) => {
      if (readOnly) return;
      const next = matched.filter((m) => m.leftId !== leftId && m.rightId !== rightId);
      next.push({ leftId, rightId });
      onChange({ ...answer, matchedPairs: next });
    },
    [matched, answer, onChange, readOnly]
  );

  const clearPair = useCallback(
    (leftId) => {
      if (readOnly) return;
      onChange({ ...answer, matchedPairs: matched.filter((m) => m.leftId !== leftId) });
    },
    [matched, answer, onChange, readOnly]
  );

  const totalLeft = question.leftItems?.length ?? 0;
  const isComplete = totalLeft > 0 && matched.length === totalLeft;

  return { matched, pairForLeft, leftForRight, usedRightIds, setPair, clearPair, isComplete };
}

export default useMatchingAnswer;
