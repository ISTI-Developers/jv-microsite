'use client';

import { ReactNode, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type Column<T> = {
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T, index: number) => string | number | boolean | Date | null | undefined;
};

type PaginationMode = 'frontend' | 'backend';

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  getRowKey: (row: T, index: number) => string | number;
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
  hideSearch?: boolean;
};

function flattenValue(value: unknown): string {
  if (value == null) return '';

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(flattenValue).join(' ');
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(flattenValue)
      .join(' ');
  }

  return '';
}

function normalizeSortValue(value: unknown): string | number {
  if (value == null) return '';
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return String(value).trim().toLowerCase();
}

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
  hideSearch = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(10);
  const [sortState, setSortState] = useState<{ columnIndex: number; direction: 'asc' | 'desc' } | null>(null);

  const page = paginationMode === 'backend' ? (controlledPage ?? 0) : internalPage;
  const rowsPerPage = paginationMode === 'backend' ? (controlledRowsPerPage ?? 10) : internalRowsPerPage;
  const hasSearch = search.trim().length > 0;
  const paginationLocked = paginationMode === 'backend' && hasSearch;

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return rows;

    return rows.filter((row) => flattenValue(row).toLowerCase().includes(keyword));
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    if (!sortState) return filteredRows;

    const column = columns[sortState.columnIndex];

    if (!column?.sortable) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const aRaw =
        column.sortValue?.(a, 0) ??
        (() => {
          const rendered = column.render(a, 0);
          return typeof rendered === 'string' || typeof rendered === 'number' || typeof rendered === 'boolean' ? rendered : '';
        })();

      const bRaw =
        column.sortValue?.(b, 0) ??
        (() => {
          const rendered = column.render(b, 0);
          return typeof rendered === 'string' || typeof rendered === 'number' || typeof rendered === 'boolean' ? rendered : '';
        })();

      const aValue = normalizeSortValue(aRaw);
      const bValue = normalizeSortValue(bRaw);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortState.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const comparison = String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
        sensitivity: 'base',
      });

      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredRows, columns, sortState]);

  const totalCount = paginationMode === 'backend' ? (hasSearch ? sortedRows.length : (totalRows ?? rows.length)) : sortedRows.length;

  const totalPages = pagination && paginationMode === 'backend' && hasSearch ? 1 : Math.max(1, Math.ceil(totalCount / rowsPerPage));

  const safePage = paginationMode === 'frontend' ? Math.min(page, Math.max(0, totalPages - 1)) : page;

  const paginatedRows = useMemo(() => {
    if (!pagination) return sortedRows;

    if (paginationMode === 'backend') return sortedRows;

    const start = safePage * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, safePage, rowsPerPage, pagination, paginationMode]);

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
      onPageChange?.(0);
    } else {
      setInternalRowsPerPage(value);
      setInternalPage(0);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);

    if (paginationMode === 'frontend') {
      setInternalPage(0);
    }
  };

  const handleSort = (columnIndex: number) => {
    const column = columns[columnIndex];

    if (!column.sortable) return;

    setSortState((current) => {
      if (!current || current.columnIndex !== columnIndex) {
        return { columnIndex, direction: 'asc' };
      }

      if (current.direction === 'asc') {
        return { columnIndex, direction: 'desc' };
      }

      return null;
    });

    if (paginationMode === 'frontend') {
      setInternalPage(0);
    }
  };

  const skeletonRows = Array.from({ length: rowsPerPage });

  const rangeStart = totalCount === 0 ? 0 : paginationMode === 'backend' ? (hasSearch ? 1 : page * rowsPerPage + 1) : safePage * rowsPerPage + 1;

  const rangeEnd =
    totalCount === 0
      ? 0
      : paginationMode === 'backend'
        ? hasSearch
          ? sortedRows.length
          : Math.min(totalCount, (page + 1) * rowsPerPage)
        : Math.min(totalCount, (safePage + 1) * rowsPerPage);

  const currentPageLabel = paginationLocked ? 1 : Math.min(safePage + 1, totalPages);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {!hideSearch && (
        <div className="border-b border-border px-4 py-3">
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search all columns..."
            className="max-w-sm"
          />
        </div>
      )}

      <Table className="min-w-full">
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-14 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">#</TableHead>
            {columns.map((col, index) => {
              const isSorted = sortState?.columnIndex === index;
              const isAsc = isSorted && sortState?.direction === 'asc';
              const isDesc = isSorted && sortState?.direction === 'desc';

              return (
                <TableHead
                  key={index}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center'
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(index)}
                      className={cn(
                        'inline-flex items-center gap-1 transition hover:text-foreground',
                        col.align === 'right' && 'ml-auto',
                        col.align === 'center' && 'mx-auto'
                      )}
                    >
                      <span>{col.header}</span>
                      {isAsc ? <ArrowUp className="size-3.5" /> : isDesc ? <ArrowDown className="size-3.5" /> : <ArrowUpDown className="size-3.5" />}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            skeletonRows.map((_, rowIndex) => (
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
          ) : paginatedRows.length > 0 ? (
            paginatedRows.map((row, rowIndex) => {
              const rowNumber =
                paginationMode === 'backend' ? (hasSearch ? rowIndex + 1 : page * rowsPerPage + rowIndex + 1) : safePage * rowsPerPage + rowIndex + 1;

              const clickable = Boolean(onRowClick && (!isRowSelectable || isRowSelectable(row)));

              return (
                <TableRow
                  key={getRowKey(row, rowIndex)}
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
                      {col.render(row, rowIndex)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length + 1} className="px-4 py-8 text-center text-sm text-muted-foreground">
                No matching records found.
              </TableCell>
            </TableRow>
          )}
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
                onClick={() => handlePageChange(0)}
                disabled={safePage === 0 || paginationLocked}
                className="rounded-lg border border-input px-2 py-1.5 text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <ChevronsLeft className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(Math.max(0, safePage - 1))}
                disabled={safePage === 0 || paginationLocked}
                className="rounded-lg border border-input px-3 py-1.5 text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                Previous
              </button>

              <span>
                Page {currentPageLabel} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages - 1, safePage + 1))}
                disabled={safePage >= totalPages - 1 || paginationLocked}
                className="rounded-lg border border-input px-3 py-1.5 text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                Next
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(Math.max(0, totalPages - 1))}
                disabled={safePage >= totalPages - 1 || paginationLocked}
                className="rounded-lg border border-input px-2 py-1.5 text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <ChevronsRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
