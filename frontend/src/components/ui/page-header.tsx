import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  badge,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="space-y-1">
        {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
}
