import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
