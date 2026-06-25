'use client';

import { ReactNode, useRef } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type GroupTabsFilterItem = {
  value: string;
  label?: ReactNode;
  count?: number;
};

type GroupTabsFilterProps = {
  items: GroupTabsFilterItem[];
  selectedValue: string | null;
  onSelectedValueChange: (value: string | null) => void;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  totalCount: number;
  displayedCount: number;
  label?: string;
  selectedLabel?: string;
  searchPlaceholder?: string;
  noResultsMessage?: string;
  allLabel?: string;
  showAllTab?: boolean;
  showCounts?: boolean;
  countSuffix?: string;
  className?: string;
};

export default function GroupTabsFilter({
  items,
  selectedValue,
  onSelectedValueChange,
  searchValue,
  onSearchValueChange,
  totalCount,
  displayedCount,
  label = 'group',
  selectedLabel = `Selected ${label}`,
  searchPlaceholder = `Search ${label}...`,
  noResultsMessage = `No matching ${label}s found.`,
  allLabel = 'All',
  showAllTab = true,
  showCounts = true,
  countSuffix = 'rows',
  className,
}: GroupTabsFilterProps) {
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const allSelected = selectedValue === null;

  const scrollTabs = (direction: 'left' | 'right') => {
    tabsRef.current?.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  const renderCount = (count: number | undefined) => (showCounts && count !== undefined ? ` (${count})` : '');

  return (
    <div className={className}>
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-xs text-muted-foreground">
          <p>
            Showing {displayedCount} of {totalCount} {countSuffix}
          </p>
          <p className="truncate lg:max-w-[24rem]">
            {selectedLabel}: {selectedValue ?? allLabel}
          </p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchValueChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 rounded-xl bg-background pl-9 pr-10 text-sm"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchValueChange('')}
              aria-label={`Clear ${label} search`}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        {showAllTab && (
          <button
            type="button"
            onClick={() => onSelectedValueChange(null)}
            className={cn(
              'shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition',
              allSelected
                ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {allLabel}
            {renderCount(totalCount)}
          </button>
        )}

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Scroll ${label}s left`}
          disabled={items.length === 0}
          onClick={() => scrollTabs('left')}
          className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div ref={tabsRef} className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onSelectedValueChange(item.value)}
              className={cn(
                'max-w-[18rem] shrink-0 truncate rounded-xl border px-4 py-2 text-sm font-medium transition',
                selectedValue === item.value
                  ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.label ?? item.value}
              {renderCount(item.count)}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Scroll ${label}s right`}
          disabled={items.length === 0}
          onClick={() => scrollTabs('right')}
          className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {items.length === 0 && <p className="mt-3 text-xs text-muted-foreground">{noResultsMessage}</p>}
    </div>
  );
}
