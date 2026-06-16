'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';

import MoaForm from '../../components/MoaForm';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { Moa, MoaData } from '@/app/types/moa';
import PageHeader from '../../../components/PageHeader';

export default function EditExpenseMoaPage() {
  const router = useRouter();
  const { moaId } = useParams<{ moaId: string }>();

  const detailPath = moaId ? `/expense-moas/${moaId}` : '/expense-moas';

  const { data, isLoading, error } = useQuery<MoaData>({
    queryKey: ['admin-moa-detail', moaId],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/moa/show?moa_id=${moaId}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed');

      return json;
    },
    enabled: !!moaId,
  });

  const goToDetail = () => {
    router.push(detailPath);
  };

  if (isLoading) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">Loading MOA...</div>;
  }

  if (error instanceof Error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error.message}</div>;
  }

  if (!data) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">No MOA data found.</div>;
  }

  const editData: Moa = {
    ...data.moa,
    locations: data.locations,
    created_at: data.moa.created_at ?? '',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit MOA"
        subtitle={`Update ${data.moa.moa_name}.`}
        icon={FileText}
        actions={
          <Button variant="outline" onClick={goToDetail}>
            Back
          </Button>
        }
      />

      <MoaForm mode="edit" editData={editData} onCancel={goToDetail} onSuccess={goToDetail} layout="page" />
    </div>
  );
}
