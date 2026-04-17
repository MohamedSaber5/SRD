export default function BookingForm() {
  return (
    <>
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2">طلب حجز قاعة جديدة</h2>
          <p className="text-on-surface-variant text-lg">يرجى إكمال تفاصيل الحجز للموافقة عليها من قبل الإدارة.</p>
        </div>
      </div>

      <div className="mb-12 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-surface-container-high -z-10 -translate-y-1/2 rounded-full"></div>
        <div className="absolute top-1/2 right-0 w-1/3 h-0.5 bg-secondary -z-10 -translate-y-1/2 rounded-full"></div>
        <div className="flex justify-between relative z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
            <span className="font-headline font-bold text-primary">تفاصيل الحجز</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest border-2 border-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-lg">2</div>
            <span className="font-headline font-medium text-on-surface-variant">بيانات المسؤول</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest border-2 border-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-lg">3</div>
            <span className="font-headline font-medium text-on-surface-variant">المتطلبات التقنية</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-2/3 flex flex-col gap-8">
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary to-primary-container"></div>
            <h3 className="text-xl font-headline font-bold text-primary mb-6 border-b border-surface-container-high pb-4">المعلومات الأساسية</h3>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="block text-sm font-label font-bold text-on-surface-variant">اختر القاعة</label>
                <div className="relative">
                  <select defaultValue="" className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer">
                    <option disabled value="">يرجى اختيار قاعة...</option>
                    <option value="1">قاعة المؤتمرات الكبرى (مبنى A)</option>
                    <option value="2">قاعة الندوات المتعددة (مبنى B)</option>
                    <option value="3">المسرح الأكاديمي (مبنى C)</option>
                  </select>
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="col-span-1 space-y-2">
                <label className="block text-sm font-label font-bold text-on-surface-variant">تاريخ الفعالية</label>
                <div className="relative">
                  <input className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary cursor-pointer text-right" dir="rtl" type="date"/>
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">calendar_month</span>
                </div>
              </div>

              <div className="col-span-1 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-label font-bold text-on-surface-variant">من</label>
                  <input className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary cursor-pointer text-center" type="time"/>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-label font-bold text-on-surface-variant">إلى</label>
                  <input className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary cursor-pointer text-center" type="time"/>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="block text-sm font-label font-bold text-on-surface-variant">الغرض من الاستخدام</label>
                <textarea className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary resize-none" placeholder="وصف موجز لطبيعة الفعالية أو الاجتماع..." rows={4}></textarea>
              </div>
            </form>

            <div className="mt-8 flex justify-end gap-4">
              <button className="px-6 py-2.5 rounded-xl text-secondary font-bold hover:bg-secondary-container/20 transition-colors" type="button">
                إلغاء
              </button>
              <button className="px-8 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-md flex items-center gap-2" type="button">
                <span>التالي</span>
                <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-secondary-fixed/20 rounded-2xl p-6 border border-secondary-fixed">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-secondary-fixed/40 flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined">policy</span>
              </div>
              <h4 className="font-headline font-bold text-on-secondary-container text-lg">بروتوكول الحجز</h4>
            </div>
            <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
              يجب تقديم طلبات حجز القاعات الكبرى قبل <strong className="text-secondary">48 ساعة</strong> على الأقل من موعد الفعالية لضمان توفير الخدمات المطلوبة.
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col h-full border border-surface-container-high">
            <div className="h-48 bg-surface-container relative">
              <img 
                alt="صورة لقاعة مؤتمرات حديثة بإضاءة دافئة وكراسي مرتبة" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD29IwUpHwPzbD7UDZcfS1S_Q03f5ac4IaMN1sufVYzolSnhz9NK3a6tBqdjWYgSuw8ofWYWszmM2ot8cU4HxvQc0Y7sJFcxiRgXRNrzq1AkhF5hNtVXNPjy9M3hDmj_WNFj7usV2oiWRMZTTVz0uD2wEhCeuAk6fjw6eviAkuJNbotYDQ-gEgJYINdUYHg4VUojWZLvu7IEUpFx0Yn8-aqw1mHb0J5cwvtWz86beganwOUqPBC4gWMj-Uz0VOhNM9u7Aqii8t2V_3B"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
              <div className="absolute bottom-4 right-4 left-4">
                <span className="inline-block px-3 py-1 bg-secondary-fixed text-on-secondary-fixed text-xs font-bold rounded-full mb-2">متاح</span>
                <h4 className="text-white font-headline font-bold text-lg">قاعة المؤتمرات الكبرى</h4>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">السعة:</span>
                <span className="font-bold text-primary">150 شخص</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">المبنى:</span>
                <span className="font-bold text-primary">المبنى الرئيسي (A)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">التجهيزات:</span>
                <span className="font-bold text-primary text-left">شاشة عرض، نظام صوتي</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
