'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import DataTable from '../components/DataTable';
import { apiFetch } from '@/lib/api';
import { Moa } from '../../types/moa';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { createExpenseMoaColumns } from './columns';
import PageHeader from '../components/PageHeader';

type MoaListResponse = {
  data: Moa[];
  error?: string;
};

export default function ExpenseMoasPage() {
  const router = useRouter();

  const { data: moas } = useQuery<Moa[]>({
    queryKey: ['expense-moas'],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/moa`);
      const data: MoaListResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch MOAs');
      }

      return data.data ?? [];
    },
  });

  const columns = createExpenseMoaColumns({ router });

  return (
    <div>
      <PageHeader
        title="Expense MOAs"
        subtitle="Manage expense MOAs and assigned locations"
        icon={FileText}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/expense-moas/create')}>
            Create MOA
          </Button>
        }
        className="mb-6"
      />
      <DataTable rows={moas ?? []} columns={columns} getRowKey={(row) => row.id} onRowClick={(row) => router.push(`/expense-moas/${row.id}`)} />
    </div>
  );
}
