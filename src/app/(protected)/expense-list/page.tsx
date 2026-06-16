'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ListOrdered, Search, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import DataTable from '../components/DataTable';
import { fetchExpenseList } from './actions';
import { columns } from './expense-list.columns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '../components/PageHeader';

export default function ExpenseListPage() {
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const groupTabsRef = useRef<HTMLDivElement | null>(null);
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
      return data;
    }

    return groupedRows[selectedGroupName] || [];
  }, [data, groupedRows, selectedGroupName]);

  const scrollGroupTabs = (direction: 'left' | 'right') => {
    groupTabsRef.current?.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Expense List" subtitle="Saved expenses and expense inputs" icon={ListOrdered} className="mb-6" />

      {isError && <p className="mb-4 text-sm text-red-600">Failed to load expense list.</p>}

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-xs text-muted-foreground">
            <p>
              Showing {displayedRows.length} of {data.length} rows
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

      <DataTable rows={displayedRows} columns={columns} getRowKey={(row) => row.id} loading={isFetching} pagination paginationMode="frontend" />
    </div>
  );
}
