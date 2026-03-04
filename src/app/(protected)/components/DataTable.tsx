'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  TablePagination,
  Box,
  Skeleton,
} from '@mui/material';
import { ReactNode, useMemo, useState } from 'react';

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

  onRowClick?: (row: T) => void;
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

  const rowsPerPage =
    paginationMode === 'backend' ? (controlledRowsPerPage ?? 10) : internalRowsPerPage;

  const paginatedRows = useMemo(() => {
    if (!pagination || paginationMode === 'backend') return rows;

    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage, pagination, paginationMode]);

  const handlePageChange = (_: unknown, newPage: number) => {
    if (paginationMode === 'backend') {
      onPageChange?.(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);

    if (paginationMode === 'backend') {
      onRowsPerPageChange?.(value);
    } else {
      setInternalRowsPerPage(value);
      setInternalPage(0);
    }
  };

  const skeletonRows = Array.from({ length: rowsPerPage });

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        backgroundColor: 'background.paper',
      }}
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: 'text.secondary',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  py: 1.5,
                  width: 60,
                }}
              >
                #
              </TableCell>

              {columns.map((col, index) => (
                <TableCell
                  key={index}
                  align={col.align ?? 'left'}
                  sx={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: 'text.secondary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 1.5,
                  }}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading
              ? skeletonRows.map((_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`}>
                    <TableCell>
                      <Skeleton height={20} />
                    </TableCell>

                    {columns.map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : paginatedRows.map((row, rowIndex) => {
                  const rowNumber =
                    paginationMode === 'backend'
                      ? page * rowsPerPage + rowIndex + 1
                      : page * rowsPerPage + rowIndex + 1;

                  return (
                    <TableRow
                      key={getRowKey(row)}
                      hover
                      onClick={
                        onRowClick && (!isRowSelectable || isRowSelectable(row))
                          ? () => onRowClick(row)
                          : undefined
                      }
                      sx={{
                        cursor: onRowClick ? 'pointer' : 'default',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(37, 99, 235, 0.04)',
                        },
                        '&:not(:last-child) td': {
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 500,
                          color: 'text.secondary',
                          width: 60,
                        }}
                      >
                        {rowNumber}
                      </TableCell>

                      {columns.map((col, index) => (
                        <TableCell
                          key={index}
                          align={col.align ?? 'left'}
                          sx={{
                            fontSize: 14,
                            py: 1.5,
                            color: 'text.primary',
                          }}
                        >
                          {col.render(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && !loading && (
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <TablePagination
            component="div"
            count={paginationMode === 'backend' ? (totalRows ?? 0) : rows.length}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              '.MuiTablePagination-toolbar': { px: 2 },
            }}
          />
        </Box>
      )}
    </Paper>
  );
}
