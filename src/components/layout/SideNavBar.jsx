import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function SideNavBar({ isOpen, closeMenu }) {
  const { t } = useTranslation();
  const { userRole, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [isRamadanMode, setIsRamadanMode] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setIsRamadanMode(!!docSnap.data().ramadanMode);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getNavClass = ({ isActive }) =>
    isActive
      ? "flex items-center gap-3 bg-gradient-to-l from-primary to-primary-container text-white rounded-xl px-4 py-3 shadow-lg hover:translate-x-[-4px] transition-transform duration-200"
      : "flex items-center gap-3 text-on-surface dark:text-slate-400 px-4 py-3 hover:bg-surface-container-highest dark:hover:bg-slate-800 rounded-xl transition-colors hover:translate-x-[-4px] transition-transform duration-200";

  const hasPermission = (permission) => {
    if (userRole === 'admin') return true;
    if (userRole === 'temp_admin') {
      return userData?.permissions?.includes(permission);
    }
    return false;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMenu}
        ></div>
      )}

      <aside className={`fixed md:flex flex-col h-screen overflow-y-auto scrollbar-hide w-64 right-0 top-0 border-l border-outline-variant/15 bg-background dark:bg-slate-950 text-primary dark:text-slate-100 font-['Tajawal'] font-medium text-md leading-relaxed z-50 p-6 text-right transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-[100%] md:translate-x-0'}`}>
        {/* Mobile Close Button */}
        <button className="md:hidden absolute top-4 left-4 p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-colors" onClick={closeMenu}>
           <span className="material-symbols-outlined">close</span>
        </button>
        
        <div className="mb-8 flex flex-col items-center w-full mt-2 md:mt-0">
        <img src="/logo_aast.jpg" alt="AAST Logo" className="w-16 h-16 rounded-full mb-3 object-cover shadow-sm" onError={(e) => e.target.style.display='none'} />
        <div className="text-xl font-black text-primary dark:text-white mb-1 text-center leading-tight">{t('sidebar.title')}</div>
        <div className="text-[10px] text-on-surface-variant font-bold mb-2 text-center">{t('sidebar.subtitle')}</div>
        <div className="text-xs text-on-surface-variant font-bold bg-surface-container-highest px-3 py-1 rounded-full mb-2">
          {userRole === 'admin' ? t('sidebar.roles.admin') : 
           userRole === 'temp_admin' ? t('sidebar.roles.temp_admin') :
           userRole === 'branch_manager' ? t('sidebar.roles.branch_manager') : 
           userRole === 'secretary' ? t('sidebar.roles.secretary') : t('sidebar.roles.employee')}
        </div>
        
        {isRamadanMode && (
          <div className="animate-pulse">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#fbf0dd] dark:bg-[#d4af37]/20 text-[#b58b4b] dark:text-[#d4af37] rounded-full text-[10px] font-black border border-[#b58b4b]/30">
               <span className="material-symbols-outlined text-[14px]">mosque</span>
               {t('settings.ramadanMode')}
            </div>
          </div>
        )}
      </div>
      <nav className="flex-1 flex flex-col gap-2 w-full mt-4">
        
        {(userRole === 'employee' || userRole === 'secretary') && (
          <NavLink to="/dashboard" className={getNavClass} end onClick={closeMenu}>
            <span className="material-symbols-outlined ml-2" data-icon="dashboard">dashboard</span>
            <span>{t('sidebar.dashboard')}</span>
          </NavLink>
        )}

        {(userRole === 'admin' || userRole === 'temp_admin') && (
          <NavLink to="/admin" className={getNavClass} end onClick={closeMenu}>
            <span className="material-symbols-outlined ml-2" data-icon="admin_panel_settings">admin_panel_settings</span>
            <span>{t('sidebar.admin')}</span>
          </NavLink>
        )}

        {(userRole === 'admin' || (userRole === 'temp_admin' && hasPermission('requests'))) && (
          <NavLink to="/admin/requests" className={getNavClass} onClick={closeMenu}>
            <span className="material-symbols-outlined ml-2" data-icon="pending_actions">pending_actions</span>
            <span>{t('sidebar.requests')}</span>
          </NavLink>
        )}

        {userRole === 'branch_manager' && (
          <>
            <NavLink to="/branch_manager" className={getNavClass} end onClick={closeMenu}>
              <span className="material-symbols-outlined ml-2" data-icon="domain_verification">domain_verification</span>
              <span>{t('sidebar.branchManager')}</span>
            </NavLink>
            <NavLink to="/branch_manager/logs" className={getNavClass} onClick={closeMenu}>
              <span className="material-symbols-outlined ml-2" data-icon="history_edu">history_edu</span>
              <span>{t('sidebar.logs')}</span>
            </NavLink>
          </>
        )}

        <NavLink to="/booking" className={getNavClass} onClick={closeMenu}>
          <span className="material-symbols-outlined ml-2" data-icon="add_circle">add_circle</span>
          <span>{t('sidebar.newBooking')}</span>
        </NavLink>
        
        {/* Admin Specific Links */}
        {(userRole === 'admin' || userRole === 'temp_admin') && (
          <>
            {(userRole === 'admin' || hasPermission('rooms')) && (
              <>
                <NavLink to="/admin/rooms" className={getNavClass} end onClick={closeMenu}>
                  <span className="material-symbols-outlined ml-2" data-icon="meeting_room">meeting_room</span>
                  <span>{t('sidebar.rooms')}</span>
                </NavLink>
                <NavLink to="/admin/rooms/search" className={getNavClass} onClick={closeMenu}>
                  <span className="material-symbols-outlined ml-2" data-icon="search">search</span>
                  <span>{t('sidebar.search')}</span>
                </NavLink>
              </>
            )}
            
            {userRole === 'admin' && (
              <NavLink to="/admin/delegation" className={getNavClass} onClick={closeMenu}>
                <span className="material-symbols-outlined ml-2" data-icon="manage_accounts">manage_accounts</span>
                <span>{t('sidebar.delegation')}</span>
              </NavLink>
            )}

            {(userRole === 'admin' || hasPermission('settings')) && (
              <NavLink to="/admin/settings" className={getNavClass} onClick={closeMenu}>
                <span className="material-symbols-outlined ml-2" data-icon="settings_applications">settings_applications</span>
                <span>{t('sidebar.systemSettings')}</span>
              </NavLink>
            )}
          </>
        )}

        {(userRole === 'admin' || userRole === 'branch_manager' || (userRole === 'temp_admin' && hasPermission('statistics'))) && (
          <NavLink to="/admin/statistics" className={getNavClass} onClick={closeMenu}>
            <span className="material-symbols-outlined ml-2" data-icon="query_stats">query_stats</span>
            <span>{t('sidebar.statistics')}</span>
          </NavLink>
        )}
      </nav>
      <div className="mt-auto pt-6 flex flex-col gap-2">
        <NavLink to="/settings" className={getNavClass} onClick={closeMenu}>
          <span className="material-symbols-outlined ml-2" data-icon="manage_accounts">manage_accounts</span>
          <span>{t('sidebar.personalSettings')}</span>
        </NavLink>
        {(userRole === 'employee' || userRole === 'secretary') && (
          <NavLink to="/booking" className="w-full py-3 px-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_12px_32px_-12px_rgba(0,30,64,0.3)]" onClick={closeMenu}>
            <span className="material-symbols-outlined">add</span>
            {t('sidebar.newBooking')}
          </NavLink>
        )}
        <button onClick={handleLogout} className="w-full py-3 px-4 rounded-xl text-error font-headline font-bold flex items-center justify-center gap-2 hover:bg-error-container/50 transition-colors">
          <span className="material-symbols-outlined">logout</span>
          {t('sidebar.logout')}
        </button>
      </div>
    </aside>
    </>
  );
}
