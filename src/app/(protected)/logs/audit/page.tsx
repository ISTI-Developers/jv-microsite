'use client';

import { useMemo, useState } from 'react';
import { CalendarIcon, ClipboardList, LoaderCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import DataTable from '../../components/DataTable';
import { fetchAuditLogs, AuditLogFilters } from '../actions';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { columns } from './columns';
import PageHeader from '../../components/PageHeader';

const DEFAULT_LIMIT = 10;

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);
  const [filters, setFilters] = useState<Omit<AuditLogFilters, 'page' | 'limit'>>({
    search: '',
    user_id: '',
    action: '',
    module: '',
    entity_type: '',
    date_from: '',
    date_to: '',
  });

  const queryFilters: AuditLogFilters = useMemo(
    () => ({
      ...filters,
      page: page + 1,
      limit: rowsPerPage,
    }),
    [filters, page, rowsPerPage]
  );

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['audit-logs', queryFilters],
    queryFn: () => fetchAuditLogs(queryFilters),
    staleTime: 60 * 1000,
  });

  const updateFilter = (key: keyof Omit<AuditLogFilters, 'page' | 'limit'>, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      user_id: '',
      action: '',
      module: '',
      entity_type: '',
      date_from: '',
      date_to: '',
    });
    setPage(0);
  };

  const rows = data?.data ?? [];
  const totalRows = data?.pagination.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Review admin audit activity across users, modules, and entities"
        icon={ClipboardList}
        actions={
          isFetching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading
            </div>
          )
        }
      />

      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label htmlFor="audit-search" className="text-sm font-medium">
              Search
            </label>
            <Input id="audit-search" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Search logs" />
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-user-id" className="text-sm font-medium">
              User ID
            </label>
            <Input id="audit-user-id" value={filters.user_id} onChange={(e) => updateFilter('user_id', e.target.value)} placeholder="User ID" />
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-action" className="text-sm font-medium">
              Action
            </label>
            <Input id="audit-action" value={filters.action} onChange={(e) => updateFilter('action', e.target.value)} placeholder="Action" />
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-module" className="text-sm font-medium">
              Module
            </label>
            <Input id="audit-module" value={filters.module} onChange={(e) => updateFilter('module', e.target.value)} placeholder="Module" />
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-entity-type" className="text-sm font-medium">
              Entity Type
            </label>
            <Input
              id="audit-entity-type"
              value={filters.entity_type}
              onChange={(e) => updateFilter('entity_type', e.target.value)}
              placeholder="Entity type"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-date-from" className="text-sm font-medium">
              Date From
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="audit-date-from"
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
            <label htmlFor="audit-date-to" className="text-sm font-medium">
              Date To
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="audit-date-to"
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
          {error instanceof Error ? error.message : 'Failed to load audit logs.'}
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
