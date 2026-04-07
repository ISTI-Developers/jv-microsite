'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable, { Column } from '../components/DataTable';
import { apiFetch } from '@/lib/api';
import MoaModal from '../components/CreateMoaModal';
import { useRouter } from 'next/navigation';
import { Moa } from '../../types/moa';
import { Button } from '@/components/ui/button';

export default function ExpenseMoasPage() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedMoa, setSelectedMoa] = useState<Moa | null>(null);

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
      header: 'JV Users',
      render: (row) =>
        row.jv_users.length ? row.jv_users.map((u) => `${u.first_name} ${u.last_name} (${u.company_name}) - ${u.share_percentage}%`).join(', ') : '—',
    },
    {
      header: 'Locations',
      render: (row) => (row.locations.length ? row.locations.map((l) => l.location_name).join(', ') : '—'),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/jv/expense-moas/${row.id}`);
            }}
          >
            View
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMoa(row);
              setEditOpen(true);
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Expense MOAs</h1>

        <Button
          onClick={() => {
            setSelectedMoa(null);
            setOpen(true);
          }}
        >
          Create MOA
        </Button>
      </div>

      <DataTable rows={moas ?? []} columns={columns} getRowKey={(row) => row.id} onRowClick={(row) => router.push(`/jv/expense-moas/${row.id}`)} />

      <MoaModal key="create" open={open} onClose={() => setOpen(false)} />

      <MoaModal key={selectedMoa?.id ?? 'edit'} open={editOpen} onClose={() => setEditOpen(false)} editData={selectedMoa} />
    </div>
  );
}
