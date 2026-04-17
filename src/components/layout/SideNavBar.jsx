import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function SideNavBar() {
  const { userRole, logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed right-0 top-0 border-l border-outline-variant/15 bg-background dark:bg-slate-950 text-primary dark:text-slate-100 font-['Tajawal'] font-medium text-md leading-relaxed z-40 p-6 text-right">
      <div className="mb-8 flex flex-col items-center w-full">
        <img src="/logo_aast.jpg" alt="AAST Logo" className="w-16 h-16 rounded-full mb-3 object-cover shadow-sm" onError={(e) => e.target.style.display='none'} />
        <div className="text-xl font-black text-primary dark:text-white mb-1">البوابة الأكاديمية</div>
        <div className="text-xs text-on-surface-variant font-bold bg-surface-container-highest px-3 py-1 rounded-full">
          {userRole === 'admin' ? 'مسؤول القاعات' : 
           userRole === 'branch_manager' ? 'مدير الفرع' : 
           userRole === 'secretary' ? 'سكرتير الكلية' : 'موظف / أكاديمي'}
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-2 w-full mt-4">
        
        {(userRole === 'employee' || userRole === 'secretary') && (
          <NavLink to="/dashboard" className={getNavClass} end>
            <span className="material-symbols-outlined ml-2" data-icon="dashboard">dashboard</span>
            <span>لوحة التحكم</span>
          </NavLink>
        )}

        {userRole === 'admin' && (
          <NavLink to="/admin" className={getNavClass}>
            <span className="material-symbols-outlined ml-2" data-icon="calendar_month">calendar_month</span>
            <span>لوحة المسؤول</span>
          </NavLink>
        )}

        {userRole === 'branch_manager' && (
          <NavLink to="/branch_manager" className={getNavClass}>
            <span className="material-symbols-outlined ml-2" data-icon="approval">approval</span>
            <span>طلبات الفروع</span>
          </NavLink>
        )}

        <NavLink to="/booking" className={getNavClass}>
          <span className="material-symbols-outlined ml-2" data-icon="event_available">event_available</span>
          <span>حجز قاعة</span>
        </NavLink>
        
        {/* Dummy links for visual completeness */}
        {userRole === 'admin' && (
          <>
            <div className="flex items-center gap-3 text-on-surface dark:text-slate-400 px-4 py-3 hover:bg-surface-container-highest dark:hover:bg-slate-800 rounded-xl transition-colors hover:translate-x-[-4px] transition-transform duration-200 cursor-not-allowed opacity-50">
              <span className="material-symbols-outlined ml-2" data-icon="meeting_room">meeting_room</span>
              <span>إدارة القاعات</span>
            </div>
            <div className="flex items-center gap-3 text-on-surface dark:text-slate-400 px-4 py-3 hover:bg-surface-container-highest dark:hover:bg-slate-800 rounded-xl transition-colors hover:translate-x-[-4px] transition-transform duration-200 cursor-not-allowed opacity-50">
              <span className="material-symbols-outlined ml-2" data-icon="settings">settings</span>
              <span>الإعدادات</span>
            </div>
          </>
        )}
      </nav>
      <div className="mt-auto pt-6 flex flex-col gap-2">
        {(userRole === 'employee' || userRole === 'secretary') && (
          <NavLink to="/booking" className="w-full py-3 px-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_12px_32px_-12px_rgba(0,30,64,0.3)]">
            <span className="material-symbols-outlined">add</span>
            طلب حجز جديد
          </NavLink>
        )}
        <button onClick={handleLogout} className="w-full py-3 px-4 rounded-xl text-error font-headline font-bold flex items-center justify-center gap-2 hover:bg-error-container/50 transition-colors">
          <span className="material-symbols-outlined">logout</span>
          تسجيل خروج
        </button>
      </div>
    </aside>
  );
}
