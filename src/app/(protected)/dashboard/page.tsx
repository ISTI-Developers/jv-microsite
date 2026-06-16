'use client';

import { LayoutDashboard } from 'lucide-react';
import PageHeader from '../components/PageHeader';

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
    </div>
  );
}
