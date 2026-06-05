'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import DataTable from '../components/DataTable';
import { apiFetch } from '@/lib/api';
import MoaModal from '../components/CreateMoaModal';
import { Moa } from '../../types/moa';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { createExpenseMoaColumns } from './columns';

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

  const columns = createExpenseMoaColumns({ router, setSelectedMoa, setEditOpen });

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
