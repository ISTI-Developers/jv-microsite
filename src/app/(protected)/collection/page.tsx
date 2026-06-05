'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import { fetchRevenues, RevenueRow, saveRealizedRevenues } from './action';
import { getRevenueColumns } from './columns';

import dayjs, { Dayjs } from 'dayjs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, LoaderCircle, ReceiptText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function RevenuePage() {
  const today = dayjs();

  const [from, setFrom] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(today);
  const [params, setParams] = useState<{ from: string; to: string } | null>(null);
  const [rows, setRows] = useState<RevenueRow[]>([]);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['revenues', params],
    queryFn: () => fetchRevenues(params!.from, params!.to),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const columns = useMemo(() => getRevenueColumns(setRows), []);

  useEffect(() => {
    if (data) {
      setRows(data);
      setSelectedGroupName(null);
    }
  }, [data]);

  const groupedRows = useMemo(() => {
    return rows.reduce<Record<string, RevenueRow[]>>((acc, row) => {
      const groupName = row.cGroupName?.trim() || 'Ungrouped';

      if (!acc[groupName]) {
        acc[groupName] = [];
      }

      acc[groupName].push(row);

      return acc;
    }, {});
  }, [rows]);

  const groupTabs = useMemo(() => Object.keys(groupedRows), [groupedRows]);

  const displayedRows = useMemo(() => {
    if (!selectedGroupName) {
      return rows;
    }

    return groupedRows[selectedGroupName] || [];
  }, [groupedRows, rows, selectedGroupName]);

  const handleSearch = () => {
    if (!from || !to) return;

    setParams({
      from: from.format('YYYY-MM-DD'),
      to: to.format('YYYY-MM-DD'),
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const result = await saveRealizedRevenues(rows, null);

      toast.success(result?.message || 'Realized revenue saved successfully');
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

  const hasRevenueInput = rows.some((row) => row.realizedRevenue !== '' && row.realizedRevenue !== null && row.realizedRevenue !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <ReceiptText className="h-7 w-7 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Collection</h1>
            <p className="text-sm text-muted-foreground">ERP Collection Report</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFrom(today);
              setTo(today);
            }}
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFrom(today.subtract(7, 'day'));
              setTo(today);
            }}
          >
            Last 7 Days
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFrom(today.startOf('month'));
              setTo(today);
            }}
          >
            This Month
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('h-11 w-full min-w-[14rem] justify-start rounded-xl text-left font-normal', !from && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 size-4 shrink-0" />
                    {from ? from.format('MMM DD, YYYY') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-2xl p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={from ? from.toDate() : undefined}
                    onSelect={(date) => setFrom(date ? dayjs(date) : null)}
                    disabled={(date) => {
                      const selectedTo = to ? to.startOf('day') : today.startOf('day');
                      return dayjs(date).isAfter(selectedTo, 'day');
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('h-11 w-full min-w-[14rem] justify-start rounded-xl text-left font-normal', !to && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 size-4 shrink-0" />
                    {to ? to.format('MMM DD, YYYY') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-2xl p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={to ? to.toDate() : undefined}
                    onSelect={(date) => setTo(date ? dayjs(date) : null)}
                    disabled={(date) => {
                      if (!from) return false;
                      return dayjs(date).isBefore(from.startOf('day'), 'day');
                    }}
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
                setFrom(null);
                setTo(today);
                setParams(null);
                setRows([]);
                setSelectedGroupName(null);
              }}
            >
              Reset
            </Button>

            <Button onClick={handleSearch} disabled={isFetching || !from || !to} className="h-11 rounded-xl px-6">
              {isFetching ? <LoaderCircle className="size-4 animate-spin" /> : 'Search'}
            </Button>

            <Button onClick={handleSave} disabled={isSaving || isFetching || !hasRevenueInput} className="h-11 rounded-xl px-6">
              {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {isError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Failed to load revenue.</div>}

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {displayedRows.length} of {rows.length} rows
          </p>
          {selectedGroupName && <p className="truncate sm:max-w-[24rem]">Selected group: {selectedGroupName}</p>}
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

          {groupTabs.map((groupName) => (
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
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <DataTable rows={displayedRows} columns={columns} getRowKey={(row) => row.rowKey} loading={isFetching} pagination paginationMode="frontend" />
      </div>
    </div>
  );
}
