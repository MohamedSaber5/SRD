export default function AdminDashboard() {
  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">نظرة عامة</h1>
          <p className="text-on-surface-variant mt-2 text-lg">ملخص نشاط الحجوزات اليوم</p>
        </div>
        <div className="hidden md:flex gap-3">
          <button className="bg-surface-container-lowest text-primary px-4 py-2 rounded-lg border border-outline-variant/15 hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            تصدير التقرير
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow relative overflow-hidden group">
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-primary-container text-white rounded-xl">
              <span className="material-symbols-outlined" data-icon="book_online">book_online</span>
            </div>
            <span className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              +12% <span className="material-symbols-outlined text-xs">trending_up</span>
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-on-surface-variant text-sm font-medium mb-1">إجمالي الحجوزات</div>
            <div className="text-4xl font-headline font-bold text-primary">1,248</div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow relative overflow-hidden group">
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-secondary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-secondary-container text-on-secondary-container rounded-xl">
              <span className="material-symbols-outlined" data-icon="pending_actions">pending_actions</span>
            </div>
            <span className="bg-surface-container-high text-on-surface px-3 py-1 rounded-full text-sm font-medium">اليوم</span>
          </div>
          <div className="relative z-10">
            <div className="text-on-surface-variant text-sm font-medium mb-1">الطلبات المعلقة</div>
            <div className="text-4xl font-headline font-bold text-secondary">34</div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow relative overflow-hidden group">
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-tertiary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-tertiary-container text-white rounded-xl">
              <span className="material-symbols-outlined" data-icon="pie_chart">pie_chart</span>
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-on-surface-variant text-sm font-medium mb-1">نسبة إشغال القاعات</div>
            <div className="text-4xl font-headline font-bold text-tertiary">86%</div>
            <div className="w-full bg-surface-container-high rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-gradient-to-r from-tertiary to-tertiary-fixed h-2 rounded-full" style={{ width: '86%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-headline font-bold text-primary">الجدول الأسبوعي</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-surface-container-low rounded-lg text-on-surface-variant transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
              <span className="py-2 px-4 font-medium text-sm">أكتوبر 2023</span>
              <button className="p-2 hover:bg-surface-container-low rounded-lg text-on-surface-variant transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-6 gap-2 mb-4 text-center text-sm font-medium text-on-surface-variant">
                <div className="text-right pl-4">الوقت</div>
                <div>الأحد</div>
                <div>الإثنين</div>
                <div>الثلاثاء</div>
                <div>الأربعاء</div>
                <div>الخميس</div>
              </div>

              <div className="space-y-3 relative">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                  <div className="border-t border-outline-variant/10 h-16"></div>
                  <div className="border-t border-outline-variant/10 h-16"></div>
                  <div className="border-t border-outline-variant/10 h-16"></div>
                  <div className="border-t border-outline-variant/10 h-16"></div>
                </div>

                <div className="grid grid-cols-6 gap-2 h-16 items-center relative z-10">
                  <div className="text-right text-sm text-on-surface-variant pr-2">08:00 ص</div>
                  <div className="bg-primary-container/10 border-r-4 border-primary text-primary rounded-lg p-2 text-xs font-medium h-full flex flex-col justify-center">
                    <span>قاعة 101</span>
                    <span className="opacity-70">محاضرة ثابتة</span>
                  </div>
                  <div></div>
                  <div className="bg-secondary-container/20 border-r-4 border-secondary text-secondary-fixed-variant rounded-lg p-2 text-xs font-medium h-full flex flex-col justify-center">
                    <span>قاعة 204</span>
                    <span className="opacity-70">حجز استثنائي</span>
                  </div>
                  <div></div>
                  <div className="bg-tertiary-container/10 border-r-4 border-tertiary text-tertiary rounded-lg p-2 text-xs font-medium h-full flex flex-col justify-center">
                    <span>المسرح</span>
                    <span className="opacity-70">متعدد الأغراض</span>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 h-16 items-center relative z-10">
                  <div className="text-right text-sm text-on-surface-variant pr-2">10:00 ص</div>
                  <div></div>
                  <div className="bg-primary-container/10 border-r-4 border-primary text-primary rounded-lg p-2 text-xs font-medium h-full flex flex-col justify-center col-span-2">
                    <span>معمل الحاسبات (أ)</span>
                    <span className="opacity-70">محاضرة ثابتة - ساعتين</span>
                  </div>
                  <div></div>
                  <div></div>
                </div>

                <div className="grid grid-cols-6 gap-2 h-16 items-center relative z-10">
                  <div className="text-right text-sm text-on-surface-variant pr-2">12:00 م</div>
                  <div className="bg-secondary-container/20 border-r-4 border-secondary text-secondary-fixed-variant rounded-lg p-2 text-xs font-medium h-full flex flex-col justify-center">
                    <span>قاعة 302</span>
                    <span className="opacity-70">مناقشة مشروع</span>
                  </div>
                  <div></div>
                  <div></div>
                  <div className="bg-tertiary-container/10 border-r-4 border-tertiary text-tertiary rounded-lg p-2 text-xs font-medium h-full flex flex-col justify-center">
                    <span>قاعة الاجتماعات</span>
                    <span className="opacity-70">اجتماع قسم</span>
                  </div>
                  <div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-headline font-bold text-primary">الطلبات الأخيرة</h2>
            <button className="text-sm text-secondary font-medium hover:underline">عرض الكل</button>
          </div>
          <div className="space-y-4 flex-grow">
            <div className="bg-surface rounded-xl p-4 border border-outline-variant/10 hover:border-outline-variant/30 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-on-surface">طلب حجز قاعة 105</div>
                <span className="bg-error-container/20 text-error px-2 py-0.5 rounded text-xs font-medium">عاجل</span>
              </div>
              <div className="text-sm text-on-surface-variant mb-4 space-y-1">
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">person</span> د. سامي عبد الله</div>
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">schedule</span> غداً، 10:00 ص - 12:00 م</div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-container transition-colors">قبول</button>
                <button className="flex-1 bg-surface-container-highest text-on-surface rounded-lg py-2 text-sm font-medium hover:bg-surface-dim transition-colors border border-outline-variant/20">رفض مع بديل</button>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-4 border border-outline-variant/10 hover:border-outline-variant/30 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-on-surface">طلب حجز المسرح</div>
              </div>
              <div className="text-sm text-on-surface-variant mb-4 space-y-1">
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">person</span> أ. نورة السالم</div>
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">schedule</span> الخميس، 01:00 م - 04:00 م</div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-container transition-colors">قبول</button>
                <button className="flex-1 bg-surface-container-highest text-on-surface rounded-lg py-2 text-sm font-medium hover:bg-surface-dim transition-colors border border-outline-variant/20">رفض مع بديل</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
