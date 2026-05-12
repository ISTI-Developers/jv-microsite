'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { CalendarIcon, LoaderCircle } from 'lucide-react';

import DataTable from '../components/DataTable';
import { getExpenseColumns } from './expense.columns';
import { ExpenseRow, fetchExpenses, saveRealizedExpenses } from './action';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';

export default function ExpensePage() {
  const today = dayjs();

  const [range, setRange] = useState<DateRange | undefined>({
    from: today.toDate(),
    to: today.toDate(),
  });

  const [params, setParams] = useState<{ from: string; to: string } | null>(null);
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
    }
  }, [data]);
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

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('h-11 min-w-[18rem] justify-start rounded-xl text-left font-normal', !range?.from && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 size-4 shrink-0" />
                  {range?.from ? (
                    range.to ? (
                      <>
                        {dayjs(range.from).format('MMM DD, YYYY')} - {dayjs(range.to).format('MMM DD, YYYY')}
                      </>
                    ) : (
                      dayjs(range.from).format('MMM DD, YYYY')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto rounded-2xl p-0" align="start">
                <Calendar mode="range" defaultMonth={range?.from} selected={range} onSelect={setRange} numberOfMonths={2} autoFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2 lg:justify-end">
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              onClick={() => {
                setRange(undefined);
                setParams(null);
                setRows([]);
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

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <DataTable rows={rows} columns={columns} getRowKey={(_, index) => index} loading={isFetching} pagination paginationMode="frontend" />{' '}
      </div>
    </div>
  );
}
