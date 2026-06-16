'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../../components/DataTable';
import { fetchJVRevenues, RevenueList, saveJVCollectionInputs } from './action';
import { getColumns } from './columns';
import { HandCoins, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PageHeader from '../../components/PageHeader';

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
      <PageHeader
        title="JV - Revenue Detail"
        subtitle="ERP Revenue Report"
        icon={HandCoins}
        actions={
          <Button onClick={handleSave} disabled={isSaving || isFetching || !hasCollectionInput} className="h-10 rounded-xl px-5">
            {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : 'Save'}
          </Button>
        }
        className="mb-6"
      />

      {isError && <p className="mb-4 text-sm text-red-600">Failed to load collection.</p>}

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <DataTable rows={rows} columns={columns} getRowKey={(row) => row.invoice_id} loading={isFetching} pagination paginationMode="frontend" />
      </div>
    </div>
  );
}
