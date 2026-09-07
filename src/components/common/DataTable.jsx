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
}) {
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  // Only take over the whole area on a first load; keep the table visible
  // while refetching so the layout does not jump.
  if (isLoading && data.length === 0) {
    return <Loader message="Loading records…" />;
  }

  return (
    <div className={className} aria-busy={isLoading || undefined}>
      <Table
        columns={columns}
        data={data}
        rowKey={rowKey}
        onRowClick={onRowClick}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        caption={caption}
        emptyContent={
          <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
        }
      />

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
