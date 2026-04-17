import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from 'firebase/firestore';

export default function UserDashboard({ title }) {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const activeCount = bookings.filter(b => b.status === 'approved').length;
  const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'awaiting_manager_final').length;
  const rejectedCount = bookings.filter(b => b.status === 'rejected').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">مقبول</span>;
      case 'awaiting_manager_final':
        return <span className="px-3 py-1 bg-[#b58b4b]/10 text-[#8b6a37] border border-[#b58b4b]/20 text-xs font-bold rounded-full">إعتماد نهائي</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-error-container text-on-error-container text-xs font-bold rounded-full">مرفوض</span>;
      default:
        return <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-xs font-bold rounded-full">قيد الانتظار</span>;
    }
  };

  return (
    <>
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="text-right">
          <h1 className="text-4xl md:text-5xl font-headline font-black text-primary mb-2 tracking-wide">
            مرحباً {userData?.displayName || currentUser?.displayName || 'زميلنا الأكاديمي'}
          </h1>
          <p className="text-on-surface-variant font-body text-lg">
            {title ? `لوحة تحكم ${title}` : 'نظرة عامة على سجل طلبات الحجز الخاصة بك.'}
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/booking')} 
            className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold shadow-md hover:-translate-y-1 transition-transform flex items-center gap-2"
          >
             <span className="material-symbols-outlined shrink-0 text-xl">add_circle</span>
             <span>طلب حجز جديد</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-surface-container-lowest rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px] group transition-all duration-300 hover:bg-surface border border-surface-container-high border-b-4 hover:border-b-green-500">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <span className="text-3xl font-headline font-black text-green-700">{activeCount}</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-on-surface text-lg text-right">الطلبات المقبولة (Approved)</h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px] group transition-all duration-300 hover:bg-surface border border-surface-container-high border-b-4 hover:border-b-[#b58b4b]">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-[#fbf0dd]/50 flex items-center justify-center text-[#b58b4b]">
              <span className="material-symbols-outlined text-2xl">pending_actions</span>
            </div>
            <span className="text-3xl font-headline font-black text-[#8b6a37]">{pendingCount}</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-on-surface text-lg text-right">قيد الانتظار (Pending)</h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px] group transition-all duration-300 hover:bg-surface border border-surface-container-high border-b-4 hover:border-b-error">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-error-container/20 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-2xl">cancel</span>
            </div>
            <span className="text-3xl font-headline font-black text-error">{rejectedCount}</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-on-surface text-lg text-right">الطلبات المرفوضة (Rejected)</h3>
          </div>
        </div>
      </div>

      <section className="text-right">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-headline font-bold text-primary">حالة الطلبات الأخيرة</h2>
        </div>
        
        <div className="flex flex-col gap-6">
          {bookings.map(req => (
            <div key={req.id} className="bg-surface-container-lowest rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border border-surface-container-high transition-all hover:bg-surface">
              <div className={`absolute right-0 top-0 bottom-0 w-1.5 ${req.status === 'approved' ? 'bg-green-500' : req.status === 'rejected' ? 'bg-error' : 'bg-secondary'}`}></div>
              <div className="flex items-start gap-4 flex-1 w-full">
                <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">meeting_room</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-headline font-bold text-lg text-on-surface">{req.roomId}</h3>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant font-body">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> {req.date}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> {req.timeFrom} - {req.timeTo}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">info</span> الغرض: {req.purpose}</span>
                  </div>
                  {req.status === 'rejected' && (
                    <div className="mt-4 flex flex-col gap-2">
                       <p className="text-sm text-error font-bold flex items-center gap-1 bg-error-container/10 p-2 rounded-lg">
                         <span className="material-symbols-outlined text-[16px]">error</span>
                         السبب: {req.rejectReason || 'لم يتم ذكر سبب محدد'}
                       </p>
                       {(req.suggestedRoomId || req.suggestedDate || req.suggestedTimeFrom) && (
                         <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                           <div className="text-sm text-[#001e40]">
                             <span className="font-bold flex items-center gap-1 mb-1 text-blue-700">
                               <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                               تفاصيل البديل المقترح:
                             </span>
                             <div className="flex flex-wrap gap-3 text-xs opacity-80 mt-2">
                               {req.suggestedRoomId && <span className="bg-white px-2 py-1 rounded border border-blue-100 shadow-sm">القاعة: {req.suggestedRoomId}</span>}
                               {req.suggestedDate && <span className="bg-white px-2 py-1 rounded border border-blue-100 shadow-sm">التاريخ: {req.suggestedDate}</span>}
                               {req.suggestedTimeFrom && <span className="bg-white px-2 py-1 rounded border border-blue-100 shadow-sm">الوقت: {req.suggestedTimeFrom} - {req.suggestedTimeTo}</span>}
                             </div>
                           </div>
                           <button 
                             onClick={() => navigate('/booking', { 
                               state: { 
                                 prefill: {
                                   ...req,
                                   roomId: req.suggestedRoomId || req.roomId,
                                   date: req.suggestedDate || req.date,
                                   timeFrom: req.suggestedTimeFrom || req.timeFrom,
                                   timeTo: req.suggestedTimeTo || req.timeTo
                                 } 
                               }
                             })}
                             className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                           >
                             <span className="material-symbols-outlined text-[18px]">refresh</span>
                             تقديم الطلب بالبديل
                           </button>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {bookings.length === 0 && !loading && (
            <div className="py-20 text-center opacity-50 flex flex-col items-center gap-4">
               <span className="material-symbols-outlined text-7xl">history</span>
               <p className="text-xl font-bold">لم تقم بإرسال أي طلبات حجز بعد</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
