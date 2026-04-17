import { NavLink, Link } from 'react-router-dom';

export default function SideNavBar() {
  const getNavClass = ({ isActive }) =>
    isActive
      ? "flex flex-row-reverse items-center gap-3 bg-gradient-to-l from-primary to-primary-container text-white rounded-xl px-4 py-3 shadow-lg hover:translate-x-[-4px] transition-transform duration-200"
      : "flex flex-row-reverse items-center gap-3 text-on-surface dark:text-slate-400 px-4 py-3 hover:bg-surface-container-highest dark:hover:bg-slate-800 rounded-xl transition-colors hover:translate-x-[-4px] transition-transform duration-200";

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed right-0 top-0 border-l border-outline-variant/15 bg-background dark:bg-slate-950 text-primary dark:text-slate-100 font-['Tajawal'] font-medium text-md leading-relaxed z-40 p-6 text-right">
      <div className="mb-8 flex flex-col items-start w-full">
        <div className="text-2xl font-black text-primary dark:text-white mb-2">البوابة الأكاديمية</div>
        <div className="text-sm text-on-surface-variant">نظام حجز القاعات</div>
      </div>
      <nav className="flex-1 flex flex-col gap-2 w-full mt-4">
        <NavLink to="/dashboard" className={getNavClass} end>
          <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
          <span>لوحة التحكم (User)</span>
        </NavLink>
        <NavLink to="/admin" className={getNavClass}>
          <span className="material-symbols-outlined" data-icon="calendar_month">calendar_month</span>
          <span>الجدول الأسبوعي (Admin)</span>
        </NavLink>
        <NavLink to="/booking" className={getNavClass}>
          <span className="material-symbols-outlined" data-icon="event_available">event_available</span>
          <span>حجز قاعة</span>
        </NavLink>
        {/* Dummy links for visual completeness */}
        <div className="flex flex-row-reverse items-center gap-3 text-on-surface dark:text-slate-400 px-4 py-3 hover:bg-surface-container-highest dark:hover:bg-slate-800 rounded-xl transition-colors hover:translate-x-[-4px] transition-transform duration-200 cursor-not-allowed opacity-50">
          <span className="material-symbols-outlined" data-icon="meeting_room">meeting_room</span>
          <span>القاعات</span>
        </div>
        <div className="flex flex-row-reverse items-center gap-3 text-on-surface dark:text-slate-400 px-4 py-3 hover:bg-surface-container-highest dark:hover:bg-slate-800 rounded-xl transition-colors hover:translate-x-[-4px] transition-transform duration-200 cursor-not-allowed opacity-50">
          <span className="material-symbols-outlined" data-icon="analytics">analytics</span>
          <span>التقارير</span>
        </div>
      </nav>
      <div className="mt-auto pt-6 flex flex-col gap-2">
        <Link to="/booking" className="w-full py-3 px-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_12px_32px_-12px_rgba(0,30,64,0.3)]">
          <span className="material-symbols-outlined">add</span>
          طلب حجز جديد
        </Link>
        <Link to="/login" className="w-full py-3 px-4 rounded-xl text-error font-headline font-bold flex items-center justify-center gap-2 hover:bg-error-container/50 transition-colors">
          <span className="material-symbols-outlined">logout</span>
          تسجيل خروج
        </Link>
      </div>
    </aside>
  );
}
