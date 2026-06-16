'use client';

import { useQuery } from '@tanstack/react-query';
import DataTable from '../../components/DataTable';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Moa } from '../../../types/moa';
import { columns } from './columns';
import { Handshake } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

type MoaListResponse = {
  data: Moa[];
  error?: string;
};

export default function JVExpenseMoasPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: moas } = useQuery<Moa[]>({
    queryKey: ['jv-moas'],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/moa`);
      const data: MoaListResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch MOAs');
      }

      return data.data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`JV Expense - ${user?.profile.first_name ?? ''} ${user?.profile.last_name ?? ''}`}
        subtitle="Review assigned expense MOAs and locations"
        icon={Handshake}
      />

      <DataTable rows={moas ?? []} columns={columns} getRowKey={(row) => row.id} onRowClick={(row) => router.push(`/jv/expense-moas/${row.id}`)} />
    </div>
  );
}
