'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../../components/DataTable';
import { fetchJVRevenues, RevenueList, saveJVCollectionInputs } from './action';
import { getColumns } from './columns';
import { LoaderCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function RevenuePage() {
  const [rows, setRows] = useState<RevenueList[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['jv-collection-revenues'],
    queryFn: fetchJVRevenues,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const columns = useMemo(() => getColumns(setRows), []);

  useEffect(() => {
    if (data) {
      setRows(data);
    }
  }, [data]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const result = await saveJVCollectionInputs(rows, null);

      toast.success(result?.message || 'JV collection input saved successfully');
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

  const hasCollectionInput = rows.some((row) => row.collectionAmount !== '' && row.collectionAmount !== null && row.collectionAmount !== undefined);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <Wallet className="h-7 w-7 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">JV Collection</h1>
            <p className="text-sm text-muted-foreground">ERP Collection Report</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving || isFetching || !hasCollectionInput} className="h-11 rounded-xl px-6">
          {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : 'Save'}
        </Button>
      </div>

      {isError && <p className="mb-4 text-sm text-red-600">Failed to load collection.</p>}

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <DataTable rows={rows} columns={columns} getRowKey={(row) => row.invoice_id} loading={isFetching} pagination paginationMode="frontend" />
      </div>
    </div>
  );
}
