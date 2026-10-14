import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-blue-700 text-white hover:bg-blue-800 shadow-sm active:bg-blue-900',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:bg-red-800',
        outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 active:bg-slate-100',
        secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300',
        ghost: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900',
        link: 'text-blue-700 underline-offset-4 hover:underline p-0 h-auto',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6 text-base',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
