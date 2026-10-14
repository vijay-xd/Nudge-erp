import * as React from 'react';
import { cn, getInitials } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: 'sm' | 'default' | 'lg' | 'xl';
}

export function Avatar({ name, src, size = 'default', className, ...props }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    default: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
    xl: 'h-14 w-14 text-lg',
  }[size];

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full overflow-hidden font-medium select-none bg-slate-200 text-slate-700 border border-slate-300',
        sizeClasses,
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
