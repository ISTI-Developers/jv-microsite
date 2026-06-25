'use client';

import { useQuery } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { CalendarIcon, ListOrdered, LoaderCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import GroupTabsFilter from '../components/GroupTabsFilter';
import { fetchExpenseList } from './actions';
import { columns } from './expense-list.columns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ExpenseListPage() {
  const today = dayjs();

  const [range, setRange] = useState<DateRange | undefined>({
    from: today.toDate(),
    to: today.toDate(),
  });
  const [params, setParams] = useState<{ from: string; to: string } | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['expense-list', params],
    queryFn: () => fetchExpenseList(params!.from, params!.to),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const selectedFrom = range?.from;
  const selectedTo = range?.to;
  const hasSearched = !!params;

  const groupedRows = useMemo(() => {
    return rows.reduce<Record<string, typeof rows>>((acc, row) => {
      const groupName = row.group_name?.trim() || 'Ungrouped';

      if (!acc[groupName]) {
        acc[groupName] = [];
      }

      acc[groupName].push(row);

      return acc;
    }, {});
  }, [rows]);

  const groupTabs = useMemo(() => Object.keys(groupedRows).sort((a, b) => a.localeCompare(b)), [groupedRows]);

  const filteredGroupTabs = useMemo(() => {
    const search = groupSearch.trim().toLowerCase();

    if (!search) {
      return groupTabs;
    }

    return groupTabs.filter((groupName) => groupName.toLowerCase().includes(search));
  }, [groupSearch, groupTabs]);

  const displayedRows = useMemo(() => {
    if (!selectedGroupName) {
      return rows;
    }

    return groupedRows[selectedGroupName] || [];
  }, [groupedRows, rows, selectedGroupName]);

  const handleSearch = () => {
    if (!range?.from || !range?.to) return;

    setSelectedGroupName(null);
    setGroupSearch('');
    setParams({
      from: dayjs(range.from).format('YYYY-MM-DD'),
      to: dayjs(range.to).format('YYYY-MM-DD'),
    });
  };

  const handleReset = () => {
    setRange({
      from: today.toDate(),
      to: today.toDate(),
    });
    setParams(null);
    setSelectedGroupName(null);
    setGroupSearch('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                <ListOrdered className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight">Expense List</h1>
                <p className="text-sm text-muted-foreground">Saved expenses and expense inputs</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setRange({
                    from: today.toDate(),
                    to: today.toDate(),
                  })
                }
              >
                Today
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setRange({
                    from: today.subtract(7, 'day').toDate(),
                    to: today.toDate(),
                  })
                }
              >
                Last 7 Days
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setRange({
                    from: today.startOf('month').toDate(),
                    to: today.toDate(),
                  })
                }
              >
                This Month
              </Button>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium leading-tight text-foreground">Date Range</label>

              <div className="grid gap-2 sm:grid-cols-2 lg:max-w-xl">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('h-10 min-w-[13rem] justify-start rounded-xl text-left font-normal', !selectedFrom && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 size-4 shrink-0" />
                      {selectedFrom ? dayjs(selectedFrom).format('MMM DD, YYYY') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto rounded-2xl p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedFrom}
                      onSelect={(date) =>
                        setRange((current) => ({
                          from: date,
                          to: date && current?.to && dayjs(current.to).isBefore(dayjs(date), 'day') ? date : current?.to,
                        }))
                      }
                      disabled={(date) => (selectedTo ? dayjs(date).isAfter(dayjs(selectedTo), 'day') : false)}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('h-10 min-w-[13rem] justify-start rounded-xl text-left font-normal', !selectedTo && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 size-4 shrink-0" />
                      {selectedTo ? dayjs(selectedTo).format('MMM DD, YYYY') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto rounded-2xl p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedTo}
                      onSelect={(date) => setRange((current) => ({ from: current?.from, to: date }))}
                      disabled={(date) => (selectedFrom ? dayjs(date).isBefore(dayjs(selectedFrom), 'day') : false)}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <Button variant="outline" className="h-10 rounded-xl" onClick={handleReset}>
                Reset
              </Button>

              <Button onClick={handleSearch} disabled={isFetching || !range?.from || !range?.to} className="h-10 rounded-xl px-5">
                {isFetching ? <LoaderCircle className="size-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </div>

          {hasSearched && rows.length > 0 && (
            <GroupTabsFilter
              items={filteredGroupTabs.map((groupName) => ({
                value: groupName,
                count: groupedRows[groupName]?.length ?? 0,
              }))}
              selectedValue={selectedGroupName}
              onSelectedValueChange={setSelectedGroupName}
              searchValue={groupSearch}
              onSearchValueChange={setGroupSearch}
              totalCount={rows.length}
              displayedCount={displayedRows.length}
              label="group"
              selectedLabel="Selected group"
              searchPlaceholder="Search group name..."
              noResultsMessage="No matching group names found."
              className="border-t border-border pt-3"
            />
          )}
        </div>
      </div>

      {isError && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to load expense list.'}
        </p>
      )}

      {data?.warning && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          External API rows were loaded, but saved DB rows could not be merged: {data.warning}
        </p>
      )}

      {!hasSearched ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
          Select a date range and click Search.
        </div>
      ) : (
        <DataTable
          rows={displayedRows}
          columns={columns}
          getRowKey={(row) => row.external_key}
          loading={isFetching}
          pagination
          paginationMode="frontend"
        />
      )}
    </div>
  );
}
