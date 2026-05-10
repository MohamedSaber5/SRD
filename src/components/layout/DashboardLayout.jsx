import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import SideNavBar from './SideNavBar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { usePopup } from '../../contexts/PopupContext';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userRole } = useAuth();
  const { showAlert } = usePopup();
  const notifiedTempAdmin = useRef(false);

  useEffect(() => {
    if (userRole === 'temp_admin' && !notifiedTempAdmin.current) {
      // Small timeout to allow render completion
      setTimeout(() => {
         showAlert("أنت الآن تعمل بصلاحيات مدير النظام المؤقتة", "info");
      }, 500);
      notifiedTempAdmin.current = true;
    }
  }, [userRole, showAlert]);

  return (
    <div className="bg-background dark:bg-slate-950 text-on-background dark:text-slate-100 min-h-screen rtl relative">
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
