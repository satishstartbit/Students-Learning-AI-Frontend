import { useIsMobile } from '../../hooks/useIsMobile';
import Table from './Table';
import Pagination from './Pagination';
import Loader from './Loader';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

/**
 * Table plus its loading, empty, error and pagination states.
 *
 * Still presentational: data and handlers come from the caller (useApi +
 * usePagination), so this component makes no requests of its own.
 *
 * Phones (below 768px): rows turn into cards. By default that's the Table's
 * own "label  value" card (responsive.css); a page with a mobile mockup
 * passes `renderCard(row)` to draw its own card instead (My Students).
 */
export function DataTable({
  columns,
  data = [],
  rowKey = 'id',
  isLoading = false,
  error = null,
  onRetry,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  pagination,
  onPageChange,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
  caption,
  className = '',
  renderCard,
  // Below this width `renderCard` replaces the table: 768 (phones) by
  // default; 1024 or 1280 for a table too wide for a tablet or a laptop
  // with the sidebar open, which then gets a grid of cards instead.
  cardsBelow = 768,
  mobileCards = true,
}) {
  const isPhone = useIsMobile(cardsBelow);

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  // Only take over the whole area on a first load; keep the table visible
  // while refetching so the layout does not jump.
  if (isLoading && data.length === 0) {
    return <Loader message="Loading records…" />;
  }

  const empty = <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  const keyOf = (row, index) => (typeof rowKey === 'function' ? rowKey(row, index) : (row?.[rowKey] ?? index));

  return (
    <div className={className} aria-busy={isLoading || undefined}>
      {isPhone && renderCard ? (
        data.length === 0 ? (
          <div className="ui-cardlist__empty">{empty}</div>
        ) : (
          <ul className="ui-cardlist" aria-label={caption}>
            {data.map((row, index) => (
              <li key={keyOf(row, index)} className="ui-cardlist__item">
                {renderCard(row, index)}
              </li>
            ))}
          </ul>
        )
      ) : (
        <Table
          columns={columns}
          data={data}
          rowKey={rowKey}
          onRowClick={onRowClick}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          caption={caption}
          mobileCards={mobileCards}
          emptyContent={empty}
        />
      )}

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          from={pagination.from}
          to={pagination.to}
          onPageChange={onPageChange ?? pagination.goToPage}
        />
      )}
    </div>
  );
}

export default DataTable;
