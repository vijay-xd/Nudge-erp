import * as React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  period?: string;
  icon?: React.ReactNode;
  description?: string;
  subtitle?: string;
  variant?: 'default' | 'dark' | 'accent' | 'dotMatrix';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  sparkline?: boolean;
  dotMatrix?: {
    color?: 'teal' | 'blue' | 'yellow' | 'red' | 'emerald';
  };
  ratioSegment?: {
    leftLabel: string;
    leftPercent: number;
    rightLabel: string;
    rightPercent: number;
  };
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  period,
  icon,
  description,
  subtitle,
  variant = 'default',
  trend,
  sparkline,
  dotMatrix,
  ratioSegment,
  onClick,
  className,
}: StatCardProps) {
  const isPositive = change !== undefined ? change > 0 : trend?.isPositive;
  const isNegative = change !== undefined ? change < 0 : trend?.isPositive === false;

  // 1. Dark Card Variant (Retail Inventory style: #1E1F25 with wave sparkline)
  if (variant === 'dark') {
    return (
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={cn(
          'relative overflow-hidden rounded-2xl bg-[#1a1b22] p-5 text-white shadow-sm border border-white/5 transition-all duration-200 group',
          onClick ? 'cursor-pointer hover:border-white/25 hover:shadow-lg hover:-translate-y-0.5' : 'hover:border-white/15',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-300 tracking-wide">{title}</p>
          {icon ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
              {icon}
            </div>
          ) : (
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
          {(change !== undefined || trend) && (
            <span
              className={cn(
                'inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full',
                isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              )}
            >
              {isPositive ? '↗' : '↘'} {change !== undefined ? `${change}%` : trend?.value}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-1 text-[11px] text-slate-400 truncate">{description}</p>
        )}

        {/* Decorative Wave Sparkline SVG */}
        <div className="mt-3 h-10 w-full overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 200 40" fill="none" preserveAspectRatio="none">
            <path
              d="M0,25 C40,35 60,10 100,20 C140,30 160,5 200,15"
              stroke="#fd3706"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="160" cy="5" r="3.5" fill="#ffffff" />
            <line x1="160" y1="5" x2="160" y2="40" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" />
          </svg>
        </div>

        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Week 1</span>
          <span>Week 2</span>
          <span>Week 3</span>
          <span>Week 4</span>
        </div>
      </div>
    );
  }

  // 2. Vivid Accent Card Variant (Retail Inventory style: #FD3706 with ratio segment)
  if (variant === 'accent') {
    return (
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={cn(
          'relative overflow-hidden rounded-2xl bg-[#fd3706] p-5 text-white shadow-md shadow-[#fd3706]/20 transition-all duration-200 group',
          onClick ? 'cursor-pointer hover:shadow-xl hover:shadow-[#fd3706]/30 hover:-translate-y-0.5' : 'hover:shadow-lg',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-white/90 tracking-wide">{title}</p>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/15 text-white">
            {icon || <span className="h-2 w-2 rounded-full bg-white"></span>}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
          {(change !== undefined || trend) && (
            <span className="inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white/20 text-white">
              ↗ {change !== undefined ? `+${change}%` : trend?.value}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-1 text-[11px] text-white/80 truncate">{description}</p>
        )}

        {/* Ratio Split Bar (Retail Inventory style) */}
        {ratioSegment ? (
          <div className="mt-4 pt-1">
            <div className="flex h-6 w-full overflow-hidden rounded-lg bg-black/20 p-0.5">
              <div
                style={{ width: `${ratioSegment.leftPercent}%` }}
                className="h-full rounded-md bg-white text-[10px] font-bold text-[#fd3706] flex items-center justify-center transition-all"
              >
                {ratioSegment.leftPercent}%
              </div>
              <div
                style={{ width: `${ratioSegment.rightPercent}%` }}
                className="h-full rounded-md bg-[#1a1b22] text-[10px] font-bold text-white flex items-center justify-center transition-all ml-0.5"
              >
                {ratioSegment.rightPercent}%
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/90 font-medium">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                {ratioSegment.leftLabel}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1a1b22]"></span>
                {ratioSegment.rightLabel}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-xs text-white/80">
            <span>{subtitle || period || 'Consolidated channel summary'}</span>
          </div>
        )}
      </div>
    );
  }

  // 3. Dot Matrix Card Variant (Interoly style: dot matrix graph)
  if (variant === 'dotMatrix' || dotMatrix) {
    const colorMap = {
      teal: {
        bg: 'bg-emerald-50/70',
        dot: 'bg-emerald-500',
        dotInactive: 'bg-emerald-100',
        badge: 'text-emerald-700 bg-emerald-50 border-emerald-200/60',
      },
      blue: {
        bg: 'bg-blue-50/70',
        dot: 'bg-blue-500',
        dotInactive: 'bg-blue-100',
        badge: 'text-blue-700 bg-blue-50 border-blue-200/60',
      },
      yellow: {
        bg: 'bg-amber-50/70',
        dot: 'bg-amber-500',
        dotInactive: 'bg-amber-100',
        badge: 'text-amber-700 bg-amber-50 border-amber-200/60',
      },
      red: {
        bg: 'bg-rose-50/70',
        dot: 'bg-rose-500',
        dotInactive: 'bg-rose-100',
        badge: 'text-rose-700 bg-rose-50 border-rose-200/60',
      },
      emerald: {
        bg: 'bg-teal-50/70',
        dot: 'bg-teal-500',
        dotInactive: 'bg-teal-100',
        badge: 'text-teal-700 bg-teal-50 border-teal-200/60',
      },
    };

    const scheme = colorMap[dotMatrix?.color || 'teal'];

    return (
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={cn(
          'relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 group',
          onClick ? 'cursor-pointer hover:border-slate-400 hover:shadow-lg hover:-translate-y-0.5' : 'hover:border-slate-300',
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 tracking-wide">{title}</p>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
            {(change !== undefined || trend) && (
              <div className="mt-1 flex items-center text-[11px] font-semibold">
                <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full border', scheme.badge)}>
                  {isPositive ? '↗' : '↘'} {change !== undefined ? `${change}%` : trend?.value}
                </span>
                <span className="ml-1.5 text-slate-400 font-normal">{period || 'last week'}</span>
              </div>
            )}
          </div>

          {/* Dot Matrix Display */}
          <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-slate-50/80 border border-slate-100">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  i < 8 ? scheme.dot : scheme.dotInactive
                )}
              />
            ))}
          </div>
        </div>

        {description && (
          <p className="mt-2 text-[11px] text-slate-400 truncate border-t border-slate-100 pt-2">
            {description}
          </p>
        )}
      </div>
    );
  }

  // 4. Standard Clean Card Variant (with modern high-end styling)
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 group',
        onClick ? 'cursor-pointer hover:border-slate-400 hover:shadow-lg hover:-translate-y-0.5' : 'hover:border-slate-300 hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 tracking-wide uppercase">{title}</p>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-700 border border-slate-200/60">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
      </div>

      {(change !== undefined || trend || description) && (
        <div className="mt-2 flex items-center text-xs">
          {(change !== undefined || trend) && (
            <span
              className={cn(
                'inline-flex items-center font-semibold mr-1.5 px-1.5 py-0.5 rounded-full text-[11px]',
                isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              )}
            >
              {isPositive ? <TrendingUp className="mr-0.5 h-3 w-3" /> : <TrendingDown className="mr-0.5 h-3 w-3" />}
              {change !== undefined ? `${change > 0 ? `+${change}%` : `${change}%`}` : trend?.value}
            </span>
          )}
          <span className="text-slate-400 text-[11px]">{period || description}</span>
        </div>
      )}
    </div>
  );
}
