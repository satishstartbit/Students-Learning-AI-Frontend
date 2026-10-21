import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { PAGINATION } from '../utils/constants';
import { intParam, pageNumbers, patchQuery, readQuery, rememberListSearch } from '../utils/listQuery';

const PAGE_SIZES = [10, 20, 50, 100];

/**
 * A list page's filters, sort and page kept in the address (utils/listQuery.js,
 * 2026-10-20 user request): a refresh, the browser's Back, or a "Back" button
 * from a page inside the list brings it back exactly as it was.
 *
 *   const { query, setQuery, pagination } = useListQuery({ search: '', status: '' });
 *   setQuery({ status: 'active', page: 1 })   // one call per change (filters go back to page 1)
 *   <DataTable pagination={pagination} onPageChange={pagination.goToPage} />
 *
 * `pagination` has usePagination's shape (page, limit, total, totalPages,
 * from, to, goToPage, setLimit, applyMeta, buildQuery) plus `alwaysShow` and
 * `pageSizeOptions`, so DataTable always shows "Showing 1-6 of 6" and Rows per
 * page. The server pages the rows; `applyMeta(meta)` takes its total.
 */
export function useListQuery(defaults = {}, { defaultLimit = PAGINATION.DEFAULT_LIMIT, pageSizeOptions = PAGE_SIZES } = {}) {
  const [params, setParams] = useSearchParams();
  const { pathname, search } = useLocation();
  // Callers pass a fresh object each render: key it by its content.
  const defaultsKey = JSON.stringify(defaults);
  const allDefaults = useMemo(() => ({ ...JSON.parse(defaultsKey), page: '1', limit: String(defaultLimit) }), [defaultsKey, defaultLimit]);

  const query = useMemo(() => readQuery(params, allDefaults), [params, allDefaults]);
  // Patch the address as it is now, not as of the last render: react-router hands
  // the updater the last render's params, so two quick changes (type a search,
  // then pick a filter before React re-renders) lost the first one.
  const setQuery = useCallback(
    (patch) => setParams(() => patchQuery(new URLSearchParams(window.location.search), patch, allDefaults), { replace: true }),
    [setParams, allDefaults]
  );

  // Remember where this list was left, for Back buttons on pages inside it.
  useEffect(() => {
    rememberListSearch(pathname, search);
  }, [pathname, search]);

  const page = intParam(query.page, 1);
  const limit = intParam(query.limit, defaultLimit, { max: 100 });
  const [total, setTotal] = useState(0);
  const numbers = pageNumbers({ page, limit, total });

  const goToPage = useCallback(
    (next) => setQuery({ page: Math.min(Math.max(1, Number(next) || 1), Math.max(numbers.totalPages, 1)) }),
    [setQuery, numbers.totalPages]
  );
  const setLimit = useCallback((next) => setQuery({ limit: Number(next) || defaultLimit, page: 1 }), [setQuery, defaultLimit]);
  const applyMeta = useCallback((meta = {}) => {
    if (!Number.isFinite(meta.total)) return;
    setTotal(meta.total);
    // Past the end (the last row on the last page was deleted, or an old link): go to the last page.
    const lastPage = Math.max(1, Math.ceil(meta.total / limit));
    if (page > lastPage) setQuery({ page: lastPage });
  }, [setTotal, page, limit, setQuery]);
  const buildQuery = useCallback((extra = {}) => ({ page, limit, ...extra }), [page, limit]);

  const pagination = {
    page,
    limit,
    total,
    ...numbers,
    goToPage,
    nextPage: () => goToPage(page + 1),
    previousPage: () => goToPage(page - 1),
    setLimit,
    applyMeta,
    buildQuery,
    alwaysShow: true,
    pageSizeOptions,
  };

  return { query, setQuery, pagination };
}

export default useListQuery;
