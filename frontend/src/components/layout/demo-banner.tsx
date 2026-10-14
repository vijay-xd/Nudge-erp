import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types/auth';
import {
  Sparkles,
  Shield,
  ChevronDown,
  Check,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Boxes,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DemoBanner() {
  const { user, switchDemoRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roles: { value: UserRole; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'ORG_ADMIN', label: 'Admin (All Access)', desc: 'Full control across all modules & settings', icon: ShieldCheck },
    { value: 'SALES', label: 'Sales Rep', desc: 'Manage orders, customers, and dispatches', icon: ShoppingCart },
    { value: 'PROCUREMENT', label: 'Procurement Officer', desc: 'Issue POs, manage vendors & intake', icon: Truck },
    { value: 'WAREHOUSE', label: 'Warehouse Manager', desc: 'Inventory batches, locations, and shipments', icon: Boxes },
    { value: 'FINANCE', label: 'Finance Lead', desc: 'Invoices, collections, and GST tracking', icon: DollarSign },
    { value: 'ANALYST', label: 'Business Analyst', desc: 'View analytics, fill rates, and trends', icon: BarChart3 },
  ];

  const currentRole = roles.find((r) => r.value === (user?.role || 'ORG_ADMIN')) || roles[0];
  const CurrentIcon = currentRole.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectRole = (roleValue: UserRole) => {
    switchDemoRole(roleValue);
    setIsOpen(false);
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 text-slate-950 px-4 py-1.5 text-xs font-medium flex items-center justify-between border-b border-amber-600/30 select-none relative z-50">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-slate-950 shrink-0" />
        <span className="truncate">
          <strong>DEMO MODE ACTIVE:</strong> Exploring simulated tenant{' '}
          <span className="font-semibold underline decoration-slate-950/40">
            {user?.organizationName || 'Sharma FMCG Distributors'}
          </span>
        </span>
      </div>

      <div className="relative flex items-center gap-2" ref={dropdownRef}>
        <span className="hidden sm:flex items-center gap-1 text-slate-950/90 font-semibold text-[11px]">
          <Shield className="h-3 w-3" /> Test Role:
        </span>

        {/* Custom Role Selector Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs',
            'bg-slate-950 text-white hover:bg-slate-900 border border-slate-800'
          )}
          aria-label="Switch active demo role"
        >
          <CurrentIcon className="h-3.5 w-3.5 text-amber-400" />
          <span>{currentRole.label}</span>
          <ChevronDown
            className={cn('h-3 w-3 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </button>

        {/* Floating Custom Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-2xl ring-1 ring-black/10 animate-in fade-in zoom-in-95 duration-100 z-50">
            <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Operational Persona
              </span>
            </div>

            <div className="space-y-0.5">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = r.value === (user?.role || 'ORG_ADMIN');

                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => handleSelectRole(r.value)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left group cursor-pointer',
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900'
                    )}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="truncate text-xs">{r.label}</div>
                        <div className="truncate text-[10px] text-slate-400 font-normal">
                          {r.desc}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
