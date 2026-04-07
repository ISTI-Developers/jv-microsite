'use client';

import { ReactNode, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type Column<T> = {
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
};

type PaginationMode = 'frontend' | 'backend';

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string | number;
  loading?: boolean;
  onRowClick?: (row: T, event: React.MouseEvent<HTMLTableRowElement>) => void;
  isRowSelectable?: (row: T) => boolean;
  pagination?: boolean;
  paginationMode?: PaginationMode;
  totalRows?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
};

export default function DataTable<T>({
  rows,
  columns,
  getRowKey,
  loading = false,
  onRowClick,
  isRowSelectable,
  pagination = true,
  paginationMode = 'frontend',
  totalRows,
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(10);

  const page = paginationMode === 'backend' ? (controlledPage ?? 0) : internalPage;
  const rowsPerPage = paginationMode === 'backend' ? (controlledRowsPerPage ?? 10) : internalRowsPerPage;

  const paginatedRows = useMemo(() => {
    if (!pagination || paginationMode === 'backend') return rows;

    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage, pagination, paginationMode]);

  const handlePageChange = (newPage: number) => {
    if (paginationMode === 'backend') {
      onPageChange?.(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleRowsPerPageChange = (value: number) => {
    if (paginationMode === 'backend') {
      onRowsPerPageChange?.(value);
    } else {
      setInternalRowsPerPage(value);
      setInternalPage(0);
    }
  };

  const skeletonRows = Array.from({ length: rowsPerPage });
  const totalCount = paginationMode === 'backend' ? (totalRows ?? 0) : rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const rangeStart = totalCount === 0 ? 0 : page * rowsPerPage + 1;
  const rangeEnd = totalCount === 0 ? 0 : Math.min(totalCount, (page + 1) * rowsPerPage);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Table className="min-w-full">
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-14 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">#</TableHead>
            {columns.map((col, index) => (
              <TableHead
                key={index}
                className={cn(
                  'px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center'
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading
            ? skeletonRows.map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
                  <TableCell className="px-4 py-3">
                    <div className="h-4 w-6 animate-pulse rounded bg-muted" />
                  </TableCell>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="px-4 py-3">
                      <div className="h-4 w-full max-w-[12rem] animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : paginatedRows.map((row, rowIndex) => {
                const rowNumber = page * rowsPerPage + rowIndex + 1;
                const clickable = Boolean(onRowClick && (!isRowSelectable || isRowSelectable(row)));

                return (
                  <TableRow
                    key={getRowKey(row)}
                    onClick={clickable ? (event) => onRowClick?.(row, event) : undefined}
                    className={cn('border-border', clickable && 'cursor-pointer hover:bg-primary/5')}
                  >
                    <TableCell className="px-4 py-3 font-medium text-muted-foreground">{rowNumber}</TableCell>
                    {columns.map((col, index) => (
                      <TableCell
                        key={index}
                        className={cn(
                          'px-4 py-3 text-sm text-foreground',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center'
                        )}
                      >
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>

      {pagination && !loading && (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing {rangeStart}-{rangeEnd} of {totalCount}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span>Rows</span>
              <select
                value={rowsPerPage}
                onChange={(event) => handleRowsPerPageChange(Number(event.target.value))}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
              >
                {[5, 10, 25, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(0, page - 1))}
                disabled={page === 0}
                className="rounded-lg border border-input px-3 py-1.5 text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {Math.min(page + 1, totalPages)} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-input px-3 py-1.5 text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
