import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({ trigger, children, align = 'right', className }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[12rem] rounded-md border border-slate-200 bg-white p-1 text-slate-800 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            className
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  className,
  children,
  onClick,
  destructive = false,
  disabled = false,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-1.5 text-xs font-medium outline-none transition-colors text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-50 text-left',
        destructive && 'text-red-600 hover:bg-red-50 hover:text-red-700',
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1 my-1 h-px bg-slate-100', className)} />;
}

export function DropdownMenuLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider', className)}>
      {children}
    </div>
  );
}
