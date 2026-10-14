import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  children: React.ReactNode;
  id?: string;
}

export function FormField({
  label,
  required,
  error,
  helpText,
  className,
  children,
  id,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helpText && !error && <p className="text-xs text-slate-500">{helpText}</p>}
    </div>
  );
}
