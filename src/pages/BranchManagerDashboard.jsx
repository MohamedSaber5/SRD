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
  addDoc,
  setDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../utils/timeUtils';
import { usePopup } from '../contexts/PopupContext';
import EditBookingModal from '../components/bookings/EditBookingModal';

export default function BranchManagerDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rooms, setRooms] = useState({});
  const [isRamadanMode, setIsRamadanMode] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const { showAlert, showConfirm } = usePopup();

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
      // Sort: Urgent first, then by date (newest first)
      data.sort((a, b) => {
         if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
         if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
         return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
      });
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
      await setDoc(docRef, { isRamadanMode: newMode }, { merge: true });
      showAlert(newMode ? t('settings.ramadanEnabled') : t('settings.ramadanDisabled'), 'success');
    } catch (e) {
      console.error(e);
      showAlert(t('common.errorOccurred'), 'error');
    }
  };

  const handleApprove = async (id) => {
    showConfirm(t('branchManager.confirmApprove'), async () => {
      try {
        const docRef = doc(db, 'bookings', id);
        await updateDoc(docRef, {
          status: 'approved',
          branchApprovedAt: serverTimestamp()
        });

        // VIP Admin Notification
        const qAdmins = query(collection(db, 'users'), where('role', 'in', ['admin', 'super_admin']));
        const adminsSnap = await getDocs(qAdmins);
        const bookingInfo = requests.find(r => r.id === id);
        const notifyTasks = adminsSnap.docs.map(aDoc => addDoc(collection(db, 'notifications'), {
             userId: aDoc.id,
             title: t('notifications.vipConfirmTitle'),
             message: t('notifications.vipConfirmMessage', { roomId: bookingInfo?.roomId || id, name: bookingInfo?.responsibleName || '' }),
             type: 'vip_alert',
             bookingId: id,
             isRead: false,
             createdAt: serverTimestamp()
        }));
        await Promise.all(notifyTasks);

        showAlert(t('branchManager.approveSuccess'), 'success');
      } catch (e) {
        console.error(e);
        showAlert(t('common.errorOccurred'), 'error');
      }
    });
  };

  const handleEdit = (booking) => {
    setSelectedBooking(booking);
    setIsEditModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-700 text-right rtl:text-right ltr:text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary dark:text-blue-300 tracking-tight">
            {t('branchManager.title')}
          </h1>
          <p className="text-on-surface-variant dark:text-slate-400 mt-2 text-lg">
            {t('branchManager.subtitle')}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button 
            onClick={toggleRamadanMode}
            disabled={isSettingsLoading}
            className={`px-5 py-2.5 rounded-2xl flex items-center gap-3 font-bold transition-all shadow-sm border ${isRamadanMode ? 'bg-orange-500 text-white border-orange-600' : 'bg-surface-container-highest dark:bg-slate-800 text-on-surface dark:text-slate-200 border-surface-container-high dark:border-slate-700'}`}
          >
            <span className="material-symbols-outlined">{isRamadanMode ? 'ramadan_fasting' : 'schedule'}</span>
            {isRamadanMode ? t('branchManager.ramadanModeOn') : t('branchManager.ramadanModeOff')}
          </button>
          <div className="bg-secondary/10 dark:bg-blue-900/20 px-4 py-2 rounded-2xl flex items-center gap-2 border border-secondary/20 dark:border-blue-800/30 shadow-sm">
            <span className="material-symbols-outlined text-secondary dark:text-blue-400">verified_user</span>
            <span className="text-secondary dark:text-blue-400 font-bold">{t('branchManager.finalAuth')}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-surface-container-high dark:border-slate-800 flex flex-col min-h-[500px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-primary via-secondary to-primary dark:from-blue-600 dark:via-blue-400 dark:to-blue-600"></div>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-headline font-bold text-primary dark:text-blue-300 flex items-center gap-3">
              {t('branchManager.pendingRequests')}
              <span className="bg-primary/10 dark:bg-blue-900/30 text-primary dark:text-blue-300 px-3 py-1 rounded-full text-sm font-bold">{requests.length}</span>
            </h2>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1 italic">{t('branchManager.onlyMultiNote')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
          {requests.map(req => {
            const roomInfo = rooms[req.roomId];
            return (
              <div key={req.id} className="bg-surface-container-lowest dark:bg-slate-800 rounded-2xl p-6 border-2 border-surface-container-high dark:border-slate-700 hover:border-secondary/40 dark:hover:border-blue-500/40 transition-all shadow-sm hover:shadow-xl group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-secondary dark:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Header: Room Name & Details */}
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <div className="font-black text-primary dark:text-blue-300 text-2xl font-headline">
                      {roomInfo?.roomNumber || req.roomId}
                    </div>
                    {roomInfo && (
                      <div className="flex items-center gap-3 text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">
                        <span className="bg-surface-container-highest dark:bg-slate-700 px-2 py-1 rounded">{t('branchManager.building')} {roomInfo.building}</span>
                        <span className="bg-surface-container-highest dark:bg-slate-700 px-2 py-1 rounded">{t('branchManager.floor')} {roomInfo.floor}</span>
                        <span className="bg-secondary/20 dark:bg-blue-900/30 text-secondary dark:text-blue-300 px-2 py-1 rounded">{t('branchManager.capacity', { count: roomInfo.capacity })}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {req.priority === 'urgent' && (
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
                        {t('requests.urgent')}
                      </span>
                    )}
                    <span className="bg-primary/5 dark:bg-blue-900/20 text-primary dark:text-blue-400 border border-primary/20 dark:border-blue-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">{t('branchManager.awaitingFinal')}</span>
                  </div>
                </div>

                {/* Body: Date & Person */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-surface-container-low dark:bg-slate-900/50 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm text-primary dark:text-blue-400">
                      <span className="material-symbols-outlined">event</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold opacity-50 uppercase dark:text-slate-400">{t('booking.date')}</div>
                      <div className="text-sm font-black dark:text-white">{req.date}</div>
                    </div>
                  </div>
                  <div className="bg-surface-container-low dark:bg-slate-900/50 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm text-secondary dark:text-blue-400">
                      <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold opacity-50 uppercase dark:text-slate-400">{t('booking.time')}</div>
                      <div className="text-sm font-black ltr dark:text-white" dir="ltr">{formatTime(req.timeFrom)} - {formatTime(req.timeTo)}</div>
                    </div>
                  </div>
                  <div className="col-span-2 bg-surface-container-low dark:bg-slate-900/50 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm text-green-600 dark:text-green-400">
                      <span className="material-symbols-outlined">account_circle</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold opacity-50 uppercase dark:text-slate-400">{t('branchManager.applicant')}</div>
                      <div className="text-sm font-black dark:text-white">{req.responsibleName} <span className="text-xs font-medium opacity-60">({req.userName})</span></div>
                    </div>
                  </div>
                </div>

                {/* Purpose Snippet */}
                <div className="mb-8 space-y-3">
                  <div className="border-r-4 dark:border-l-4 dark:border-r-0 border-primary/20 dark:border-blue-500/30 pr-4 rtl:pr-4 ltr:pr-0 ltr:pl-4 py-2 bg-primary/5 dark:bg-blue-900/10 rounded-l-xl rtl:rounded-l-xl ltr:rounded-r-xl">
                      <div className="text-[10px] font-black text-primary dark:text-blue-300 uppercase mb-1">{t('requests.purpose')}:</div>
                      <p className="text-sm leading-relaxed text-on-surface dark:text-slate-200 font-medium italic">"{req.purpose}"</p>
                  </div>
                  
                  {(req.isHolidayEvent || req.isOfficialOccasion) && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-right-4">
                      {req.isHolidayEvent && (
                        <div className="bg-secondary/10 dark:bg-blue-900/20 text-secondary dark:text-blue-300 border border-secondary/20 dark:border-blue-800/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                           <span className="material-symbols-outlined text-[16px]">celebration</span>
                           {t('booking.isHoliday')}
                        </div>
                      )}
                      {req.isOfficialOccasion && (
                        <div className="bg-[#b58b4b]/10 dark:bg-amber-900/20 text-[#8b6a37] dark:text-amber-300 border border-[#b58b4b]/20 dark:border-amber-800/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                           <span className="material-symbols-outlined text-[16px]">stars</span>
                           {t('booking.isOfficial')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleApprove(req.id)} 
                    className="flex-1 bg-primary dark:bg-blue-600 text-white rounded-2xl py-3.5 text-sm font-black hover:bg-primary-container dark:hover:bg-blue-700 hover:scale-[1.02] transition-all shadow-[0_8px_20px_-8px_rgba(0,30,64,0.4)] flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">verified</span>
                    {t('branchManager.approveBtn')}
                  </button>
                  <button 
                    onClick={() => handleEdit(req)} 
                    className="bg-surface-container-highest dark:bg-slate-700 text-on-surface dark:text-slate-200 rounded-2xl px-6 py-3.5 text-sm font-black hover:bg-secondary/10 dark:hover:bg-blue-900/30 hover:text-secondary dark:hover:text-blue-300 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">edit_note</span>
                    {t('branchManager.editBtn')}
                  </button>
                </div>
              </div>
            );
          })}

          {!loading && requests.length === 0 && (
            <div className="col-span-full py-32 text-center flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
               <div className="w-24 h-24 bg-surface-container-high dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 dark:text-slate-500">assignment_turned_in</span>
               </div>
               <div>
                 <p className="text-2xl font-headline font-bold text-on-surface-variant dark:text-slate-300">{t('branchManager.allDone')}</p>
                 <p className="text-on-surface-variant/60 dark:text-slate-500 mt-1">{t('branchManager.noRequests')}</p>
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


    </div>
  );
}

 