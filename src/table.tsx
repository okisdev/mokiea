import type { ComponentChildren } from 'preact';
import { Skeleton } from './display';

export interface Column<T> {
  key: string;
  header: ComponentChildren;
  render: (row: T, index: number) => ComponentChildren;
  align?: 'start' | 'end' | 'center';
  /** a CSS width such as `120px` or `30%`; unset columns share the rest */
  width?: string;
  /** the column that absorbs extra width and truncates first */
  grow?: boolean;
  /** hidden below 760px */
  hideOnMobile?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  /** Caps the table's height and scrolls its rows under a pinned header, for lists that change size while they are read. */
  maxHeight?: number;
  label: string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number;
  /** shown when rows are empty and not loading */
  empty?: ComponentChildren;
  loading?: boolean;
  size?: 'sm' | 'md';
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  label,
  onRowClick,
  selectedKey,
  empty,
  loading,
  size = 'md',
  maxHeight,
}: TableProps<T>) {
  const cellClass = (column: Column<T>) =>
    [
      column.align && column.align !== 'start' && `ui-align-${column.align}`,
      column.grow && 'ui-col-grow',
      column.hideOnMobile && 'ui-hide-mobile',
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  if (!loading && !rows.length && empty) return <div class="ui-table-wrap">{empty}</div>;
  return (
    <div
      class={maxHeight ? 'ui-table-wrap ui-table-scroll' : 'ui-table-wrap'}
      style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
    >
      <table class={`ui-table ui-table-${size}`} aria-label={label}>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" class={cellClass(column)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            !rows.length &&
            [0, 1, 2].map((index) => (
              <tr key={`s${index}`}>
                {columns.map((column) => (
                  <td key={column.key} class={cellClass(column)}>
                    <Skeleton height={12} width={column.grow ? '60%' : '70%'} />
                  </td>
                ))}
              </tr>
            ))}
          {rows.map((row, index) => {
            const key = rowKey(row, index);
            return (
              <tr
                key={key}
                class={onRowClick ? 'ui-row-action' : undefined}
                aria-selected={selectedKey !== undefined ? key === selectedKey : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={
                  onRowClick &&
                  ((event) => {
                    if (!(event.target as HTMLElement).closest('a, button, input, [role="switch"]'))
                      onRowClick(row);
                  })
                }
                onKeyDown={
                  onRowClick &&
                  ((event) => {
                    if (
                      (event.key === 'Enter' || event.key === ' ') &&
                      event.target === event.currentTarget
                    ) {
                      event.preventDefault();
                      onRowClick(row);
                    }
                  })
                }
              >
                {columns.map((column) => (
                  <td key={column.key} class={cellClass(column)}>
                    {column.render(row, index)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
