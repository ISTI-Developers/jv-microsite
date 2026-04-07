'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import { fetchExpenses } from './action';

import dayjs, { Dayjs } from 'dayjs';
import { columns } from './expense.columns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoaderCircle } from 'lucide-react';

export default function ExpensePage() {
  const today = dayjs();

  const [from, setFrom] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(today);

  const [params, setParams] = useState<{ from: string; to: string } | null>(null);

  const {
    data = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['expenses', params],
    queryFn: () => fetchExpenses(params!.from, params!.to),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleSearch = () => {
    if (!from || !to) return;

    setParams({
      from: from.format('YYYY-MM-DD'),
      to: to.format('YYYY-MM-DD'),
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Expenses</h1>
        <p className="mt-1 text-sm text-muted-foreground">ERP Expense Report</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <label htmlFor="expense-from" className="text-sm font-medium">
            From
          </label>
          <Input
            id="expense-from"
            type="date"
            value={from ? from.format('YYYY-MM-DD') : ''}
            max={to ? to.format('YYYY-MM-DD') : today.format('YYYY-MM-DD')}
            onChange={(event) => setFrom(event.target.value ? dayjs(event.target.value) : null)}
            className="h-10 min-w-[12rem]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="expense-to" className="text-sm font-medium">
            To
          </label>
          <Input
            id="expense-to"
            type="date"
            value={to ? to.format('YYYY-MM-DD') : ''}
            min={from ? from.format('YYYY-MM-DD') : undefined}
            onChange={(event) => setTo(event.target.value ? dayjs(event.target.value) : null)}
            className="h-10 min-w-[12rem]"
          />
        </div>

        <Button onClick={handleSearch} disabled={isFetching} className="h-10 sm:ml-auto">
          {isFetching ? <LoaderCircle className="size-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setFrom(today);
            setTo(today);
          }}
        >
          Today
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setFrom(today.subtract(7, 'day'));
            setTo(today);
          }}
        >
          Last 7 Days
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setFrom(today.startOf('month'));
            setTo(today);
          }}
        >
          This Month
        </Button>
      </div>

      {isError && <p className="mb-4 text-sm text-red-600">Failed to load expenses.</p>}

      <DataTable rows={data} columns={columns} getRowKey={(row) => row.cTranNo.trim()} loading={isFetching} pagination paginationMode="frontend" />
    </div>
  );
}
