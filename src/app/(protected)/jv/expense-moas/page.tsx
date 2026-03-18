'use client';

import { useQuery } from '@tanstack/react-query';
import { Box, Typography } from '@mui/material';
import DataTable, { Column } from '../../components/DataTable';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

type Moa = {
  id: number;
  moa_name: string;
};

export default function JVExpenseMoasPage() {
  const router = useRouter();

  const { data: moas } = useQuery<Moa[]>({
    queryKey: ['jv-moas'],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/moa`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch MOAs');
      }

      return data.data;
    },
  });

  const columns: Column<Moa>[] = [
    {
      header: 'MOA',
      render: (row) => row.moa_name,
    },
  ];

  return (
    <Box>
      <Typography variant="h5" mb={2}>
        My MOAs
      </Typography>

      <DataTable
        rows={moas ?? []}
        columns={columns}
        getRowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/jv/expense-moas/${row.id}`)}
      />
    </Box>
  );
}
