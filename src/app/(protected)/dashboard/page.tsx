'use client';

import { LayoutDashboard } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { cn } from '@/lib/utils';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="The dashboard is currently under development. Analytics, summaries, report widgets, and performance insights will be available here soon."
        icon={LayoutDashboard}
        actions={
          <div className="min-w-[220px] rounded-2xl border border-dashed border-border bg-background/70 p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">Module Status</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">In Progress</p>
            <p className="mt-2 text-xs text-muted-foreground">Preparing dashboard tools</p>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-4 h-8 w-28" />
            <SkeletonBlock className="mt-3 h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SkeletonBlock className="h-4 w-36" />
              <SkeletonBlock className="mt-2 h-3 w-48" />
            </div>
            <SkeletonBlock className="h-8 w-24 rounded-xl" />
          </div>
          <SkeletonBlock className="mt-6 h-64 w-full rounded-xl" />
          <div className="mt-4 flex flex-wrap gap-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="mt-2 h-3 w-44" />
            </div>
            <SkeletonBlock className="h-8 w-20 rounded-xl" />
          </div>
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <SkeletonBlock className="size-10 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-3 w-3/4" />
                  <SkeletonBlock className="h-3 w-1/2" />
                </div>
                <SkeletonBlock className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SkeletonBlock className="h-4 w-44" />
            <SkeletonBlock className="mt-2 h-3 w-56" />
          </div>
          <SkeletonBlock className="h-9 w-28 rounded-xl" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-border bg-background/60 p-3 sm:grid-cols-[1fr_9rem_7rem] sm:items-center">
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-3/4" />
                <SkeletonBlock className="h-3 w-1/2" />
              </div>
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-7 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
