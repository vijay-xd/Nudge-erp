import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Search,
  LogOut,
  Settings,
  User as UserIcon,
  Menu,
  Plus,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export interface TopBarProps {
  onToggleMobileSidebar?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function TopBar({ onToggleMobileSidebar, onToggleSidebar, isSidebarCollapsed }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Operator';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        {/* Desktop Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Expand sidebar menu" : "Collapse sidebar menu"}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Mobile Sidebar Toggle Button */}
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Warm Greeting (Interoly style: ☀️ Hello, {Name}!) */}
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span role="img" aria-label="sun" className="text-base">☀️</span>
            <span>Hello, {firstName}!</span>
          </h1>
          <p className="text-[11px] text-slate-400">Sharma FMCG Distribution Network</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Quick Search (Pill shaped with ⌘ K shortcut badge) */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-72 lg:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anything... (PO, SKU, Invoice)"
            className="h-9 w-full rounded-full border border-slate-200 bg-slate-50/80 pl-9 pr-14 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#fd3706] focus:outline-none focus:ring-1 focus:ring-[#fd3706] transition-all"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ⌘ K
          </kbd>
        </form>

        {/* Currency / Region pill (Retail Inventory style) */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
          <span className="text-xs">🇮🇳</span>
          <span>INR (₹)</span>
        </div>

        {/* AI Copilot Quick Jump Button */}
        <button
          type="button"
          onClick={() => navigate('/ai-search')}
          className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          title="Open AI Copilot & Company Intelligence"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Primary Action Button (DoorDash / Archivo style: + Add New) */}
        <button
          type="button"
          onClick={() => navigate('/sales-orders')}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#fd3706] text-white text-xs font-semibold shadow-sm shadow-[#fd3706]/20 hover:bg-[#e03004] transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>New Order</span>
        </button>

        {/* Notifications Bell with badge */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#fd3706] text-[9px] font-bold text-white border-2 border-white">
            2
          </span>
        </button>

        <div className="h-5 w-px bg-slate-200" />

        {/* User Menu Dropdown */}
        {user ? (
          <DropdownMenu
            trigger={
              <button className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
                <Avatar name={user.name} size="sm" className="bg-[#fd3706] text-white font-bold text-xs" />
              </button>
            }
          >
            <DropdownMenuLabel>
              <div className="font-semibold text-slate-900">{user.name}</div>
              <div className="text-[11px] font-normal text-slate-500 truncate">{user.email}</div>
              <div className="mt-1 inline-block px-1.5 py-0.2 rounded text-[10px] bg-[#fd3706]/10 text-[#fd3706] font-mono font-bold">
                {user.role}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <UserIcon className="mr-2 h-3.5 w-3.5" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-3.5 w-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.open('http://localhost:3000/api/docs', '_blank')}
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              API Docs
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={handleLogout}>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-xs font-semibold text-[#fd3706] hover:underline"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
