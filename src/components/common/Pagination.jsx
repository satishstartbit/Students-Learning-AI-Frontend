/**
 * Page navigation.
 *
 * Pairs with usePagination - pass its page/totalPages/goToPage straight in.
 * Long ranges collapse to first/last plus a window around the current page.
 *
 * Admin lists (2026-10-20, user request) pass `alwaysShow` so the bar - "Showing
 * 1-6 of 6" and the page buttons - is there even when everything fits on one
 * page, and `onLimitChange` (+ `limit`, `pageSizeOptions`) for "Rows per page".
 * Both are opt-in; without them the bar hides when there is one page, as before.
 */
function buildPageRange(page, totalPages, siblings = 1) {
  const total = siblings * 2 + 5;
  if (totalPages <= total) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, totalPages);

  const showLeftGap = left > 2;
  const showRightGap = right < totalPages - 1;

  const range = [1];
  if (showLeftGap) range.push('…');

  for (let i = Math.max(left, 2); i <= Math.min(right, totalPages - 1); i += 1) range.push(i);

  if (showRightGap) range.push('…');
  range.push(totalPages);

  return range;
}

export function Pagination({
  page = 1,
  totalPages = 0,
  total = 0,
  from,
  to,
  onPageChange,
  siblings = 1,
  showSummary = true,
  className = '',
  alwaysShow = false,
  limit,
  onLimitChange,
  pageSizeOptions = [10, 20, 50],
}) {
  if (alwaysShow ? !(total > 0) : totalPages <= 1) return null;
  const lastPage = Math.max(totalPages, 1);

  const pages = buildPageRange(page, lastPage, siblings);

  return (
    <nav className={`ui-pagination ${className}`.trim()} aria-label="Pagination">
      {showSummary && (
        <span>
          {from != null && to != null ? `Showing ${from}–${to} of ${total}` : `Page ${page} of ${totalPages}`}
        </span>
      )}

      {onLimitChange && (
        <label className="ui-pagination__size">
          Rows per page
          <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}>
            {[...new Set([...pageSizeOptions, limit].filter(Boolean))]
              .sort((a, b) => a - b)
              .map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
          </select>
        </label>
      )}

      <div className="ui-pagination__pages">
        <button
          type="button"
          className="ui-pagination__page"
          onClick={() => onPageChange?.(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>

        {pages.map((item, index) =>
          item === '…' ? (
            <span key={`gap-${index}`} className="ui-pagination__ellipsis" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className="ui-pagination__page"
              onClick={() => onPageChange?.(item)}
              aria-current={item === page ? 'page' : undefined}
              aria-label={`Page ${item}`}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          className="ui-pagination__page"
          onClick={() => onPageChange?.(page + 1)}
          disabled={page >= lastPage}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
