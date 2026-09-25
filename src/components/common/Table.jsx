/**
 * Presentational table.
 *
 * Knows nothing about fetching or pagination - <DataTable /> composes this
 * with loading, empty, error and pagination behaviour.
 *
 * @param columns - [{ key, header, render?, align?, sortable?, width?, className?, mobileLabel?, hideOnMobile? }]
 *   `className` (e.g. a Tailwind `hidden lg:table-cell`) is applied to both
 *   the header and body cells, so a column can be hidden responsively
 *   without the header and its cells drifting out of alignment.
 * @param mobileCards - on phones (below 768px) each row becomes a card: the
 *   first column is its title and every other cell a "label  value" line,
 *   labelled from the column's header (or `mobileLabel` when the header
 *   isn't text). `hideOnMobile` leaves a column out of the card.
 *   responsive.css draws it; pass false to keep a scrolling table instead.
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
  mobileCards = true,
}) {
  const labelOf = (column) => column.mobileLabel ?? (typeof column.header === 'string' ? column.header : undefined);
  const cellClass = (column) =>
    [column.className, column.hideOnMobile ? 'ui-table__cell--nomobile' : ''].filter(Boolean).join(' ') || undefined;
  const getRowKey = (row, index) =>
    typeof rowKey === 'function' ? rowKey(row, index) : (row?.[rowKey] ?? index);

  const cellValue = (row, column, index) =>
    column.render ? column.render(row, index) : row?.[column.key];

  return (
    <div className={`ui-table-wrap${mobileCards ? ' ui-table-wrap--cards' : ''}`}>
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
                  className={cellClass(column)}
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
                  <td
                    key={column.key}
                    className={cellClass(column)}
                    data-label={labelOf(column)}
                    style={{ textAlign: column.align }}
                  >
                    {/* One box for the value, so a cell with two lines (date + title)
                        stays one block beside its label in the phone card.
                        display:contents on wider screens - no layout effect there. */}
                    <span className="ui-table__value">{cellValue(row, column, index)}</span>
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
