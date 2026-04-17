export default function UserDashboard() {
  return (
    <>
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-black text-primary mb-2 tracking-wide">مرحباً د. أحمد</h1>
          <p className="text-on-surface-variant font-body text-lg">نظرة عامة على حجوزاتك ونشاطك الأكاديمي اليوم.</p>
        </div>
        <div className="flex gap-4">
          <img 
            alt="صورة الملف الشخصي للمستخدم" 
            className="w-16 h-16 rounded-full object-cover border-2 border-surface-container-lowest shadow-sm" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBG1szMTfw9WlXWiQRzSQYX0ltrniLuq9jICZLWxeY94tY2oLwxny6Kw6DBYmyrDkmbFYFN3bMCo52bAJuKe6p8TzcSr64pAMpy1QQjP8GsvGOLJ0j4hL3Vec_aetDDtHzRi8Wf7181iT_UujkYzgkNSCJJ82SBDUyiIpQzpIPXtiFBotytFJX038xW4YBIykhksgYCOYL_hJLn0zaskQsNUXlGNsjp4O5gCt7qFtqocCFycdo4R2Qds__gokyYs56itlWg3fPIa_M7"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-surface-container-lowest rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px] group transition-all duration-300 hover:bg-surface">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <span className="text-3xl font-headline font-bold text-primary">12</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-on-surface text-xl mb-1">حجوزاتي النشطة</h3>
            <p className="text-sm text-on-surface-variant font-body">قاعات محجوزة لهذا الأسبوع</p>
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-tl-full -mr-8 -mb-8 transition-transform group-hover:scale-110"></div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px] group transition-all duration-300 hover:bg-surface">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-2xl">pending_actions</span>
            </div>
            <span className="text-3xl font-headline font-bold text-secondary">3</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-on-surface text-xl mb-1">طلبات معلقة</h3>
            <p className="text-sm text-on-surface-variant font-body">بانتظار الموافقة الإدارية</p>
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/10 rounded-tl-full -mr-8 -mb-8 transition-transform group-hover:scale-110"></div>
        </div>

        <div className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center items-center text-center min-h-[160px] group cursor-pointer shadow-[0_12px_32px_-12px_rgba(0,30,64,0.4)] hover:-translate-y-1 transition-transform">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl">add_business</span>
          </div>
          <h3 className="font-headline font-bold text-white text-xl">طلب حجز قاعة جديدة</h3>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50"></div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-headline font-bold text-primary">حالة الطلبات الأخيرة</h2>
          <a className="text-secondary font-body font-semibold text-sm flex items-center gap-1 hover:underline" href="#">
            عرض الكل
            <span className="material-symbols-outlined text-sm">arrow_left</span>
          </a>
        </div>
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-secondary-fixed"></div>
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">meeting_room</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-headline font-bold text-lg text-on-surface">قاعة المحاضرات الكبرى (A1)</h3>
                  <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed text-xs font-bold rounded-full font-label tracking-wide">مقبول</span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant font-body">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> 12 أكتوبر 2023</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> 10:00 ص - 12:00 م</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">group</span> مقرر: برمجة متقدمة</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button className="w-full md:w-auto px-6 py-2.5 rounded-lg border border-outline-variant/30 text-primary font-body font-semibold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">visibility</span>
                التفاصيل
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-tertiary-fixed-dim"></div>
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">meeting_room</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-headline font-bold text-lg text-on-surface">معمل الحاسب الآلي (Lab 3)</h3>
                  <span className="px-3 py-1 bg-surface-container-highest text-on-surface text-xs font-bold rounded-full font-label tracking-wide">قيد الانتظار</span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant font-body">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> 15 أكتوبر 2023</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> 01:00 م - 03:00 م</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">group</span> مناقشة مشاريع</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 opacity-70">
              <button className="w-full md:w-auto px-6 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface-variant font-body font-semibold hover:bg-surface-container-low transition-colors" disabled={true}>
                جاري المراجعة...
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-error-container"></div>
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0 opacity-60">
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">meeting_room</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-headline font-bold text-lg text-on-surface line-through decoration-error/30">قاعة اجتماعات الأقسام (B2)</h3>
                  <span className="px-3 py-1 bg-error-container text-on-error-container text-xs font-bold rounded-full font-label tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">cancel</span>
                    مرفوض
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant font-body mb-2">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> 10 أكتوبر 2023</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> 09:00 ص - 11:00 ص</span>
                </div>
                <p className="text-sm text-error flex items-center gap-1 font-body">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  عذراً، القاعة محجوزة مسبقاً لفعالية الكلية في هذا الوقت.
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-surface text-secondary font-body font-bold hover:bg-secondary-fixed/50 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">search</span>
                عرض البديل
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
