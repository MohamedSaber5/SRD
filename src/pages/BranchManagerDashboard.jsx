import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export default function BranchManagerDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch multi-purpose rooms that are pending branch approval
    const q = query(
      collection(db, 'bookings'), 
      where('roomType', '==', 'multi'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (id) => {
    try {
      const docRef = doc(db, 'bookings', id);
      await updateDoc(docRef, {
        status: 'approved_by_branch',
        branchApprovedAt: serverTimestamp()
      });
      alert('تم الاعتماد بنجاح وتم تحويل الطلب للمسؤول العام');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الاعتماد');
    }
  };

  const handleReject = async (id) => {
    try {
      const docRef = doc(db, 'bookings', id);
      await updateDoc(docRef, {
        status: 'rejected',
        rejectReason: 'مرفوض من قبل مدير الفرع لعدم توفر الصلاحية حالياً',
        updatedAt: serverTimestamp()
      });
      alert('تم رفض الطلب');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الرفض');
    }
  };

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">اعتمادات مدير الفرع</h1>
          <p className="text-on-surface-variant mt-2 text-lg">الطلبات الخاصة بالقاعات المتعددة الأغراض بانتظار الاعتماد المالي/الإداري</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-headline font-bold text-primary">الطلبات المعلقة ({requests.length})</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map(req => (
            <div key={req.id} className="bg-surface rounded-xl p-6 border border-outline-variant/20 hover:border-outline-variant/60 transition-all shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-secondary"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="font-bold text-on-surface text-xl">حجز: {req.roomId}</div>
                <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-bold">متعددة الأغراض</span>
              </div>

              <div className="text-sm text-on-surface-variant mb-6 space-y-2">
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">person</span> مقدم الطلب: {req.responsibleName} ({req.userName})</div>
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">calendar_today</span> {req.date}</div>
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">schedule</span> {req.timeFrom} - {req.timeTo}</div>
                <div className="flex items-start gap-2 pt-2 border-t border-surface-variant"><span className="material-symbols-outlined text-[18px] text-primary">info</span> <span>الغرض: {req.purpose}</span></div>
              </div>

              <div className="flex gap-4 mt-auto">
                <button onClick={() => handleApprove(req.id)} className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-2">
                   <span className="material-symbols-outlined">verified</span>
                   اعتماد الطلب
                </button>
                <button onClick={() => handleReject(req.id)} className="flex-1 bg-error-container text-on-error-container rounded-xl py-3 text-sm font-bold hover:bg-error transition-colors hover:text-white shadow-sm flex items-center justify-center gap-2">
                   <span className="material-symbols-outlined">block</span>
                   رفض
                </button>
              </div>
            </div>
          ))}

          {!loading && requests.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-50 flex flex-col items-center gap-4">
               <span className="material-symbols-outlined text-7xl">checklist_rtl</span>
               <p className="text-xl font-bold">لا توجد طلبات معلقة بانتظارك حالياً</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

 