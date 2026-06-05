'use client';

import { useMemo, useState } from 'react';
import { Activity, CalendarIcon, LoaderCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import DataTable from '../components/DataTable';
import { fetchUserActivityLogs, UserActivityLogFilters } from '../logs/actions';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { userActivityLogColumns } from './user-activity-log.columns';

const DEFAULT_LIMIT = 10;

export default function UserActivityLogs({ userId }: { userId: number }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);
  const [filters, setFilters] = useState<Omit<UserActivityLogFilters, 'user_id' | 'page' | 'limit'>>({
    search: '',
    type: 'all',
    action: '',
    date_from: '',
    date_to: '',
  });

  const queryFilters: UserActivityLogFilters = useMemo(
    () => ({
      ...filters,
      user_id: userId,
      page: page + 1,
      limit: rowsPerPage,
    }),
    [filters, page, rowsPerPage, userId]
  );

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['user-activity-logs', queryFilters],
    queryFn: () => fetchUserActivityLogs(queryFilters),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const updateFilter = (key: keyof Omit<UserActivityLogFilters, 'user_id' | 'page' | 'limit'>, value: string) => {
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
    <section className="space-y-4 border-t pt-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
            <Activity className="size-5 text-muted-foreground" />
          </div>

          <div>
            <h3 className="text-base font-semibold">Activity Logs</h3>
            <p className="text-sm text-muted-foreground">Audit and transaction activity for this user</p>
          </div>
        </div>

        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Loading
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <label htmlFor="user-activity-search" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="user-activity-search"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search logs"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="user-activity-type" className="text-sm font-medium">
              Type
            </label>
            <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
              <SelectTrigger id="user-activity-type" className="w-full">
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
            <label htmlFor="user-activity-action" className="text-sm font-medium">
              Action
            </label>
            <Input id="user-activity-action" value={filters.action} onChange={(e) => updateFilter('action', e.target.value)} placeholder="Action" />
          </div>

          <div className="space-y-2">
            <label htmlFor="user-activity-date-from" className="text-sm font-medium">
              Date From
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="user-activity-date-from"
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
            <label htmlFor="user-activity-date-to" className="text-sm font-medium">
              Date To
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="user-activity-date-to"
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
          {error instanceof Error ? error.message : 'Failed to load user activity logs.'}
        </div>
      )}

      <DataTable
        rows={rows}
        columns={userActivityLogColumns}
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
