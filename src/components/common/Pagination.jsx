/**
 * Page navigation.
 *
 * Pairs with usePagination - pass its page/totalPages/goToPage straight in.
 * Long ranges collapse to first/last plus a window around the current page.
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
}) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(page, totalPages, siblings);

  return (
    <nav className={`ui-pagination ${className}`.trim()} aria-label="Pagination">
      {showSummary && (
        <span>
          {from != null && to != null ? `Showing ${from}–${to} of ${total}` : `Page ${page} of ${totalPages}`}
        </span>
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
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
