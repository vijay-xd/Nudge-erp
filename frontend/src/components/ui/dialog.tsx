import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-lg">{children}</div>
    </div>,
    document.body
  );
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  showClose?: boolean;
}

export function DialogContent({
  className,
  children,
  onClose,
  showClose = true,
  ...props
}: DialogContentProps) {
  return (
    <div
      className={cn(
        'w-full rounded-xl bg-white p-6 shadow-xl border border-slate-200 transition-all focus:outline-none',
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {showClose && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-lg font-semibold leading-none tracking-tight text-slate-900', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-slate-500 mt-1', className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 mt-6 pt-4 border-t border-slate-100',
        className
      )}
      {...props}
    />
  );
}
