import { useState } from 'react';

export default function AdminDashboard() {
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [alternativeSlot, setAlternativeSlot] = useState('');

  const handleRejectClick = (req) => {
    setSelectedRequest(req);
    setIsRejectModalOpen(true);
  };

  const submitReject = () => {
    alert(`تم رفض الطلب. السبب: ${rejectReason}. البديل: ${alternativeSlot}`);
    setIsRejectModalOpen(false);
    setSelectedRequest(null);
    setRejectReason('');
    setAlternativeSlot('');
  };

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">لوحة تحكم المسؤول</h1>
          <p className="text-on-surface-variant mt-2 text-lg">إدارة الجداول الأسبوعية والطلبات الاستثنائية</p>
        </div>
        <div className="hidden md:flex gap-3">
          <button className="bg-surface-container-lowest text-primary px-4 py-2 rounded-lg border border-outline-variant/15 hover:bg-surface-container-low transition-colors flex items-center gap-2 font-bold shadow-sm">
            <span className="material-symbols-outlined text-sm">print</span>
            التقرير الصباحي
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-primary text-white rounded-xl">
              <span className="material-symbols-outlined" data-icon="book_online">book_online</span>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              مكتمل
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-on-surface-variant text-sm font-medium mb-1">الطلبات المقبولة اليوم</div>
            <div className="text-4xl font-headline font-bold text-primary">12</div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-secondary text-white rounded-xl">
              <span className="material-symbols-outlined" data-icon="pending_actions">pending_actions</span>
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-on-surface-variant text-sm font-medium mb-1">الطلبات قيد الانتظار</div>
            <div className="text-4xl font-headline font-bold text-secondary">5</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly View */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-headline font-bold text-primary">الجدول الأسبوعي (Weekly View)</h2>
            <div className="flex flex-wrap gap-3 text-xs font-medium">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> ثابتة</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> متعددة الأغراض</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> استثنائية</div>
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
                <div className="grid grid-cols-6 gap-2 h-16 items-center relative z-10 border-b border-surface-variant pb-2">
                  <div className="text-right text-sm text-on-surface-variant pr-2">08:00 ص</div>
                  <div className="bg-green-100 border-r-4 border-green-500 text-green-900 rounded-lg p-2 text-xs font-medium h-full flex flex-col justify-center">
                    <span>قاعة 101</span>
                    <span className="opacity-70">محاضرة ثابتة</span>
                  </div>
                  <div></div>
                  <div className="bg-yellow-100 border-r-4 border-yellow-500 text-yellow-900 rounded-lg p-2 text-xs font-medium h-full flex flex-col justify-center">
                    <span>قاعة 204</span>
                    <span className="opacity-70">حجز استثنائي</span>
                  </div>
                  <div></div>
                  <div className="bg-blue-100 border-r-4 border-blue-500 text-blue-900 rounded-lg p-2 text-xs font-medium h-full flex flex-col justify-center">
                    <span>المسرح</span>
                    <span className="opacity-70">فعالية نادي طلابي</span>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 h-16 items-center relative z-10 border-b border-surface-variant pb-2">
                  <div className="text-right text-sm text-on-surface-variant pr-2">10:00 ص</div>
                  <div></div>
                  <div className="bg-green-100 border-r-4 border-green-500 text-green-900 rounded-lg p-2 text-xs font-medium h-full flex flex-col justify-center col-span-2">
                    <span>معمل الحاسبات (أ)</span>
                    <span className="opacity-70">محاضرة ثابتة - ساعتين</span>
                  </div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Management */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-headline font-bold text-primary">إدارة الطلبات</h2>
          </div>
          <div className="space-y-4 flex-grow">
            
            {/* Request Card 1 */}
            <div className="bg-surface rounded-xl p-4 border border-outline-variant/20 hover:border-outline-variant/60 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-on-surface">طلب حجز قاعة 105</div>
              </div>
              <div className="text-sm text-on-surface-variant mb-4 space-y-1">
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">person</span> د. سامي عبد الله</div>
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">schedule</span> غداً، 10:00 ص - 12:00 م</div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-container transition-colors shadow-sm">قبول</button>
                <button onClick={() => handleRejectClick('طلب حجز قاعة 105')} className="flex-1 bg-error-container text-on-error-container rounded-lg py-2 text-sm font-medium hover:bg-error transition-colors hover:text-white shadow-sm">رفض / بديل</button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rtl" dir="rtl">
          <div className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setIsRejectModalOpen(false)} className="absolute top-4 left-4 text-on-surface-variant hover:text-error">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-2xl font-headline font-bold text-primary mb-2">رفض الطلب</h2>
            <p className="text-sm text-on-surface-variant mb-6">{selectedRequest}</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-label font-bold text-on-surface">سبب الرفض</label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary resize-none" 
                  placeholder="مثال: القاعة مشغولة بجدول ثابت..." 
                  rows={3}
                ></textarea>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-label font-bold text-on-surface">اقتراح بديل (اختياري)</label>
                <input 
                  type="text"
                  value={alternativeSlot}
                  onChange={(e) => setAlternativeSlot(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary" 
                  placeholder="مثال: قاعة 120 في نفس الموعد"
                />
              </div>

              <div className="flex gap-4 mt-8 pt-4 border-t border-surface-container-highest">
                <button 
                  onClick={submitReject}
                  className="px-6 py-2 bg-error text-white rounded-lg font-bold hover:bg-error/90 transition-colors flex-1"
                >
                  تأكيد الرفض
                </button>
                <button 
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-6 py-2 bg-surface-container-highest text-on-surface rounded-lg font-bold hover:bg-outline-variant/30 transition-colors flex-1"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
