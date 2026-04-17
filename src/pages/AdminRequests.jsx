import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where,
  getDocs,
  addDoc,
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function AdminRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingRooms, setIsCheckingRooms] = useState(false);
  
  // Rejection State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [alternativeSlot, setAlternativeSlot] = useState('');

  // Approval State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveSelectedRequest, setApproveSelectedRequest] = useState(null);
  const [approveRoomId, setApproveRoomId] = useState('');

  useEffect(() => {
    // Only fetch pending and awaiting manager final
    const qBookings = query(
      collection(db, 'bookings'), 
      where('status', 'in', ['pending', 'awaiting_manager_final'])
    );
    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setRequests(data);
      setLoading(false);
    });

    const qRooms = query(collection(db, 'rooms'));
    const unsubRooms = onSnapshot(qRooms, (snapshot) => {
      const r_data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoomsList(r_data);
    });

    return () => { unsubBookings(); unsubRooms(); }
  }, []);

  const handleApproveClick = async (req) => {
    setApproveSelectedRequest(req);
    setIsCheckingRooms(true);
    setIsApproveModalOpen(true);
    
    try {
      const qOverlap = query(
        collection(db, 'bookings'),
        where('date', '==', req.date),
        where('timeFrom', '==', req.timeFrom),
        where('status', 'in', ['approved', 'awaiting_manager_final'])
      );
      
      const overlapSnap = await getDocs(qOverlap);
      const occupiedRoomIds = overlapSnap.docs.map(d => d.data().roomId);
      
      // Filter out occupied rooms and globally unavailable rooms
      const freeRooms = roomsList.filter(r => !occupiedRoomIds.includes(r.id) && r.status !== 'unavailable');
      
      setAvailableRooms(freeRooms);
      
      // Select the requested one if it's free, otherwise default to first available
      if (freeRooms.some(r => r.id === req.roomId)) {
         setApproveRoomId(req.roomId);
      } else {
         setApproveRoomId(freeRooms[0]?.id || '');
      }
    } catch(err) {
      console.error("Error fetching overlapping rooms:", err);
    } finally {
      setIsCheckingRooms(false);
    }
  };

  const submitApprove = async () => {
    if (!approveSelectedRequest || !approveRoomId) return;

    try {
      const isMulti = approveSelectedRequest.roomType === 'multi';
      const targetStatus = isMulti ? 'awaiting_manager_final' : 'approved';

      const bookingRef = doc(db, 'bookings', approveSelectedRequest.id);
      await updateDoc(bookingRef, {
        status: targetStatus,
        roomId: approveRoomId, // Assign new room if modified
        adminApprovedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (isMulti) {
        const managersQuery = query(collection(db, 'users'), where('role', '==', 'branch_manager'));
        const managersSnap = await getDocs(managersQuery);
        
        const notifyTasks = managersSnap.docs.map(mDoc => 
          addDoc(collection(db, 'notifications'), {
            userId: mDoc.id,
            title: 'اعتماد نهائي مطلوب',
            message: `هناك طلب حجز قاعة متعددة الأغراض (${approveRoomId}) بانتظار اعتمادك النهائي`,
            type: 'manager_action',
            bookingId: approveSelectedRequest.id,
            isRead: false,
            createdAt: serverTimestamp()
          })
        );
        
        await Promise.all(notifyTasks);
        alert('تمت الموافقة وتخصيص القاعة وتوجيه الطلب لمدير الفرع للاعتماد النهائي');
      } else {
        alert('تم قبول الحجز وتخصيص القاعة بنجاح');
      }
      
      setIsApproveModalOpen(false);
      setApproveSelectedRequest(null);
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

      // Employee VIP Notification for Rejection
      await addDoc(collection(db, 'notifications'), {
        userId: selectedRequest.userId,
        title: 'تم رفض طلبك / يتطلب تعديل',
        message: `تم رفض الحجز لأن القاعة أو الوقت غير متاح. السبب: ${rejectReason || 'غير محدد'}. البديل المقترح: ${alternativeSlot || 'لا يوجد'}`,
        type: 'rejection_alert',
        bookingId: selectedRequest.id,
        isRead: false,
        createdAt: serverTimestamp()
      });

      setIsRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
      setAlternativeSlot('');
      alert('تم إرسال الرفض وإشعار مقدم الطلب بالبدائل المقترحة');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إغلاق الطلب');
    }
  };

  return (
    <div className="rtl" dir="rtl">
      <div className="flex items-center gap-4 mb-8 pt-8 px-4">
        <button onClick={() => navigate('/admin')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-[#1e3a5f]">arrow_forward</span>
        </button>
        <div>
          <h1 className="text-4xl font-headline font-bold text-[#001e40] tracking-tight">إدارة الطلبات</h1>
          <p className="text-[#5a7698] mt-2 text-lg">معالجة الحجوزات الطارئة والموافقة المبدئية</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 m-4 min-h-[500px]">
        {loading ? (
           <div className="flex justify-center py-20 text-blue-500">
             <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 custom-scrollbar">
            {requests.map(req => (
              <div key={req.id} className="bg-[#fcfdff] rounded-[1.2rem] p-5 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between h-auto">
                <div className="absolute top-0 right-0 w-[4px] h-full bg-[#1e3a5f] rounded-l-full"></div>
                
                <div>
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <div className="font-headline font-black text-[#001e40] text-xl leading-none">
                        قاعة {req.roomId}
                      </div>
                      <span className={`text-[10px] px-2 py-[2px] rounded-full font-bold ${req.status === 'awaiting_manager_final' ? 'bg-[#b58b4b] text-white' : 'bg-[#eef2f6] text-[#5a7698]'}`}>
                        {req.status === 'awaiting_manager_final' ? 'انتظار المدير' : 'طلب جديد'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-[#5a7698] font-bold mb-4 space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-blue-600">person</span> {req.responsibleName}</div>
                      <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-orange-500">schedule</span> {req.date}، {req.timeFrom}</div>
                      <div className="flex items-start gap-2 pt-2 border-t border-gray-200 mt-2">
                         <span className="material-symbols-outlined text-[16px] text-gray-500">edit_note</span> 
                         <span className="italic leading-relaxed">{req.purpose || 'لا يوجد غرض محدد'}</span>
                      </div>
                      
                      {(req.isHolidayEvent || req.isOfficialOccasion) && (
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-200">
                          {req.isHolidayEvent && (
                            <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                               <span className="material-symbols-outlined text-[14px]">celebration</span>
                               عطلة
                            </div>
                          )}
                          {req.isOfficialOccasion && (
                            <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                               <span className="material-symbols-outlined text-[14px]">stars</span>
                               مهم
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                </div>
                
                <div className="flex gap-2">
                  {req.status === 'pending' ? (
                    <>
                      <button onClick={() => handleApproveClick(req)} className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-3 text-xs font-black shadow-md hover:-translate-y-[2px] transition-transform">اعتماد وتخصيص</button>
                      <button onClick={() => handleRejectClick(req)} className="flex-1 bg-white text-[#001e40] border border-gray-200 rounded-lg py-3 text-xs font-black hover:bg-gray-50 hover:text-red-600 transition-colors">إلغاء</button>
                    </>
                  ) : (
                    <div className="flex-1 text-center py-3 bg-[#fbf0dd]/50 text-[#b58b4b] text-xs font-black rounded-lg border border-[rgba(181,139,75,0.2)]">
                      تم التوجيه للإدارة العليا
                    </div>
                  )}
                </div>
              </div>
            ))}

            {requests.length === 0 && (
               <div className="col-span-full text-center py-24 opacity-30 flex flex-col items-center">
                 <span className="material-symbols-outlined text-6xl mb-4 text-[#001e40]">task_alt</span>
                 <p className="font-bold text-[#001e40] text-xl">لا توجد طلبات معلقة حالياً</p>
               </div>
            )}
          </div>
        )}
      </div>
      
      {/* Approve & Allocate Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm rtl" dir="rtl">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl relative border-t-4 border-[#1e3a5f]">
            <button onClick={() => setIsApproveModalOpen(false)} className="absolute top-4 left-4 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full w-8 h-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <h2 className="text-2xl font-headline font-black text-[#001e40] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">task_alt</span>
              اعتماد تخصيص القاعة
            </h2>
            <p className="text-xs text-gray-500 font-bold mb-6">مراجعة واختيار القاعة المتاحة لهذا الطلب</p>

            <div className="space-y-4">
               
              <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100 flex gap-4 text-sm font-bold text-[#5a7698]">
                 <div className="flex-1">
                    <span className="block text-[10px] uppercase opacity-60">التاريخ والوقت</span>
                    <span className="text-[#001e40]">{approveSelectedRequest?.date} | {approveSelectedRequest?.timeFrom}</span>
                 </div>
                 <div className="flex-1">
                    <span className="block text-[10px] uppercase opacity-60">المقدم</span>
                    <span className="text-[#001e40]">{approveSelectedRequest?.responsibleName}</span>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#5a7698]">القاعة النهائية المخصصة</label>
                <select 
                   value={approveRoomId}
                   onChange={e => setApproveRoomId(e.target.value)}
                   className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] focus:ring-2 focus:ring-[#1e3a5f] font-bold outline-none"
                   disabled={isCheckingRooms || availableRooms.length === 0}
                >
                   {isCheckingRooms ? (
                      <option value="">جاري فحص التوافر...</option>
                   ) : availableRooms.length === 0 ? (
                      <option value="">لا توجد قاعات متاحة في هذا التوقيت</option>
                   ) : (
                      availableRooms.map(r => (
                         <option key={r.id} value={r.id}>
                            {r.roomNumber} ({r.type === 'multi' ? 'متعددة' : 'عادية'})
                         </option>
                      ))
                   )}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">* القائمة تظهر القاعات المجانية فقط في التاريخ والوقت المستهدفين.</p>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                <button 
                  onClick={submitApprove}
                  className="px-6 py-3 bg-[#1e3a5f] text-white rounded-xl font-bold hover:bg-[#152e4d] transition-all flex-1 shadow-md hover:-translate-y-1"
                >
                  تأكيد واعتماد الحجز
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm rtl" dir="rtl">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl relative border-t-4 border-red-500">
            <button onClick={() => setIsRejectModalOpen(false)} className="absolute top-4 left-4 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full w-8 h-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <h2 className="text-2xl font-headline font-black text-[#001e40] mb-2">رفض الطلب</h2>
            <p className="text-xs text-gray-500 font-bold mb-6">إلغاء حجز القاعة: <span className="text-red-500">{selectedRequest?.roomId}</span></p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#5a7698]">سبب الإلغاء (اختياري)</label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 resize-none outline-none font-bold text-sm" 
                  placeholder="الوقت غير متاح لتزامن محاضرة أخرى..." 
                  rows={3}
                ></textarea>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#5a7698]">غرفة بديلة أو موعد بديل مقترح (اختياري)</label>
                <input 
                  type="text"
                  value={alternativeSlot}
                  onChange={(e) => setAlternativeSlot(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none font-bold text-sm" 
                  placeholder="متاح غرفة A-108 بنفس التوقيت"
                />
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                <button 
                  onClick={submitReject}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex-1"
                >
                  إرسال الرفض وإشعار الموظف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
