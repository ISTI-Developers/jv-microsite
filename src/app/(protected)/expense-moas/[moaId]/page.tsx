'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FileText, History } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import LocationCard from './components/LocationCard';
import ExpenseSummaryCard from './components/ExpenseSummaryCard';
import EmptyState from './components/EmptyState';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import MoaActivityLogs from './components/MoaActivityLogs';
import AppModal from '../../components/AppModal';
import PageHeader from '../../components/PageHeader';
import { Button } from '@/components/ui/button';
import { JVUser, Location, MoaData } from '@/app/types/moa';

export default function ExpenseMoaDetailPage() {
  const { moaId } = useParams<{ moaId: string }>();
  const router = useRouter();
  const [activityLogsModalOpen, setActivityLogsModalOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.moa.moa_name}
        subtitle="MOA Details"
        icon={FileText}
        actions={
          <>
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button variant="outline" onClick={() => setActivityLogsModalOpen(true)}>
              <History className="size-4" />
              MOA Activity Logs
            </Button>
            <Button onClick={() => router.push(`/expense-moas/${moaId}/edit`)}>Edit MOA</Button>
          </>
        }
      />

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

      <AppModal
        open={activityLogsModalOpen}
        onClose={() => setActivityLogsModalOpen(false)}
        title="MOA Activity Logs"
        description="Review audit and transaction activity for this MOA."
        maxWidth="full"
      >
        {activityLogsModalOpen && <MoaActivityLogs moaId={moaId} />}
      </AppModal>
    </div>
  );
}
