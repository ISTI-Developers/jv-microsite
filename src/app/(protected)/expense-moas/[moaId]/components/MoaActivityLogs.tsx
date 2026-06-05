'use client';

import { useMemo, useState } from 'react';
import { Activity, CalendarIcon, LoaderCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import DataTable from '@/app/(protected)/components/DataTable';
import { fetchMoaActivityLogs, MoaActivityLogFilters } from '@/app/(protected)/logs/actions';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { moaActivityLogColumns } from './moa-activity-log.columns';

const DEFAULT_LIMIT = 10;

export default function MoaActivityLogs({ moaId }: { moaId: string }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);
  const [filters, setFilters] = useState<Omit<MoaActivityLogFilters, 'moa_id' | 'page' | 'limit'>>({
    search: '',
    type: 'all',
    action: '',
    date_from: '',
    date_to: '',
  });

  const queryFilters: MoaActivityLogFilters = useMemo(
    () => ({
      ...filters,
      moa_id: moaId,
      page: page + 1,
      limit: rowsPerPage,
    }),
    [filters, moaId, page, rowsPerPage]
  );

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['moa-activity-logs', queryFilters],
    queryFn: () => fetchMoaActivityLogs(queryFilters),
    enabled: !!moaId,
    staleTime: 60 * 1000,
  });

  const updateFilter = (key: keyof Omit<MoaActivityLogFilters, 'moa_id' | 'page' | 'limit'>, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      action: '',
      date_from: '',
      date_to: '',
    });
    setPage(0);
  };

  const rows = data?.data ?? [];
  const totalRows = data?.pagination.total ?? 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <Activity className="h-7 w-7 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">MOA Activity Logs</h2>
            <p className="text-sm text-muted-foreground">Review audit and transaction activity for this MOA</p>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <label htmlFor="moa-activity-search" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="moa-activity-search"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search logs"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="moa-activity-type" className="text-sm font-medium">
              Type
            </label>
            <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
              <SelectTrigger id="moa-activity-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="transaction">Transaction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="moa-activity-action" className="text-sm font-medium">
              Action
            </label>
            <Input id="moa-activity-action" value={filters.action} onChange={(e) => updateFilter('action', e.target.value)} placeholder="Action" />
          </div>

          <div className="space-y-2">
            <label htmlFor="moa-activity-date-from" className="text-sm font-medium">
              Date From
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="moa-activity-date-from"
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
            <label htmlFor="moa-activity-date-to" className="text-sm font-medium">
              Date To
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="moa-activity-date-to"
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
          {error instanceof Error ? error.message : 'Failed to load MOA activity logs.'}
        </div>
      )}

      <DataTable
        rows={rows}
        columns={moaActivityLogColumns}
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
    </section>
  );
}
