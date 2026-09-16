/**
 * Presentational table.
 *
 * Knows nothing about fetching or pagination - <DataTable /> composes this
 * with loading, empty, error and pagination behaviour.
 *
 * @param columns - [{ key, header, render?, align?, sortable?, width?, className? }]
 *   `className` (e.g. a Tailwind `hidden lg:table-cell`) is applied to both
 *   the header and body cells, so a column can be hidden responsively
 *   without the header and its cells drifting out of alignment.
 */
export function Table({
  columns = [],
  data = [],
  rowKey = 'id',
  onRowClick,
  sortBy,
  sortOrder = 'asc',
  onSort,
  caption,
  emptyContent,
  className = '',
}) {
  const getRowKey = (row, index) =>
    typeof rowKey === 'function' ? rowKey(row, index) : (row?.[rowKey] ?? index);

  const cellValue = (row, column, index) =>
    column.render ? column.render(row, index) : row?.[column.key];

  return (
    <div className="ui-table-wrap">
      <table className={`ui-table ${className}`.trim()}>
        {caption && <caption className="ui-sr-only">{caption}</caption>}

        <thead>
          <tr>
            {columns.map((column) => {
              const isSorted = sortBy === column.key;

              return (
                <th
                  key={column.key}
                  scope="col"
                  className={column.className}
                  style={{ width: column.width, textAlign: column.align }}
                  aria-sort={isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      className="ui-table__sort"
                      onClick={() => onSort(column.key, isSorted && sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {column.header}
                      <span aria-hidden="true">{isSorted ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && emptyContent ? (
            <tr className="ui-table__empty">
              <td colSpan={columns.length}>{emptyContent}</td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.className} style={{ textAlign: column.align }}>
                    {cellValue(row, column, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
