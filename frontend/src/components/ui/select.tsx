import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, children, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-xs">
          <select
            id={selectId}
            className={cn(
              'flex h-9 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-1 pr-8 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
              error && 'border-red-500 focus-visible:ring-red-500',
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
