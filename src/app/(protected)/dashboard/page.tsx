'use client';

import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-background via-card to-muted/40 p-8 shadow-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Coming soon
            </div>

            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
              <LayoutDashboard className="h-7 w-7 text-muted-foreground" />
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The dashboard is currently under development. Analytics, summaries, report widgets, and performance insights will be available here
              soon.
            </p>
          </div>

          <div className="min-w-[220px] rounded-3xl border border-dashed border-border bg-background/70 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">Module Status</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">In Progress</p>
            <p className="mt-2 text-xs text-muted-foreground">Preparing dashboard tools</p>
          </div>
        </div>
      </div>
    </div>
  );
}
