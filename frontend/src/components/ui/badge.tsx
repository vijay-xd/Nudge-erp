import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-blue-100 text-blue-800 border border-blue-200',
        secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
        destructive: 'bg-red-100 text-red-800 border border-red-200',
        outline: 'text-slate-700 border border-slate-300 bg-transparent',
        success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        warning: 'bg-amber-100 text-amber-800 border border-amber-200',
        info: 'bg-sky-100 text-sky-800 border border-sky-200',
        neutral: 'bg-slate-50 text-slate-600 border border-slate-200',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.2',
        default: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  const dotColor = {
    default: 'bg-blue-500',
    secondary: 'bg-slate-500',
    destructive: 'bg-red-500',
    outline: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
  }[variant || 'default'];

  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', dotColor)} />}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
