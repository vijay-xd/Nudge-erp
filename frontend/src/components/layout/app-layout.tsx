import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { DemoBanner } from '@/components/layout/demo-banner';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-900">
      {/* Demo Banner */}
      <DemoBanner />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col h-full shrink-0">
          <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative z-50 h-full">
              <Sidebar collapsed={false} onToggleCollapse={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-y-auto min-h-0">
          <TopBar
            onToggleSidebar={toggleCollapse}
            isSidebarCollapsed={collapsed}
            onToggleMobileSidebar={() => setMobileOpen((prev) => !prev)}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
