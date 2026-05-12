'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import LocationCard from './components/LocationCard';
import ExpenseSummaryCard from './components/ExpenseSummaryCard';
import MoaHeader from './components/MoaHeader';
import EmptyState from './components/EmptyState';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import MoaModal from '../../components/CreateMoaModal';
import { JVUser, Location, MoaData, Moa } from '@/app/types/moa';

export default function ExpenseMoaDetailPage() {
  const { moaId } = useParams<{ moaId: string }>();
  const [editOpen, setEditOpen] = useState(false);

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

  if (isLoading) return <LoadingState />;
  if (error instanceof Error) return <ErrorState message={error.message} />;
  if (!data) return <ErrorState message="No data found." />;

  const totalLocations = data.locations.length;

  const totalJV = Array.from(
    new Map(data.locations.flatMap((loc: Location) => (loc.jv_users ?? []).map((u: JVUser) => [u.id, u] as const))).values()
  ).length;

  const editData: Moa = {
    ...data.moa,
    locations: data.locations,
    created_at: data.moa.created_at ?? '',
  };

  return (
    <div className="space-y-6">
      <MoaHeader title={data.moa.moa_name} onEdit={() => setEditOpen(true)} />

      <ExpenseSummaryCard totalLocations={totalLocations} totalJV={totalJV} />

      {totalLocations === 0 ? (
        <EmptyState title="No Locations" description="This MOA has no locations yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.locations.map((loc: Location) => (
            <LocationCard key={loc.id} location={loc} />
          ))}
        </div>
      )}

      <MoaModal key={editData.id} open={editOpen} onClose={() => setEditOpen(false)} editData={editData} />
    </div>
  );
}
