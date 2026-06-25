'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LoaderCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { searchVouchers } from '../action';

type VoucherSuggestInputProps = {
  value: string;
  isValid?: boolean;
  error?: string;
  disabled?: boolean;
  onChange: (value: string, voucherValid: boolean) => void;
};

type DropdownStyle = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

export default function VoucherSuggestInput({ value, isValid, error, disabled = false, onChange }: VoucherSuggestInputProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [vouchers, setVouchers] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<DropdownStyle | null>(null);
  const trimmedSearch = search.trim();
  const canSearch = trimmedSearch.length >= 2;

  const updateDropdownPosition = useCallback(() => {
    const rect = inputRef.current?.getBoundingClientRect();

    if (!rect) {
      setDropdownStyle(null);
      return;
    }

    const viewportMargin = 12;
    const sideOffset = 4;
    const normalMaxHeight = 240;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const availableBelow = Math.max(0, viewportHeight - rect.bottom - viewportMargin - sideOffset);
    const availableAbove = Math.max(0, rect.top - viewportMargin - sideOffset);
    const openUpward = availableBelow < 160 && availableAbove > availableBelow;
    const availableHeight = openUpward ? availableAbove : availableBelow;
    const maxHeight = Math.min(normalMaxHeight, availableHeight);
    const maxWidth = Math.max(0, viewportWidth - viewportMargin * 2);
    const width = Math.min(rect.width, maxWidth);
    const left = Math.min(Math.max(rect.left, viewportMargin), viewportWidth - viewportMargin - width);

    setDropdownStyle({
      ...(openUpward ? { bottom: viewportHeight - rect.top + sideOffset } : { top: rect.bottom + sideOffset }),
      left,
      width,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    updateDropdownPosition();

    const handleWindowChange = () => updateDropdownPosition();
    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);
    document.addEventListener('mousedown', handleDocumentMouseDown);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [open, updateDropdownPosition]);

  useEffect(() => {
    if (!open) return;

    updateDropdownPosition();
  }, [isSearching, open, updateDropdownPosition, vouchers.length]);

  useEffect(() => {
    if (!open || !canSearch) {
      setVouchers([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timeoutId = window.setTimeout(() => {
      searchVouchers(trimmedSearch)
        .then((results) => {
          if (!cancelled) {
            setVouchers(results);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [canSearch, open, trimmedSearch]);

  const exactMatch = useMemo(() => vouchers.some((voucher) => voucher === trimmedSearch), [trimmedSearch, vouchers]);
  const invalid = Boolean(error) || (search.trim().length > 0 && isValid === false);

  const handleSearchChange = (nextValue: string) => {
    const nextSearch = nextValue.trim();

    setSearch(nextValue);
    setOpen(nextSearch.length >= 2);
    window.requestAnimationFrame(updateDropdownPosition);
    onChange(
      nextValue,
      vouchers.some((voucher) => voucher === nextSearch)
    );
  };

  const handleSelect = (voucher: string) => {
    setSearch(voucher);
    setOpen(false);
    onChange(voucher, true);
  };

  const dropdown =
    open && dropdownStyle && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={dropdownRef}
            className="overflow-y-auto rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-md"
            style={{
              position: 'fixed',
              top: dropdownStyle.top,
              bottom: dropdownStyle.bottom,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              maxHeight: dropdownStyle.maxHeight,
              zIndex: 9999,
            }}
          >
            {!canSearch ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">Type at least 2 characters</p>
            ) : isSearching ? (
              <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Searching vouchers...
              </p>
            ) : vouchers.length > 0 ? (
              <div className="space-y-1">
                {vouchers.map((voucher) => (
                  <button
                    key={voucher}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(voucher)}
                    className={cn(
                      'flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted',
                      voucher === value && 'bg-muted font-medium text-foreground'
                    )}
                  >
                    {voucher}
                  </button>
                ))}
              </div>
            ) : exactMatch ? null : (
              <p className="px-3 py-3 text-sm text-muted-foreground">No vouchers found</p>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef}>
      <div className="relative min-w-[12rem]">
        <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={search}
          disabled={disabled}
          onChange={(event) => handleSearchChange(event.target.value)}
          onFocus={() => {
            if (search.trim().length >= 2) {
              setOpen(true);
              window.requestAnimationFrame(updateDropdownPosition);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder="Search voucher no."
          aria-invalid={invalid}
          className="h-10 rounded-xl pl-9"
        />
      </div>

      {dropdown}

      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
