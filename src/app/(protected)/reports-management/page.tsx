'use client';

import { BarChart3 } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports Management"
        subtitle="Reports management is currently under development. Expense reports, revenue analytics, and consolidated JV reporting tools will be available here soon."
        icon={BarChart3}
        actions={
          <div className="min-w-[220px] rounded-2xl border border-dashed border-border bg-background/70 p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">Module Status</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">In Progress</p>
            <p className="mt-2 text-xs text-muted-foreground">Preparing report tools</p>
          </div>
        }
      />
    </div>
  );
}
