import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  getDocs,
  orderBy,
  addDoc
} from 'firebase/firestore';
import EditBookingModal from '../components/bookings/EditBookingModal';

export default function BranchManagerDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rooms, setRooms] = useState({});
  const [isRamadanMode, setIsRamadanMode] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    // 1. Fetch multi-purpose rooms metadata once
    const fetchRooms = async () => {
      const qRooms = query(collection(db, 'rooms'), where('type', '==', 'multi'));
      const snap = await getDocs(qRooms);
      const roomsMap = {};
      snap.docs.forEach(d => {
        roomsMap[d.id] = d.data();
      });
      setRooms(roomsMap);
    };
    fetchRooms();

    // 2. Listen to pending multi-purpose bookings
    const q = query(
      collection(db, 'bookings'), 
      where('roomType', '==', 'multi'),
      where('status', '==', 'awaiting_manager_final')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(data);
      setLoading(false);
    });

    // 3. Listen to system settings (Ramadan Mode)
    const settingsUnsubscribe = onSnapshot(doc(db, 'settings', 'system'), (doc) => {
      if (doc.exists()) {
        setIsRamadanMode(doc.data().isRamadanMode);
      }
      setIsSettingsLoading(false);
    });

    // 4. Fetch Audit Logs for activity tracking
    const qAudit = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
    const auditUnsubscribe = onSnapshot(qAudit, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAuditLogs(logs);
    });

    return () => {
      unsubscribe();
      settingsUnsubscribe();
      auditUnsubscribe();
    };
  }, []);

  const toggleRamadanMode = async () => {
    try {
      const newMode = !isRamadanMode;
      const docRef = doc(db, 'settings', 'system');
      await updateDoc(docRef, { isRamadanMode: newMode });
      alert(newMode ? 'تم تفعيل وضع رمضان للنظام بالكامل' : 'تم العودة للمواعيد العادية');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تحديث الإعدادات');
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('هل أنت متأكد من اعتماد هذا الحجز؟')) return;
    try {
      const docRef = doc(db, 'bookings', id);
      await updateDoc(docRef, {
        status: 'approved',
        branchApprovedAt: serverTimestamp()
      });

      // VIP Admin Notification
      const qAdmins = query(collection(db, 'users'), where('role', 'in', ['admin', 'super_admin'])); // support for admin role
      const adminsSnap = await getDocs(qAdmins);
      const bookingInfo = requests.find(r => r.id === id);
      const notifyTasks = adminsSnap.docs.map(aDoc => addDoc(collection(db, 'notifications'), {
           userId: aDoc.id,
           title: 'تأكيد حجز متعدد الأغراض',
           message: `قام مدير الفرع بالموافقة النهائية على حجز القاعة (${bookingInfo?.roomId || id}) الخاص بـ ${bookingInfo?.responsibleName || ''}`,
           type: 'vip_alert',
           bookingId: id,
           isRead: false,
           createdAt: serverTimestamp()
      }));
      await Promise.all(notifyTasks);

      alert('تم منح الاعتماد النهائي للطلب بنجاح');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الاعتماد');
    }
  };

  const handleEdit = (booking) => {
    setSelectedBooking(booking);
    setIsEditModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">اعتمادات مدير الفرع</h1>
          <p className="text-on-surface-variant mt-2 text-lg">مراجعة واعتماد طلبات القاعات متعددة الأغراض</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button 
            onClick={toggleRamadanMode}
            disabled={isSettingsLoading}
            className={`px-5 py-2.5 rounded-2xl flex items-center gap-3 font-bold transition-all shadow-sm border ${isRamadanMode ? 'bg-orange-500 text-white border-orange-600' : 'bg-surface-container-highest text-on-surface border-surface-container-high'}`}
          >
            <span className="material-symbols-outlined">{isRamadanMode ? 'ramadan_fasting' : 'schedule'}</span>
            {isRamadanMode ? 'وضع رمضان: مفعّل' : 'تفعيل وضع رمضان'}
          </button>
          <div className="bg-secondary/10 px-4 py-2 rounded-2xl flex items-center gap-2 border border-secondary/20 shadow-sm">
            <span className="material-symbols-outlined text-secondary">verified_user</span>
            <span className="text-secondary font-bold">صلاحية الاعتماد النهائي</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-surface-container-high flex flex-col min-h-[500px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-primary via-secondary to-primary"></div>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-3">
              الطلبات المعلقة 
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">{requests.length}</span>
            </h2>
            <p className="text-sm text-on-surface-variant mt-1 italic">يظهر هنا فقط حجوزات القاعات متعددة الأغراض</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
          {requests.map(req => {
            const roomInfo = rooms[req.roomId];
            return (
              <div key={req.id} className="bg-surface-container-lowest rounded-2xl p-6 border-2 border-surface-container-high hover:border-secondary/40 transition-all shadow-sm hover:shadow-xl group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Header: Room Name & Details */}
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <div className="font-black text-primary text-2xl font-headline">
                      {roomInfo?.roomNumber || req.roomId}
                    </div>
                    {roomInfo && (
                      <div className="flex items-center gap-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        <span className="bg-surface-container-highest px-2 py-1 rounded">مبنى {roomInfo.building}</span>
                        <span className="bg-surface-container-highest px-2 py-1 rounded">الدور {roomInfo.floor}</span>
                        <span className="bg-secondary/20 text-secondary px-2 py-1 rounded">سعة {roomInfo.capacity} فرداً</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-primary/5 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">بانتظار الاعتماد النهائي</span>
                  </div>
                </div>

                {/* Body: Date & Person */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm text-primary">
                      <span className="material-symbols-outlined">event</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold opacity-50 uppercase">التاريخ</div>
                      <div className="text-sm font-black">{req.date}</div>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm text-secondary">
                      <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold opacity-50 uppercase">الوقت</div>
                      <div className="text-sm font-black ltr" dir="ltr">{req.timeFrom} - {req.timeTo}</div>
                    </div>
                  </div>
                  <div className="col-span-2 bg-surface-container-low p-3 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm text-green-600">
                      <span className="material-symbols-outlined">account_circle</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold opacity-50 uppercase">مقدم الطلب</div>
                      <div className="text-sm font-black">{req.responsibleName} <span className="text-xs font-medium opacity-60">({req.userName})</span></div>
                    </div>
                  </div>
                </div>

                {/* Purpose Snippet */}
                <div className="mb-8 space-y-3">
                  <div className="border-r-4 border-primary/20 pr-4 py-2 bg-primary/5 rounded-l-xl">
                      <div className="text-[10px] font-black text-primary uppercase mb-1">الغرض من الاستخدام:</div>
                      <p className="text-sm leading-relaxed text-on-surface font-medium italic">"{req.purpose}"</p>
                  </div>
                  
                  {(req.isHolidayEvent || req.isOfficialOccasion) && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-right-4">
                      {req.isHolidayEvent && (
                        <div className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                           <span className="material-symbols-outlined text-[16px]">celebration</span>
                           عطلة / نهاية الأسبوع
                        </div>
                      )}
                      {req.isOfficialOccasion && (
                        <div className="bg-[#b58b4b]/10 text-[#8b6a37] border border-[#b58b4b]/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                           <span className="material-symbols-outlined text-[16px]">stars</span>
                           مناسبة رسمية ذات أولوية
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleApprove(req.id)} 
                    className="flex-1 bg-primary text-white rounded-2xl py-3.5 text-sm font-black hover:bg-primary-container hover:scale-[1.02] transition-all shadow-[0_8px_20px_-8px_rgba(0,30,64,0.4)] flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">verified</span>
                    اعتماد الطلب
                  </button>
                  <button 
                    onClick={() => handleEdit(req)} 
                    className="bg-surface-container-highest text-on-surface rounded-2xl px-6 py-3.5 text-sm font-black hover:bg-secondary/10 hover:text-secondary transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">edit_note</span>
                    تعديل
                  </button>
                </div>
              </div>
            );
          })}

          {!loading && requests.length === 0 && (
            <div className="col-span-full py-32 text-center flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
               <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">assignment_turned_in</span>
               </div>
               <div>
                 <p className="text-2xl font-headline font-bold text-on-surface-variant">جميع المهمات مكتملة!</p>
                 <p className="text-on-surface-variant/60 mt-1">لا توجد طلبات قاعات متعددة الأغراض بانتظارك حالياً.</p>
               </div>
            </div>
          )}
        </div>
      </div>

      <EditBookingModal 
        booking={selectedBooking} 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onUpdate={() => {/* Re-fetch handled by onSnapshot */}} 
      />

      {/* Audit Logs Section */}
      <div className="mt-12 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[400px]">
         <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-2xl font-headline font-black text-[#001e40] flex items-center gap-3">
                <span className="material-symbols-outlined text-[#b58b4b] text-[32px]">history_edu</span>
                سجل النشاط والصلاحيات (Audit Logs)
              </h2>
              <p className="text-sm font-bold text-gray-500 mt-1">مراقبة دقيقة لكل تحركات مدراء النظام والسكرتارية لتحديد المسؤوليات.</p>
            </div>
         </div>

         <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            {auditLogs.length > 0 ? auditLogs.map((log, index) => (
               <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                     <span className="material-symbols-outlined text-[18px]">
                        {log.actionType === 'REQUEST_BOOKING' ? 'bookmark_added' : log.actionType === 'DELEGATE_ADMIN' ? 'admin_panel_settings' : 'badge'}
                     </span>
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-800 text-sm bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                          {log.actionByName || log.actionBy}
                        </span>
                        <time className="text-xs font-bold text-gray-400">
                          {log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString('ar-EG') : 'الآن'}
                        </time>
                     </div>
                     <p className="text-[#1e3a5f] font-black text-sm leading-relaxed mb-1">
                        {log.actionType === 'REQUEST_BOOKING' ? 'طلب حجز قاعة' : log.actionType === 'DELEGATE_ADMIN' ? 'منح تفويض أدمن مؤقت' : log.actionType === 'ASSIGN_SECRETARY' ? 'تعيين سكرتير كلية' : 'إجراء إداري'}
                     </p>
                     <p className="text-gray-500 font-medium text-xs leading-relaxed">
                        {log.details}
                     </p>
                  </div>
               </div>
            )) : (
              <div className="text-center py-10 text-gray-400 font-bold">
                 لا توجد سجلات نشاط مسجلة حتى الآن.
              </div>
            )}
         </div>
      </div>
    </div>
  );
}

 