'use client';

import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import DataTable, { Column } from '../components/DataTable';
import { apiFetch } from '@/lib/api';
import CreateMoaModal from '../components/CreateMoaModal';

type Location = {
  id: number;
  location_name: string;
};

type JVUser = {
  id: number;
  email: string;
  company_name: string;
  first_name: string;
  last_name: string;
};

type Moa = {
  id: number;
  moa_name: string;
  jv_user: JVUser;
  locations: Location[];
};

export default function ExpenseMoasPage() {
  const [open, setOpen] = useState(false);

  const { data: moas } = useQuery<Moa[]>({
    queryKey: ['expense-moas'],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/moa`);

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
    {
      header: 'JV User',
      render: (row) =>
        row.jv_user.first_name + ' ' + row.jv_user.last_name + ` (${row.jv_user.company_name})`,
    },
    {
      header: 'Locations',
      render: (row) =>
        row.locations.length ? row.locations.map((l) => l.location_name).join(', ') : '—',
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Expense MOAs</Typography>

        <Button variant="contained" onClick={() => setOpen(true)}>
          Create MOA
        </Button>
      </Box>

      <DataTable rows={moas ?? []} columns={columns} getRowKey={(row) => row.id} />

      <CreateMoaModal open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}
