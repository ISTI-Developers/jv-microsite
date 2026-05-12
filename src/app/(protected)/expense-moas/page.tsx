'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '../components/DataTable';
import { apiFetch } from '@/lib/api';
import MoaModal from '../components/CreateMoaModal';
import { Location, Moa, JVUser } from '../../types/moa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

function getUniqueJvUsers(locations: Location[]): JVUser[] {
  const map = new Map<number, JVUser>();

  locations.forEach((loc) => {
    loc.jv_users.forEach((user) => {
      if (!map.has(user.id)) {
        map.set(user.id, user);
      }
    });
  });

  return Array.from(map.values());
}

type MoaListResponse = {
  data: Moa[];
  error?: string;
};

export default function ExpenseMoasPage() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedMoa, setSelectedMoa] = useState<Moa | null>(null);

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

  const columns: Column<Moa>[] = [
    {
      header: 'MOA',
      render: (row) => <span className="font-medium">{row.moa_name}</span>,
    },
    {
      header: 'Locations',
      render: (row) => <Badge variant="secondary">{row.locations.length}</Badge>,
    },
    {
      header: 'JV Partners',
      render: (row) => {
        const uniqueUsers = getUniqueJvUsers(row.locations);
        return <Badge variant="secondary">{uniqueUsers.length}</Badge>;
      },
    },
    {
      header: 'Creation Date',
      render: (row) => row.created_at,
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
              router.push(`/expense-moas/${row.id}`);
            }}
          >
            View
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/jv/expense-moas/${row.id}`);
            }}
          >
            Expenses
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
      <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Expense MOAs</h1>
            <p className="text-sm text-muted-foreground">Manage expense MOAs and assigned locations</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedMoa(null);
              setOpen(true);
            }}
          >
            Create MOA
          </Button>
        </div>
      </div>
      <DataTable rows={moas ?? []} columns={columns} getRowKey={(row) => row.id} onRowClick={(row) => router.push(`/expense-moas/${row.id}`)} />

      <MoaModal key="create" open={open} onClose={() => setOpen(false)} />

      <MoaModal key={selectedMoa?.id ?? 'edit'} open={editOpen} onClose={() => setEditOpen(false)} editData={selectedMoa} />
    </div>
  );
}
