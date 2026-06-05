'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { CalendarIcon, LoaderCircle, Receipt, Search, X } from 'lucide-react';

import DataTable from '../components/DataTable';
import { getExpenseColumns } from './expense.columns';
import { ExpenseRow, fetchExpenses, saveRealizedExpenses } from './action';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ExpensePage() {
  const today = dayjs();

  const [range, setRange] = useState<DateRange | undefined>({
    from: today.toDate(),
    to: today.toDate(),
  });

  const [params, setParams] = useState<{ from: string; to: string } | null>(null);
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const selectedFrom = range?.from;
  const selectedTo = range?.to;

  const { data, isFetching, isError } = useQuery({
    queryKey: ['expenses', params],
    queryFn: () => fetchExpenses(params!.from, params!.to),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      setRows(data);
      setSelectedGroupName(null);
      setGroupSearch('');
    }
  }, [data]);

  const groupedRows = useMemo(() => {
    return rows.reduce<Record<string, ExpenseRow[]>>((acc, row) => {
      const groupName = row.cGroupName?.trim() || 'Ungrouped';

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

    setParams({
      from: dayjs(range.from).format('YYYY-MM-DD'),
      to: dayjs(range.to).format('YYYY-MM-DD'),
    });
  };

  const columns = useMemo(() => getExpenseColumns(setRows), []);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const result = await saveRealizedExpenses(rows, null);

      toast.success(result?.message || 'Realized expenses saved successfully');
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const hasExpenseInput = rows.some((row) => row.realizedExpense !== '' && row.realizedExpense !== null && row.realizedExpense !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <Receipt className="h-7 w-7 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Expenses</h1>
            <p className="text-sm text-muted-foreground">ERP Expense Report</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <label className="block text-sm font-medium leading-tight text-foreground">Date Range</label>

            <div className="grid gap-3 sm:grid-cols-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('h-11 min-w-[14rem] justify-start rounded-xl text-left font-normal', !selectedFrom && 'text-muted-foreground')}
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
                    className={cn('h-11 min-w-[14rem] justify-start rounded-xl text-left font-normal', !selectedTo && 'text-muted-foreground')}
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

          <div className="flex items-center gap-2 lg:justify-end">
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              onClick={() => {
                setRange(undefined);
                setParams(null);
                setRows([]);
                setSelectedGroupName(null);
                setGroupSearch('');
              }}
            >
              Reset
            </Button>

            <Button onClick={handleSearch} disabled={isFetching || !range?.from || !range?.to} className="h-11 rounded-xl px-6">
              {isFetching ? <LoaderCircle className="size-4 animate-spin" /> : 'Search'}
            </Button>

            <Button onClick={handleSave} disabled={isSaving || isFetching || !hasExpenseInput} className="h-11 rounded-xl px-6">
              {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {isError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Failed to load expenses.</div>}

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {displayedRows.length} of {rows.length} rows
          </p>
          {selectedGroupName && <p className="truncate sm:max-w-[24rem]">Selected group: {selectedGroupName}</p>}
        </div>

        <div className="relative mb-3 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={groupSearch}
            onChange={(event) => setGroupSearch(event.target.value)}
            placeholder="Search group name..."
            className="h-10 rounded-xl bg-background pl-9 pr-10 text-sm"
          />
          {groupSearch && (
            <button
              type="button"
              onClick={() => setGroupSearch('')}
              aria-label="Clear group search"
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedGroupName(null)}
            className={cn(
              'shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition',
              selectedGroupName === null
                ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            All ({rows.length})
          </button>

          {filteredGroupTabs.map((groupName) => (
            <button
              key={groupName}
              type="button"
              onClick={() => setSelectedGroupName(groupName)}
              className={cn(
                'max-w-[18rem] shrink-0 truncate rounded-xl border px-4 py-2 text-sm font-medium transition',
                selectedGroupName === groupName
                  ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {groupName} ({groupedRows[groupName]?.length || 0})
            </button>
          ))}
        </div>

        {groupSearch && filteredGroupTabs.length === 0 && <p className="mt-3 text-xs text-muted-foreground">No matching group names found.</p>}
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <DataTable
          rows={displayedRows}
          columns={columns}
          getRowKey={(row) => row.rowKey}
          loading={isFetching}
          pagination
          paginationMode="frontend"
        />{' '}
      </div>
    </div>
  );
}
