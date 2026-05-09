import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import SideNavBar from './SideNavBar';
import NotificationBell from './NotificationBell';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-background text-on-background min-h-screen rtl relative" dir="rtl">
      <NotificationBell />
      <TopNavBar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <div className="flex min-h-screen pt-20 md:pt-0">
        <SideNavBar isOpen={isMobileMenuOpen} closeMenu={() => setIsMobileMenuOpen(false)} />
        <main className="flex-1 md:mr-64 p-4 md:p-6 lg:p-12 w-full max-w-[1400px] mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
