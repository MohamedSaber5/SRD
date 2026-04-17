import React from 'react';

export default function BranchManagerDashboard() {
  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">اعتمادات مدير الفرع</h1>
          <p className="text-on-surface-variant mt-2 text-lg">الطلبات الخاصة بالقاعات المتعددة الأغراض بانتظار الاعتماد المالي/الإداري</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-headline font-bold text-primary">الطلبات المعلقة</h2>
        </div>
        
        <div className="space-y-4 flex-grow">
          <div className="bg-surface rounded-xl p-4 border border-outline-variant/20 hover:border-outline-variant/60 transition-colors relative overflow-hidden">
             <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-on-surface text-lg">طلب حجز قاعة المؤتمرات الكبرى</div>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">متعددة الأغراض</span>
            </div>
            <div className="text-sm text-on-surface-variant mb-4 space-y-2">
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">person</span> مقدم الطلب: د. سامي عبد الله (أستاذ مساعد)</div>
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">calendar_today</span> الاثنين، ١٢ نوفمبر ٢٠٢٤</div>
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">schedule</span> 10:00 ص - 12:00 م</div>
              <div className="flex items-start gap-2 pt-2 border-t border-surface-variant"><span className="material-symbols-outlined text-[18px] text-primary">info</span> <span>الغرض: مناقشة رسالة ماجستير مع وجود ضيوف من خارج الأكاديمية.</span></div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => alert('تم الاعتماد المالي والإداري للطلب')} className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-2">
                 <span className="material-symbols-outlined">verified</span>
                 اعتماد الطلب
              </button>
              <button onClick={() => alert('تم رفض الطلب لعدم توفر الاعتماد')} className="flex-1 bg-error-container text-on-error-container rounded-xl py-3 text-sm font-bold hover:bg-error transition-colors hover:text-white shadow-sm flex items-center justify-center gap-2">
                 <span className="material-symbols-outlined">block</span>
                 رفض
              </button>
            </div>
          </div>
          
          {/* Add another sample for realism */}
          <div className="bg-surface rounded-xl p-4 border border-outline-variant/20 hover:border-outline-variant/60 transition-colors relative overflow-hidden">
             <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-on-surface text-lg">طلب حجز المسرح الأكاديمي</div>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">متعددة الأغراض</span>
            </div>
            <div className="text-sm text-on-surface-variant mb-4 space-y-2">
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">person</span> مقدم الطلب: أ. نورة السالم</div>
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">calendar_today</span> الخميس، ١٥ نوفمبر ٢٠٢٤</div>
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">schedule</span> 01:00 م - 04:00 م</div>
              <div className="flex items-start gap-2 pt-2 border-t border-surface-variant"><span className="material-symbols-outlined text-[18px] text-primary">info</span> <span>الغرض: نشاط طلابي - حفل استقبال الطلاب الجدد.</span></div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => alert('تم الاعتماد المالي والإداري للطلب')} className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-2">
                 <span className="material-symbols-outlined">verified</span>
                 اعتماد الطلب
              </button>
              <button onClick={() => alert('تم رفض الطلب لعدم توفر الاعتماد')} className="flex-1 bg-error-container text-on-error-container rounded-xl py-3 text-sm font-bold hover:bg-error transition-colors hover:text-white shadow-sm flex items-center justify-center gap-2">
                 <span className="material-symbols-outlined">block</span>
                 رفض
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
