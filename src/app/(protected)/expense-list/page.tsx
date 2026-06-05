'use client';

import { useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import { fetchExpenseList } from './actions';
import { columns } from './expense-list.columns';
import { cn } from '@/lib/utils';

export default function ExpenseListPage() {
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const {
    data = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['expense-list'],
    queryFn: fetchExpenseList,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const groupedRows = useMemo(() => {
    return data.reduce<Record<string, typeof data>>((acc, row) => {
      const groupName = row.group_name?.trim() || 'Ungrouped';

      if (!acc[groupName]) {
        acc[groupName] = [];
      }

      acc[groupName].push(row);

      return acc;
    }, {});
  }, [data]);

  const groupTabs = useMemo(() => Object.keys(groupedRows), [groupedRows]);

  const displayedRows = useMemo(() => {
    if (!selectedGroupName) {
      return data;
    }

    return groupedRows[selectedGroupName] || [];
  }, [data, groupedRows, selectedGroupName]);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <Wallet className="h-7 w-7 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Expense List</h1>
            <p className="text-sm text-muted-foreground">Saved expenses and expense inputs</p>
          </div>
        </div>
      </div>

      {isError && <p className="mb-4 text-sm text-red-600">Failed to load expense list.</p>}

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {displayedRows.length} of {data.length} rows
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
            All ({data.length})
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

      <DataTable rows={displayedRows} columns={columns} getRowKey={(row) => row.id} loading={isFetching} pagination paginationMode="frontend" />
    </div>
  );
}
