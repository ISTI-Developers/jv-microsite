'use client';

import { useMemo, useState } from 'react';
import { CalendarIcon, LoaderCircle, ReceiptText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import DataTable from '../../components/DataTable';
import { fetchTransactionLogs, TransactionLogFilters } from '../actions';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { columns } from './columns';

const DEFAULT_LIMIT = 10;

export default function TransactionLogsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);
  const [filters, setFilters] = useState<Omit<TransactionLogFilters, 'page' | 'limit'>>({
    search: '',
    transaction_type: '',
    action: '',
    reference_table: '',
    reference_no: '',
    moa_id: '',
    moa_share_id: '',
    structure_id: '',
    account_no: '',
    performed_by: '',
    date_from: '',
    date_to: '',
  });

  const queryFilters: TransactionLogFilters = useMemo(
    () => ({
      ...filters,
      page: page + 1,
      limit: rowsPerPage,
    }),
    [filters, page, rowsPerPage]
  );

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['transaction-logs', queryFilters],
    queryFn: () => fetchTransactionLogs(queryFilters),
    staleTime: 60 * 1000,
  });

  const updateFilter = (key: keyof Omit<TransactionLogFilters, 'page' | 'limit'>, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      transaction_type: '',
      action: '',
      reference_table: '',
      reference_no: '',
      moa_id: '',
      moa_share_id: '',
      structure_id: '',
      account_no: '',
      performed_by: '',
      date_from: '',
      date_to: '',
    });
    setPage(0);
  };

  const rows = data?.data ?? [];
  const totalRows = data?.pagination.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <ReceiptText className="h-7 w-7 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Transaction Logs</h1>
            <p className="text-sm text-muted-foreground">Review transaction activity across references, MOAs, structures, and accounts</p>
          </div>
        </div>

        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Loading
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label htmlFor="transaction-search" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="transaction-search"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search logs"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="transaction-type" className="text-sm font-medium">
              Transaction Type
            </label>
            <Input
              id="transaction-type"
              value={filters.transaction_type}
              onChange={(e) => updateFilter('transaction_type', e.target.value)}
              placeholder="Transaction type"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="transaction-action" className="text-sm font-medium">
              Action
            </label>
            <Input id="transaction-action" value={filters.action} onChange={(e) => updateFilter('action', e.target.value)} placeholder="Action" />
          </div>

          <div className="space-y-2">
            <label htmlFor="transaction-reference-table" className="text-sm font-medium">
              Reference Table
            </label>
            <Input
              id="transaction-reference-table"
              value={filters.reference_table}
              onChange={(e) => updateFilter('reference_table', e.target.value)}
              placeholder="Reference table"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="transaction-reference-no" className="text-sm font-medium">
              Reference No
            </label>
            <Input
              id="transaction-reference-no"
              value={filters.reference_no}
              onChange={(e) => updateFilter('reference_no', e.target.value)}
              placeholder="Reference no"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="transaction-moa-id" className="text-sm font-medium">
              MOA ID
            </label>
            <Input id="transaction-moa-id" value={filters.moa_id} onChange={(e) => updateFilter('moa_id', e.target.value)} placeholder="MOA ID" />
          </div>

          <div className="space-y-2">
            <label htmlFor="transaction-moa-share-id" className="text-sm font-medium">
              MOA Share ID
            </label>
            <Input
              id="transaction-moa-share-id"
              value={filters.moa_share_id}
              onChange={(e) => updateFilter('moa_share_id', e.target.value)}
              placeholder="MOA share ID"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="transaction-structure-id" className="text-sm font-medium">
              Structure ID
            </label>
            <Input
              id="transaction-structure-id"
              value={filters.structure_id}
              onChange={(e) => updateFilter('structure_id', e.target.value)}
              placeholder="Structure ID"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="transaction-account-no" className="text-sm font-medium">
              Account No
            </label>
            <Input
              id="transaction-account-no"
              value={filters.account_no}
              onChange={(e) => updateFilter('account_no', e.target.value)}
              placeholder="Account no"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="transaction-performed-by" className="text-sm font-medium">
              Performed By
            </label>
            <Input
              id="transaction-performed-by"
              value={filters.performed_by}
              onChange={(e) => updateFilter('performed_by', e.target.value)}
              placeholder="User ID"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="transaction-date-from" className="text-sm font-medium">
              Date From
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="transaction-date-from"
                  type="button"
                  variant="outline"
                  className={cn('h-11 w-full justify-start rounded-xl text-left font-normal', !filters.date_from && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 size-4 shrink-0" />
                  {filters.date_from ? dayjs(filters.date_from).format('MMM DD, YYYY') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto rounded-2xl p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.date_from ? dayjs(filters.date_from).toDate() : undefined}
                  onSelect={(date) => updateFilter('date_from', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                  disabled={(date) => Boolean(filters.date_to) && dayjs(date).isAfter(dayjs(filters.date_to), 'day')}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label htmlFor="transaction-date-to" className="text-sm font-medium">
              Date To
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="transaction-date-to"
                  type="button"
                  variant="outline"
                  className={cn('h-11 w-full justify-start rounded-xl text-left font-normal', !filters.date_to && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 size-4 shrink-0" />
                  {filters.date_to ? dayjs(filters.date_to).format('MMM DD, YYYY') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto rounded-2xl p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.date_to ? dayjs(filters.date_to).toDate() : undefined}
                  onSelect={(date) => updateFilter('date_to', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                  disabled={(date) => Boolean(filters.date_from) && dayjs(date).isBefore(dayjs(filters.date_from), 'day')}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={resetFilters} className="w-full">
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to load transaction logs.'}
        </div>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        loading={isFetching}
        pagination
        paginationMode="backend"
        totalRows={totalRows}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </div>
  );
}
