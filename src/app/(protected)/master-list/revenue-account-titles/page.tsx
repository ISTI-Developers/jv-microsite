'use client';

import { useCallback, useMemo, useState } from 'react';
import { HandCoins, RotateCcw, Save, Search } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { createRevenueAccountTitleColumns } from './columns';
import { RevenueAccountTitle, RevenueAccountTitlesResponse, SaveRevenueAccountTitlesRequest } from './types';

const QUERY_KEY = ['master-revenue-account-titles'];

function isAccountEnabled(item: RevenueAccountTitle) {
  return Number(item.is_enabled) === 1;
}

async function fetchRevenueAccountTitles() {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/master-list/revenue-account-titles`);
  const data = (await res.json()) as RevenueAccountTitlesResponse;

  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to fetch revenue account titles');
  }

  return data.data;
}

async function saveRevenueAccountTitles(body: SaveRevenueAccountTitlesRequest) {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/master-list/revenue-account-titles/save`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok || data?.success === false) {
    throw new Error(data?.error || data?.message || 'Failed to save revenue account titles');
  }

  return data;
}

export default function RevenueAccountTitlesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [enabledOverrides, setEnabledOverrides] = useState<Record<string, boolean>>({});

  const {
    data: accountTitles = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery<RevenueAccountTitle[]>({
    queryKey: QUERY_KEY,
    queryFn: fetchRevenueAccountTitles,
  });

  const sortedAccountTitles = useMemo(
    () =>
      [...accountTitles].sort((a, b) =>
        a.account_title.localeCompare(b.account_title, undefined, {
          sensitivity: 'base',
          numeric: true,
        })
      ),
    [accountTitles]
  );

  const filteredAccountTitles = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return sortedAccountTitles;

    return sortedAccountTitles.filter((item) => {
      return item.account_no.toLowerCase().includes(term) || item.account_title.toLowerCase().includes(term);
    });
  }, [search, sortedAccountTitles]);

  const currentEnabledByAccountNo = useMemo(() => {
    return sortedAccountTitles.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.account_no] = enabledOverrides[item.account_no] ?? isAccountEnabled(item);
      return acc;
    }, {});
  }, [enabledOverrides, sortedAccountTitles]);

  const enabledCount = useMemo(
    () => sortedAccountTitles.filter((item) => currentEnabledByAccountNo[item.account_no]).length,
    [currentEnabledByAccountNo, sortedAccountTitles]
  );

  const unsavedCount = useMemo(
    () => sortedAccountTitles.filter((item) => currentEnabledByAccountNo[item.account_no] !== isAccountEnabled(item)).length,
    [currentEnabledByAccountNo, sortedAccountTitles]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const enabledAccountTitles = sortedAccountTitles
        .filter((item) => currentEnabledByAccountNo[item.account_no])
        .map((item) => ({
          account_no: item.account_no,
          account_title: item.account_title,
        }));
      const body: SaveRevenueAccountTitlesRequest = { account_titles: enabledAccountTitles };

      return saveRevenueAccountTitles(body);
    },
    onSuccess: () => {
      toast.success('Revenue account titles updated');
      setEnabledOverrides({});
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (mutationError) => {
      if (mutationError instanceof Error) {
        toast.error(mutationError.message);
      } else {
        toast.error('Something went wrong');
      }
    },
  });

  const setAccountEnabled = useCallback((accountNo: string, enabled: boolean) => {
    setEnabledOverrides((prev) => ({ ...prev, [accountNo]: enabled }));
  }, []);

  const setFilteredEnabled = (enabled: boolean) => {
    setEnabledOverrides((prev) => {
      const next = { ...prev };
      filteredAccountTitles.forEach((item) => {
        next[item.account_no] = enabled;
      });
      return next;
    });
  };

  const isSaving = saveMutation.isPending;
  const columns = useMemo(
    () =>
      createRevenueAccountTitleColumns({
        currentEnabledByAccountNo,
        setAccountEnabled,
        isSaving,
      }),
    [currentEnabledByAccountNo, isSaving, setAccountEnabled]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue Account Titles"
        subtitle="Manage enabled revenue account titles for manual revenue entry."
        icon={HandCoins}
        actions={
          <Button type="button" onClick={() => saveMutation.mutate()} disabled={unsavedCount === 0 || isSaving}>
            <Save />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-3xl shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Enabled</p>
            <p className="mt-2 text-2xl font-semibold">{enabledCount}</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-2 text-2xl font-semibold">{sortedAccountTitles.length}</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Unsaved Changes</p>
            <p className="mt-2 text-2xl font-semibold">{unsavedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">Revenue Account Title List</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredAccountTitles.length} of {sortedAccountTitles.length} revenue account titles shown
                {isFetching && !isLoading ? ' · Refreshing...' : ''}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFilteredEnabled(true)}
                disabled={filteredAccountTitles.length === 0 || isSaving}
              >
                Enable all filtered
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFilteredEnabled(false)}
                disabled={filteredAccountTitles.length === 0 || isSaving}
              >
                Disable all filtered
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEnabledOverrides({})} disabled={unsavedCount === 0 || isSaving}>
                <RotateCcw />
                Reset changes
              </Button>
            </div>
          </div>

          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search revenue account number or title"
              className="h-10 pl-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <DataTable rows={[]} columns={columns} getRowKey={(row) => row.account_no} loading pagination paginationMode="frontend" hideSearch />
          ) : null}

          {isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load revenue account titles'}
            </div>
          ) : null}

          {!isLoading && !isError && sortedAccountTitles.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">No revenue account titles found.</div>
          ) : null}

          {!isLoading && !isError && sortedAccountTitles.length > 0 && filteredAccountTitles.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
              No revenue account titles match your search.
            </div>
          ) : null}

          {!isLoading && !isError && filteredAccountTitles.length > 0 ? (
            <DataTable
              rows={filteredAccountTitles}
              columns={columns}
              getRowKey={(row) => row.account_no}
              loading={isFetching && !isLoading}
              pagination
              paginationMode="frontend"
              hideSearch
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
