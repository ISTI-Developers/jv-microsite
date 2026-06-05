'use client';

import { useQuery } from '@tanstack/react-query';
import DataTable from '../../components/DataTable';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Moa } from '../../../types/moa';
import { columns } from './columns';

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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          JV Expense - {user?.profile.first_name} {user?.profile.last_name}
        </h1>
      </div>

      <DataTable rows={moas ?? []} columns={columns} getRowKey={(row) => row.id} onRowClick={(row) => router.push(`/jv/expense-moas/${row.id}`)} />
    </div>
  );
}
