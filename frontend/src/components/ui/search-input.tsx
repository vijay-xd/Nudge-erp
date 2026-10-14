import * as React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  debounceMs?: number;
  isLoading?: boolean;
}

export function SearchInput({
  value: initialValue = '',
  onSearch,
  onChange,
  debounceMs = 300,
  isLoading = false,
  placeholder = 'Search...',
  className,
  ...props
}: SearchInputProps) {
  const [internalValue, setInternalValue] = React.useState(initialValue);

  // Sync internal value if external value changes
  React.useEffect(() => {
    setInternalValue(initialValue);
  }, [initialValue]);

  // Debounce the search callback
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== initialValue) {
        if (onSearch) onSearch(internalValue);
        if (onChange) onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onSearch, onChange, initialValue]);

  const handleClear = () => {
    setInternalValue('');
    if (onSearch) onSearch('');
    if (onChange) onChange('');
  };

  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <Search className="h-4 w-4" />}
      </div>
      <input
        type="text"
        value={internalValue}
        onChange={(e) => {
          setInternalValue(e.target.value);
          if (onChange) onChange(e.target.value);
        }}
        placeholder={placeholder}
        className="flex h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-8 py-1 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent"
        {...props}
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
