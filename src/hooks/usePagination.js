import { useCallback, useMemo, useState } from 'react';
import { PAGINATION } from '../utils/constants';

/**
 * Pagination state plus the query params a list request needs.
 * Pair with useApi: `run(buildQuery({ search }))`.
 */
export function usePagination({
  initialPage = PAGINATION.DEFAULT_PAGE,
  initialLimit = PAGINATION.DEFAULT_LIMIT,
  total: initialTotal = 0,
} = {}) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [total, setTotal] = useState(initialTotal);

  const totalPages = useMemo(() => (limit > 0 ? Math.ceil(total / limit) : 0), [total, limit]);

  const goToPage = useCallback(
    (next) => {
      const upper = Math.max(totalPages, 1);
      setPage(Math.min(Math.max(1, Number(next) || 1), upper));
    },
    [totalPages]
  );

  const nextPage = useCallback(() => goToPage(page + 1), [goToPage, page]);
  const previousPage = useCallback(() => goToPage(page - 1), [goToPage, page]);

  /** Changing page size resets to page 1 so results stay predictable. */
  const setLimit = useCallback((next) => {
    setLimitState(Number(next) || PAGINATION.DEFAULT_LIMIT);
    setPage(1);
  }, []);

  /** Reads { page, limit, total } straight from a paginated response's meta. */
  const applyMeta = useCallback((meta = {}) => {
    if (Number.isFinite(meta.total)) setTotal(meta.total);
    if (Number.isFinite(meta.page)) setPage(meta.page);
    if (Number.isFinite(meta.limit)) setLimitState(meta.limit);
  }, []);

  const buildQuery = useCallback((extra = {}) => ({ page, limit, ...extra }), [page, limit]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimitState(initialLimit);
    setTotal(0);
  }, [initialPage, initialLimit]);

  return {
    page,
    limit,
    total,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
    from: total === 0 ? 0 : (page - 1) * limit + 1,
    to: Math.min(page * limit, total),
    goToPage,
    nextPage,
    previousPage,
    setLimit,
    setTotal,
    applyMeta,
    buildQuery,
    reset,
  };
}

export default usePagination;
