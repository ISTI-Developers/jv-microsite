'use client';

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  icon: LucideIcon;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, icon: Icon, actions, children, className }: PageHeaderProps) {
  return (
    <div className={cn('rounded-3xl border border-border bg-card p-4 shadow-sm', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
