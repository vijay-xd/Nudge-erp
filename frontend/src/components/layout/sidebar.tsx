import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types/auth';
import { hasRoleAccess } from '@/components/auth/role-gate';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Boxes,
  Package,
  Truck,
  Users,
  Warehouse,
  Send,
  DollarSign,
  BarChart3,
  Mail,
  Bell,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Main',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['ORG_ADMIN', 'SALES', 'PROCUREMENT', 'WAREHOUSE', 'FINANCE', 'ANALYST', 'VIEWER'],
      },
      {
        title: 'AI Copilot & Search',
        href: '/ai-search',
        icon: Sparkles,
        roles: ['ORG_ADMIN', 'SALES', 'PROCUREMENT', 'WAREHOUSE', 'FINANCE', 'ANALYST', 'VIEWER'],
        badge: 'AI',
      },
      {
        title: 'Sales Orders',
        href: '/sales-orders',
        icon: ShoppingCart,
        roles: ['ORG_ADMIN', 'SALES'],
      },
      {
        title: 'Purchase Orders',
        href: '/purchase-orders',
        icon: FileText,
        roles: ['ORG_ADMIN', 'PROCUREMENT'],
      },
      {
        title: 'Inventory',
        href: '/inventory',
        icon: Boxes,
        roles: ['ORG_ADMIN', 'WAREHOUSE'],
      },
      {
        title: 'Fulfilment',
        href: '/fulfilment',
        icon: Send,
        roles: ['ORG_ADMIN', 'WAREHOUSE', 'SALES'],
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Products',
        href: '/products',
        icon: Package,
        roles: ['ORG_ADMIN', 'SALES', 'PROCUREMENT', 'WAREHOUSE', 'FINANCE', 'ANALYST', 'VIEWER'],
      },
      {
        title: 'Vendors',
        href: '/vendors',
        icon: Truck,
        roles: ['ORG_ADMIN', 'PROCUREMENT', 'FINANCE'],
      },
      {
        title: 'Customers',
        href: '/customers',
        icon: Users,
        roles: ['ORG_ADMIN', 'SALES', 'FINANCE'],
      },
      {
        title: 'Warehouses',
        href: '/warehouses',
        icon: Warehouse,
        roles: ['ORG_ADMIN', 'WAREHOUSE'],
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Finance & GST',
        href: '/finance',
        icon: DollarSign,
        roles: ['ORG_ADMIN', 'FINANCE'],
      },
      {
        title: 'Analytics & Trends',
        href: '/analytics',
        icon: BarChart3,
        roles: ['ORG_ADMIN', 'ANALYST', 'FINANCE'],
      },
      {
        title: 'Gmail & Intake',
        href: '/integrations',
        icon: Mail,
        roles: ['ORG_ADMIN'],
      },
      {
        title: 'Audit Log',
        href: '/audit-log',
        icon: ShieldCheck,
        roles: ['ORG_ADMIN'],
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        title: 'Notifications',
        href: '/notifications',
        icon: Bell,
        roles: ['ORG_ADMIN', 'SALES', 'PROCUREMENT', 'WAREHOUSE', 'FINANCE', 'ANALYST', 'VIEWER'],
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: ['ORG_ADMIN'],
      },
    ],
  },
];

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-[#22232b] bg-[#131419] text-slate-300 transition-all duration-200 select-none shrink-0 h-full min-h-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-3.5 border-b border-[#22232b] shrink-0">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fd3706] text-white font-black shadow-md shadow-[#fd3706]/30 text-base">
                N
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-white block">NUDGE</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-slate-300">ERP</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">FMCG Distribution</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-[#1c1d24] text-slate-400 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fd3706] text-white font-black shadow-md shadow-[#fd3706]/30 hover:scale-105 transition-all cursor-pointer"
              title="Click to expand full sidebar menu"
            >
              N
            </button>
          </div>
        )}
      </div>

      {/* Nav items list grouped by section */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-4 no-scrollbar scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) =>
            hasRoleAccess(user?.role, item.roles)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  {section.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative',
                        isActive
                          ? 'bg-[#22232c] text-white font-semibold shadow-xs border border-white/10'
                          : 'text-slate-400 hover:bg-[#1a1b22] hover:text-slate-200',
                        collapsed && 'justify-center px-0'
                      )
                    }
                    title={collapsed ? item.title : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-[#fd3706]' : 'text-slate-400 group-hover:text-slate-200')} />
                        {!collapsed && (
                          <span className="truncate flex-1">{item.title}</span>
                        )}
                        {!collapsed && isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#fd3706] shadow-[0_0_8px_#fd3706]" />
                        )}
                        {collapsed && (
                          <div className="absolute left-full ml-3 hidden rounded-lg bg-[#1a1b22] px-2.5 py-1.5 text-xs text-white shadow-xl group-hover:block z-50 whitespace-nowrap border border-white/10">
                            {item.title}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom User Profile Widget (Interoly style) */}
      <div className="p-3 border-t border-[#22232b] mt-auto shrink-0 bg-[#131419]">
        {!collapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#1a1b22] border border-white/5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar name={user?.name || 'Operator'} size="sm" className="bg-[#fd3706] text-white font-bold text-xs" />
              <div className="overflow-hidden leading-tight">
                <div className="text-xs font-semibold text-white truncate">{user?.name || 'Operations Lead'}</div>
                <div className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@nudge-demo.com'}</div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign out"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-[#1a1b22] text-slate-400 hover:bg-slate-700 hover:text-white cursor-pointer"
              title="Expand full sidebar menu"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
