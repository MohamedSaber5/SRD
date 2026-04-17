import { Link } from 'react-router-dom';

export default function TopNavBar() {
  return (
    <nav className="bg-[#f7f9fb]/80 dark:bg-slate-950/80 backdrop-blur-lg text-[#001e40] dark:text-slate-100 font-['Tajawal'] font-bold text-lg leading-relaxed tracking-wide fixed top-0 w-full z-50 shadow-[0_1px_0_0_rgba(195,198,209,0.15)] shadow-sm md:hidden">
      <div className="flex flex-row-reverse justify-between items-center w-full px-6 py-4 max-w-full mx-auto">
        <div className="text-xl font-bold bg-gradient-to-br from-[#001e40] to-[#003366] bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-300">
          نظام حجز القاعات
        </div>
        <div className="flex flex-row-reverse gap-4">
          <Link to="/notifications" className="scale-95 active:scale-90 transition-transform hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-all duration-300 p-2 rounded-full">
            <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
          </Link>
          <button className="scale-95 active:scale-90 transition-transform hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-all duration-300 p-2 rounded-full">
            <span className="material-symbols-outlined" data-icon="person">person</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
