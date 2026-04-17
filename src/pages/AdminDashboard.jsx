import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy,
  writeBatch 
} from 'firebase/firestore';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [alternativeSlot, setAlternativeSlot] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSeedRooms = async () => {
    if (!window.confirm('هل تريد تهيئة/تحديث قائمة القاعات في قاعدة البيانات؟')) return;
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      const rooms = [
        // Level 1
        { id: 'A-102', roomNumber: 'A-102', building: 'A', floor: 1, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-103', roomNumber: 'A-103', building: 'A', floor: 1, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-104', roomNumber: 'A-104', building: 'A', floor: 1, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-105', roomNumber: 'A-105', building: 'A', floor: 1, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-106', roomNumber: 'A-106', building: 'A', floor: 1, capacity: 40, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-107', roomNumber: 'A-107', building: 'A', floor: 1, capacity: 40, status: 'available', type: 'fixed', createdAt: serverTimestamp() },

        // Level 2
        { id: 'A-202', roomNumber: 'A-202', building: 'A', floor: 2, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-203', roomNumber: 'A-203', building: 'A', floor: 2, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-204', roomNumber: 'A-204', building: 'A', floor: 2, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-205', roomNumber: 'A-205', building: 'A', floor: 2, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-206', roomNumber: 'A-206', building: 'A', floor: 2, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-208', roomNumber: 'A-208', building: 'A', floor: 2, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-209', roomNumber: 'A-209', building: 'A', floor: 2, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-210', roomNumber: 'A-210', building: 'A', floor: 2, capacity: 40, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-211', roomNumber: 'A-211', building: 'A', floor: 2, capacity: 40, status: 'available', type: 'fixed', createdAt: serverTimestamp() },

        // Level 3
        { id: 'A-302', roomNumber: 'A-302', building: 'A', floor: 3, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-303', roomNumber: 'A-303', building: 'A', floor: 3, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-304', roomNumber: 'A-304', building: 'A', floor: 3, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-305', roomNumber: 'A-305', building: 'A', floor: 3, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-306', roomNumber: 'A-306', building: 'A', floor: 3, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-308', roomNumber: 'A-308', building: 'A', floor: 3, capacity: 20, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-309', roomNumber: 'A-309', building: 'A', floor: 3, capacity: 40, status: 'available', type: 'fixed', createdAt: serverTimestamp() },
        { id: 'A-310', roomNumber: 'A-310', building: 'A', floor: 3, capacity: 40, status: 'available', type: 'fixed', createdAt: serverTimestamp() },

        // Multi-purpose
        { id: 'm_1', roomNumber: 'قاعة المؤتمرات الكبرى', building: 'A', floor: 1, capacity: 200, status: 'available', type: 'multi', createdAt: serverTimestamp() },
        { id: 'm_2', roomNumber: 'قاعة الندوات المتعددة', building: 'B', floor: 1, capacity: 100, status: 'available', type: 'multi', createdAt: serverTimestamp() },
      ];

      rooms.forEach(room => {
        const roomRef = doc(db, 'rooms', room.id);
        batch.set(roomRef, room, { merge: true });
      });

      await batch.commit();
      alert('تم تحديث قائمة القاعات بنجاح في Firestore');
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء مزامنة القاعات');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (bookingId) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'approved',
        updatedAt: serverTimestamp()
      });
      alert('تم قبول الحجز بنجاح');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء معالجة الطلب');
    }
  };

  const handleRejectClick = (req) => {
    setSelectedRequest(req);
    setIsRejectModalOpen(true);
  };

  const submitReject = async () => {
    if (!selectedRequest) return;
    try {
      const bookingRef = doc(db, 'bookings', selectedRequest.id);
      await updateDoc(bookingRef, {
        status: 'rejected',
        rejectReason,
        alternativeSlot,
        updatedAt: serverTimestamp()
      });
      setIsRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
      setAlternativeSlot('');
      alert('تم إرسال الرفض لمقدم الطلب');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء رفض الطلب');
    }
  };

  // Stats Logic
  const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'approved_by_branch').length;
  const acceptedTodayCount = bookings.filter(b => b.status === 'approved' && b.date === new Date().toISOString().split('T')[0]).length;

  // Requests Logic
  // Show pending fixed rooms OR branch approved multi rooms
  const requests = bookings.filter(b => 
    (b.roomType === 'fixed' && b.status === 'pending') || 
    (b.status === 'approved_by_branch')
  );

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">لوحة تحكم المسؤول</h1>
          <p className="text-on-surface-variant mt-2 text-lg">إدارة الجداول الأسبوعية والطلبات الاستثنائية</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSeedRooms}
            disabled={isSyncing}
            className={`px-4 py-2 rounded-lg border border-outline-variant/15 transition-all flex items-center gap-2 font-bold shadow-sm ${isSyncing ? 'bg-surface-container text-on-surface-variant cursor-not-allowed' : 'bg-surface-container-lowest text-secondary hover:bg-secondary/10'}`}
          >
            <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
            {isSyncing ? 'جاري المزامنة...' : 'تحديث القاعات (Firestore)'}
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
            <div className="text-4xl font-headline font-bold text-primary">{acceptedTodayCount}</div>
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
            <div className="text-4xl font-headline font-bold text-secondary">{pendingCount}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly View - Simplified for now based on approved fixed bookings */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-headline font-bold text-primary">الجدول الأسبوعي (Weekly View)</h2>
            <div className="flex flex-wrap gap-3 text-xs font-medium">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> ثابتة</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> متعددة الأغراض</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[700px] border rounded-xl overflow-hidden">
               <table className="w-full text-center border-collapse">
                 <thead className="bg-surface-container-high text-on-surface-variant">
                   <tr>
                     <th className="py-3 px-4 border">القاعة</th>
                     <th className="py-3 px-4 border">التاريخ</th>
                     <th className="py-3 px-4 border">الوقت</th>
                     <th className="py-3 px-4 border">المسؤول</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {bookings.filter(b => b.status === 'approved').slice(0, 10).map(b => (
                     <tr key={b.id} className="hover:bg-surface-container-lowest transition-colors">
                       <td className="py-3 px-4 font-bold text-primary">{b.roomId}</td>
                       <td className="py-3 px-4">{b.date}</td>
                       <td className="py-3 px-4 ltr" dir="ltr">{b.timeFrom} - {b.timeTo}</td>
                       <td className="py-3 px-4 text-sm">{b.responsibleName}</td>
                     </tr>
                   ))}
                   {bookings.filter(b => b.status === 'approved').length === 0 && (
                     <tr>
                       <td colSpan="4" className="py-10 text-on-surface-variant italic">لا توجد حجوزات معتمدة حالياً</td>
                     </tr>
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        </div>

        {/* Requests Management */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-headline font-bold text-primary">إدارة الطلبات</h2>
          </div>
          <div className="space-y-4 flex-grow overflow-y-auto max-h-[600px] pr-2">
            
            {requests.map(req => (
              <div key={req.id} className="bg-surface rounded-xl p-4 border border-outline-variant/20 hover:border-outline-variant/60 transition-all shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-on-surface">طلب حجز: {req.roomId}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${req.status === 'approved_by_branch' ? 'bg-secondary text-white' : 'bg-surface-variant text-on-surface-variant'}`}>
                    {req.status === 'approved_by_branch' ? 'معتمد فرعياً' : 'جديد'}
                  </span>
                </div>
                <div className="text-sm text-on-surface-variant mb-4 space-y-1">
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">person</span> {req.responsibleName}</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">calendar_today</span> {req.date}</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">schedule</span> {req.timeFrom} - {req.timeTo}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(req.id)} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-container transition-colors shadow-sm">قبول</button>
                  <button onClick={() => handleRejectClick(req)} className="flex-1 bg-error-container text-on-error-container rounded-lg py-2 text-sm font-medium hover:bg-error transition-colors hover:text-white shadow-sm">رفض / بديل</button>
                </div>
              </div>
            ))}

            {requests.length === 0 && (
               <div className="text-center py-10 opacity-50 space-y-2">
                 <span className="material-symbols-outlined text-4xl">check_circle</span>
                 <p className="font-bold">لا توجد طلبات معلقة</p>
               </div>
            )}

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
            <p className="text-sm text-on-surface-variant mb-6">{selectedRequest?.roomId} - {selectedRequest?.responsibleName}</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-label font-bold text-on-surface">سبب الرفض</label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary resize-none text-right" 
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
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary text-right" 
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

