'use client';

function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`.trim()} />;
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <SkeletonBar className="h-5 w-2/5" />
      <SkeletonBar className="mt-3 h-10 w-3/5" />
      <SkeletonBar className="mt-4 h-1.5 w-full" />
    </div>
  );
}

function ChartCardSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-sm">
      <SkeletonBar className="h-5 w-1/3" />
      <div className="my-4 border-t border-border" />
      <div className="animate-pulse rounded-2xl bg-muted" style={{ height }} />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <SkeletonBar className="h-5 w-[35%]" />
      <div className="my-4 border-t border-border" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="mb-4 flex items-center justify-between gap-4">
          <SkeletonBar className="h-4 w-1/4" />
          <SkeletonBar className="h-4 w-[15%]" />
          <SkeletonBar className="h-4 w-1/5" />
        </div>
      ))}
    </div>
  );
}

export default function SitePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Site</h1>
        <p className="mt-1 text-sm text-muted-foreground">Joint Venture - Site Management</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="md:col-span-3">
            <StatCardSkeleton />
          </div>
        ))}

        <div className="md:col-span-8">
          <ChartCardSkeleton height={320} />
        </div>
        <div className="md:col-span-4">
          <ChartCardSkeleton height={320} />
        </div>

        <div className="md:col-span-6">
          <ChartCardSkeleton height={260} />
        </div>
        <div className="md:col-span-6">
          <ChartCardSkeleton height={260} />
        </div>

        <div className="md:col-span-12">
          <TableSkeleton />
        </div>
      </div>
    </div>
  );
}
