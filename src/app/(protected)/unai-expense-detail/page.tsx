'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { CalendarIcon, ChevronLeft, ChevronRight, LoaderCircle, Receipt, Search, X } from 'lucide-react';

import DataTable from '../components/DataTable';
import { getExpenseColumns } from './expense.columns';
import { ExpenseRow, fetchExpenses, saveRealizedExpenses } from './action';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  const [openTitleGroups, setOpenTitleGroups] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const selectedFrom = range?.from;
  const selectedTo = range?.to;
  const groupTabsRef = useRef<HTMLDivElement | null>(null);

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
      setOpenTitleGroups([]);
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

  const titleGroupedRows = useMemo(() => {
    return displayedRows.reduce<Record<string, ExpenseRow[]>>((acc, row) => {
      const title = row.cTitle?.trim() || 'Untitled';

      if (!acc[title]) {
        acc[title] = [];
      }

      acc[title].push(row);

      return acc;
    }, {});
  }, [displayedRows]);

  const titleGroups = useMemo(() => Object.keys(titleGroupedRows).sort((a, b) => a.localeCompare(b)), [titleGroupedRows]);

  const handleSearch = () => {
    if (!range?.from || !range?.to) return;

    setParams({
      from: dayjs(range.from).format('YYYY-MM-DD'),
      to: dayjs(range.to).format('YYYY-MM-DD'),
    });
  };

  const scrollGroupTabs = (direction: 'left' | 'right') => {
    groupTabsRef.current?.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
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
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                <Receipt className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight">UNAI - Expense Detail</h1>
                <p className="text-sm text-muted-foreground">ERP Expense Report</p>
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
              <Button
                variant="outline"
                className="h-10 rounded-xl"
                onClick={() => {
                  setRange(undefined);
                  setParams(null);
                  setRows([]);
                  setSelectedGroupName(null);
                  setGroupSearch('');
                  setOpenTitleGroups([]);
                }}
              >
                Reset
              </Button>

              <Button onClick={handleSearch} disabled={isFetching || !range?.from || !range?.to} className="h-10 rounded-xl px-5">
                {isFetching ? <LoaderCircle className="size-4 animate-spin" /> : 'Search'}
              </Button>

              <Button onClick={handleSave} disabled={isSaving || isFetching || !hasExpenseInput} className="h-10 rounded-xl px-5">
                {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-xs text-muted-foreground">
                <p>
                  Showing {displayedRows.length} of {rows.length} rows
                </p>
                {selectedGroupName && <p className="truncate lg:max-w-[24rem]">Selected group: {selectedGroupName}</p>}
              </div>

              <div className="relative w-full max-w-sm">
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
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedGroupName(null);
                  setOpenTitleGroups([]);
                }}
                className={cn(
                  'shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition',
                  selectedGroupName === null
                    ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                All ({rows.length})
              </button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Scroll group names left"
                disabled={filteredGroupTabs.length === 0}
                onClick={() => scrollGroupTabs('left')}
                className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div ref={groupTabsRef} className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {filteredGroupTabs.map((groupName) => (
                  <button
                    key={groupName}
                    type="button"
                    onClick={() => {
                      setSelectedGroupName(groupName);
                      setOpenTitleGroups([]);
                    }}
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

              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Scroll group names right"
                disabled={filteredGroupTabs.length === 0}
                onClick={() => scrollGroupTabs('right')}
                className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            {groupSearch && filteredGroupTabs.length === 0 && <p className="mt-3 text-xs text-muted-foreground">No matching group names found.</p>}
          </div>
        </div>
      </div>

      {isError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Failed to load expenses.</div>}

      {titleGroups.length > 0 ? (
        <Accordion type="multiple" value={openTitleGroups} onValueChange={setOpenTitleGroups} className="space-y-3">
          {titleGroups.map((titleGroup) => {
            const titleRows = titleGroupedRows[titleGroup] || [];

            return (
              <AccordionItem key={titleGroup} value={titleGroup} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-2">
                    <span className="truncate text-sm font-semibold text-foreground">{titleGroup}</span>
                    <span className="shrink-0 text-xs font-normal text-muted-foreground">
                      {titleRows.length} {titleRows.length === 1 ? 'row' : 'rows'}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-3 pb-3">
                  <DataTable
                    rows={titleRows}
                    columns={columns}
                    getRowKey={(row) => row.rowKey}
                    loading={isFetching}
                    pagination
                    paginationMode="frontend"
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          {isFetching ? (
            <DataTable rows={[]} columns={columns} getRowKey={(row) => row.rowKey} loading={isFetching} pagination paginationMode="frontend" />
          ) : (
            'No expenses found.'
          )}
        </div>
      )}
    </div>
  );
}
