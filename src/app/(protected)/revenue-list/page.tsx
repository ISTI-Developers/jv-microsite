'use client';

import { useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import DataTable from '../components/DataTable';
import { fetchRevenueList } from './actions';
import { columns } from './revenue-list.columns';

export default function RevenueListPage() {
  const {
    data = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['revenue-list'],
    queryFn: fetchRevenueList,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <Wallet className="h-7 w-7 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Revenue List</h1>
            <p className="text-sm text-muted-foreground">Saved collection and revenue inputs</p>
          </div>
        </div>
      </div>

      {isError && <p className="mb-4 text-sm text-red-600">Failed to load revenue list.</p>}

      <DataTable rows={data} columns={columns} getRowKey={(row) => row.id} loading={isFetching} pagination paginationMode="frontend" />
    </div>
  );
}
