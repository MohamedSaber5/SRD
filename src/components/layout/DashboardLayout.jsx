import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import SideNavBar from './SideNavBar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { usePopup } from '../../contexts/PopupContext';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userRole } = useAuth();
  const { showPopup } = usePopup();
  const notifiedTempAdmin = useRef(false);
  const [isRamadanMode, setIsRamadanMode] = useState(false);

  useEffect(() => {
    if (userRole === 'temp_admin' && !notifiedTempAdmin.current) {
      // Small timeout to allow render completion
      setTimeout(() => {
         showPopup("أنت الآن تعمل بصلاحيات مدير النظام المؤقتة", "info");
      }, 500);
      notifiedTempAdmin.current = true;
    }
  }, [userRole, showPopup]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'system'), (docSnap) => {
      if (docSnap.exists()) {
        setIsRamadanMode(!!docSnap.data().isRamadanMode);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className={`bg-background text-on-background min-h-screen rtl relative transition-all duration-500 ${isRamadanMode ? 'ramadan-mode' : ''}`} dir="rtl">
      <NotificationBell />
      
      {/* Swinging Ramadan Ornaments Header Decoration */}
      {isRamadanMode && (
        <div className="absolute top-0 right-0 left-0 h-24 overflow-hidden pointer-events-none z-30 select-none hidden md:block">
           {/* Wire Path */}
           <svg className="w-full h-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
              <path d="M0,10 Q150,25 300,10 Q450,25 600,10 Q750,25 900,10 Q1050,25 1200,10" fill="none" stroke="#cda250" strokeWidth="1.5" opacity="0.6"/>
              <path d="M0,10 Q150,23 300,10 Q450,23 600,10 Q750,23 900,10 Q1050,23 1200,10" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.4"/>
           </svg>
           
           {/* Left Ornaments Group */}
           <div className="absolute left-[10%] top-[14px] w-[50px] h-[80px] lantern-sway flex flex-col items-center">
             <div className="w-[1px] h-[25px] bg-[#cda250] opacity-80"></div>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="#cda250" className="drop-shadow-[0_0_8px_rgba(205,162,80,0.8)]">
               <path d="M12,2 L14.8,8.2 L21.6,8.8 L16.4,13.2 L18,19.8 L12,16.2 L6,19.8 L7.6,13.2 L2.4,8.8 L9.2,8.2 Z" />
             </svg>
           </div>

           <div className="absolute left-[22%] top-[18px] w-[60px] h-[100px] lantern-sway-slow flex flex-col items-center">
             <div className="w-[1px] h-[30px] bg-[#cda250] opacity-80"></div>
             <svg width="32" height="48" viewBox="0 0 32 48" fill="none" className="drop-shadow-[0_0_10px_rgba(205,162,80,0.9)]">
               <path d="M16 2 L22 10 L10 10 Z" fill="#cda250" />
               <path d="M16 2 L22 10 L10 10 Z" stroke="#faf6ee" strokeWidth="0.5" />
               <path d="M8 10 L24 10 L26 30 L6 30 Z" fill="url(#lantern-glass-layout-1)" stroke="#cda250" strokeWidth="1.5" />
               <circle cx="16" cy="20" r="5" fill="#faf6ee" className="animate-pulse" />
               <path d="M6 30 L26 30 L22 36 L10 36 Z" fill="#cda250" />
               <path d="M12 36 L12 40 Q16 43 20 40 L20 36" stroke="#cda250" strokeWidth="1.5" fill="none" />
               <defs>
                 <radialGradient id="lantern-glass-layout-1" cx="50%" cy="50%" r="50%">
                   <stop offset="0%" stopColor="#faf6ee" />
                   <stop offset="30%" stopColor="#fcd34d" />
                   <stop offset="100%" stopColor="#b45309" />
                 </radialGradient>
               </defs>
             </svg>
           </div>

           <div className="absolute left-[38%] top-[14px] w-[50px] h-[80px] lantern-sway-slower flex flex-col items-center">
             <div className="w-[1px] h-[20px] bg-[#cda250] opacity-80"></div>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="#cda250" className="drop-shadow-[0_0_8px_rgba(205,162,80,0.8)]">
               <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.23 0 2.4-.22 3.48-.62a10.007 10.007 0 0 1-7.1-12.87C10.05 4.3 11.02 3.01 12 2zm1 4l1.24 2.51L17 8.89l-1.81 1.76.43 2.5L13 11.97l-2.62 1.38.5-2.91-2.11-2.05 2.92-.42L13 6z" />
             </svg>
           </div>

           {/* Right Ornaments Group */}
           <div className="absolute right-[38%] top-[14px] w-[50px] h-[80px] lantern-sway flex flex-col items-center">
             <div className="w-[1px] h-[20px] bg-[#cda250] opacity-80"></div>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="#cda250" className="drop-shadow-[0_0_8px_rgba(205,162,80,0.8)]">
               <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.23 0 2.4-.22 3.48-.62a10.007 10.007 0 0 1-7.1-12.87C10.05 4.3 11.02 3.01 12 2zm1 4l1.24 2.51L17 8.89l-1.81 1.76.43 2.5L13 11.97l-2.62 1.38.5-2.91-2.11-2.05 2.92-.42L13 6z" />
             </svg>
           </div>

           <div className="absolute right-[22%] top-[18px] w-[60px] h-[100px] lantern-sway-slow flex flex-col items-center">
             <div className="w-[1px] h-[30px] bg-[#cda250] opacity-80"></div>
             <svg width="32" height="48" viewBox="0 0 32 48" fill="none" className="drop-shadow-[0_0_10px_rgba(205,162,80,0.9)]">
               <path d="M16 2 L22 10 L10 10 Z" fill="#cda250" />
               <path d="M16 2 L22 10 L10 10 Z" stroke="#faf6ee" strokeWidth="0.5" />
               <path d="M8 10 L24 10 L26 30 L6 30 Z" fill="url(#lantern-glass-layout-2)" stroke="#cda250" strokeWidth="1.5" />
               <circle cx="16" cy="20" r="5" fill="#faf6ee" className="animate-pulse" />
               <path d="M6 30 L26 30 L22 36 L10 36 Z" fill="#cda250" />
               <path d="M12 36 L12 40 Q16 43 20 40 L20 36" stroke="#cda250" strokeWidth="1.5" fill="none" />
               <defs>
                 <radialGradient id="lantern-glass-layout-2" cx="50%" cy="50%" r="50%">
                   <stop offset="0%" stopColor="#faf6ee" />
                   <stop offset="30%" stopColor="#fcd34d" />
                   <stop offset="100%" stopColor="#b45309" />
                 </radialGradient>
               </defs>
             </svg>
           </div>

           <div className="absolute right-[10%] top-[14px] w-[50px] h-[80px] lantern-sway-slower flex flex-col items-center">
             <div className="w-[1px] h-[25px] bg-[#cda250] opacity-80"></div>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="#cda250" className="drop-shadow-[0_0_8px_rgba(205,162,80,0.8)]">
               <path d="M12,2 L14.8,8.2 L21.6,8.8 L16.4,13.2 L18,19.8 L12,16.2 L6,19.8 L7.6,13.2 L2.4,8.8 L9.2,8.2 Z" />
             </svg>
           </div>
        </div>
      )}

      <TopNavBar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <div className="flex min-h-screen pt-20 md:pt-0">
        <SideNavBar isOpen={isMobileMenuOpen} closeMenu={() => setIsMobileMenuOpen(false)} />
        <main className="flex-1 md:mr-64 p-4 md:p-6 lg:p-12 w-full max-w-[1400px] mx-auto overflow-x-hidden relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
