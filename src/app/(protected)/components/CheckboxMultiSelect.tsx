'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type CheckboxMultiSelectValue = string | number;

export type CheckboxMultiSelectOption<T extends CheckboxMultiSelectValue> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type CheckboxMultiSelectProps<T extends CheckboxMultiSelectValue> = {
  options: CheckboxMultiSelectOption<T>[];
  value: T[];
  onChange: (nextValues: T[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  selectedLabel?: (count: number) => string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
};

export default function CheckboxMultiSelect<T extends CheckboxMultiSelectValue>({
  options,
  value,
  onChange,
  placeholder = 'Select options',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found.',
  selectedLabel = (count) => `${count} selected`,
  className,
  contentClassName,
  disabled = false,
}: CheckboxMultiSelectProps<T>) {
  const [search, setSearch] = useState('');

  const selectedValues = useMemo(() => new Set(value), [value]);
  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return options;

    return options.filter((option) => option.label.toLowerCase().includes(normalizedSearch));
  }, [options, search]);

  const toggleOption = (option: CheckboxMultiSelectOption<T>) => {
    if (option.disabled) return;

    if (selectedValues.has(option.value)) {
      onChange(value.filter((selectedValue) => selectedValue !== option.value));
      return;
    }

    onChange([...value, option.value]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('h-10 w-full justify-between rounded-xl text-left font-normal', className)}
        >
          <span className={cn('truncate', value.length === 0 && 'text-muted-foreground')}>
            {value.length > 0 ? selectedLabel(value.length) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className={cn('w-[min(32rem,calc(100vw-2rem))] rounded-2xl p-2', contentClassName)} align="start">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 rounded-xl pl-9 text-sm"
          />
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const selected = selectedValues.has(option.value);

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => toggleOption(option)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted',
                    selected && 'bg-muted text-foreground',
                    option.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent'
                  )}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                    {selected && <Check className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate" title={option.label}>
                    {option.label}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
