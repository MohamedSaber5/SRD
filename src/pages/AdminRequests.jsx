import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePopup } from '../contexts/PopupContext';
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
import { useTranslation } from 'react-i18next';
import { REGULAR_SLOTS, RAMADAN_SLOTS } from '../hooks/useBookingForm';
import { formatTime } from '../utils/timeUtils';

export default function AdminRequests() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingRooms, setIsCheckingRooms] = useState(false);
  const [isRamadanMode, setIsRamadanMode] = useState(false);
  const { showAlert } = usePopup();
  
  // Rejection State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [suggestedRoomId, setSuggestedRoomId] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedSlotIndex, setSuggestedSlotIndex] = useState('');

  // Approval State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveSelectedRequest, setApproveSelectedRequest] = useState(null);
  const [approveRoomId, setApproveRoomId] = useState('');
  const [approvePriority, setApprovePriority] = useState('normal');

  // Details View State
  const [viewSelectedRequest, setViewSelectedRequest] = useState(null);

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

    const settingsUnsub = onSnapshot(doc(db, 'settings', 'system'), (doc) => {
      if (doc.exists()) {
        setIsRamadanMode(doc.data().isRamadanMode);
      }
    });

    return () => { unsubBookings(); unsubRooms(); settingsUnsub(); }
  }, []);

  const currentSlots = isRamadanMode ? RAMADAN_SLOTS : REGULAR_SLOTS;

  const handleApproveClick = async (req) => {
    setApproveSelectedRequest(req);
    setApprovePriority('normal');
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
      let freeRooms = roomsList.filter(r => !occupiedRoomIds.includes(r.id) && r.status !== 'unavailable');
      
      // Filter by requested room type (lecture vs multi) and capacity
      const requiredCap = Number(req.requiredCapacity) || 0;
      if (req.hallCategory === 'lecture' || req.roomType === 'fixed') {
        freeRooms = freeRooms.filter(r => r.type === 'fixed' && Number(r.capacity) >= requiredCap);
      } else if (req.hallCategory === 'multi' || req.roomType === 'multi') {
        freeRooms = freeRooms.filter(r => r.type === 'multi' && Number(r.capacity) >= requiredCap);
      }
      
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
        priority: approvePriority, // Set priority
        adminApprovedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (isMulti) {
        const managersQuery = query(collection(db, 'users'), where('role', '==', 'branch_manager'));
        const managersSnap = await getDocs(managersQuery);
        
        const notifyTasks = managersSnap.docs.map(mDoc => 
          addDoc(collection(db, 'notifications'), {
            userId: mDoc.id,
            title: t('notifications.managerActionTitle'),
            message: t('notifications.managerActionMessage', { roomId: approveRoomId }),
            type: 'manager_action',
            bookingId: approveSelectedRequest.id,
            isRead: false,
            createdAt: serverTimestamp()
          })
        );
        
        await Promise.all(notifyTasks);
        showAlert(t('requests.approveSuccessMulti'), 'success');
      } else {
        showAlert(t('requests.approveSuccessFixed'), 'success');
      }
      
      setIsApproveModalOpen(false);
      setApproveSelectedRequest(null);
    } catch (e) {
      console.error(e);
      showAlert(t('common.errorOccurred'), 'error');
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
      
      const suggestedSlot = suggestedSlotIndex !== '' ? currentSlots[suggestedSlotIndex] : null;
      
      const updateData = {
        status: 'rejected',
        rejectReason,
        suggestedRoomId,
        suggestedDate,
        suggestedTimeFrom: suggestedSlot?.from || '',
        suggestedTimeTo: suggestedSlot?.to || '',
        suggestedSlotLabel: suggestedSlot?.label || '',
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(bookingRef, updateData);

      let suggestionText = '';
      if (suggestedRoomId || suggestedDate || suggestedSlot) {
        suggestionText = ` ${t('requests.suggestedAlternative')}: `;
        suggestionText += suggestedRoomId ? `${t('roomManagement.room')} ${suggestedRoomId}` : '';
        suggestionText += suggestedDate ? ` ${t('common.day')} ${suggestedDate}` : '';
        suggestionText += suggestedSlot ? ` ${t('common.from')} ${suggestedSlot.from} ${t('common.to')} ${suggestedSlot.to}` : '';
      }

      // Employee VIP Notification for Rejection
      await addDoc(collection(db, 'notifications'), {
        userId: selectedRequest.userId,
        title: t('notifications.rejectionTitle'),
        message: t('notifications.rejectionMessage', { reason: rejectReason || t('dashboard.noReason'), suggestion: suggestionText }),
        type: 'rejection_alert',
        bookingId: selectedRequest.id,
        isRead: false,
        createdAt: serverTimestamp()
      });

      setIsRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
      setSuggestedRoomId('');
      setSuggestedDate('');
      setSuggestedSlotIndex('');
      showAlert(t('requests.rejectSuccess'), 'success');
    } catch (e) {
      console.error(e);
      showAlert(t('common.errorOccurred'), 'error');
    }
  };

  return (
    <div className="rtl" dir="rtl">
      <div className="flex items-center gap-4 mb-8 pt-8 px-4">
        <button onClick={() => navigate('/admin')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-[#1e3a5f] dark:text-blue-400">arrow_forward</span>
        </button>
        <div>
          <h1 className="text-4xl font-headline font-bold text-[#001e40] dark:text-white tracking-tight">{t('requests.title')}</h1>
          <p className="text-[#5a7698] dark:text-slate-400 mt-2 text-lg">{t('requests.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-slate-800 p-8 m-4 min-h-[500px]">
        {loading ? (
           <div className="flex justify-center py-20 text-blue-500">
             <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
           </div>
        ) : (
          <div className="space-y-6">
            {requests.map(req => (
              <div key={req.id} className="bg-[#fcfdff] dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-[#1e3a5f]/30 dark:hover:border-blue-500/30 hover:shadow-md transition-all relative overflow-hidden">
                {/* Priority stripe */}
                <div className={`absolute top-0 right-0 w-[5px] h-full rounded-l-full ${req.priority === 'urgent' ? 'bg-red-500' : 'bg-[#1e3a5f]'}`}></div>
                
                <div className="p-6 pr-8">
                  {/* Top row: Room ID + Status badges */}
                  <div className="flex justify-between items-start mb-5 flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-headline font-black text-[#001e40] dark:text-white text-2xl">{t('dashboard.dashboardOf')} {req.roomId}</span>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-bold ${req.status === 'awaiting_manager_final' ? 'bg-[#b58b4b] text-white' : 'bg-[#eef2f6] dark:bg-slate-700 text-[#5a7698] dark:text-slate-300'}`}>
                        {req.status === 'awaiting_manager_final' ? t('requests.statusWaitingManager') : t('requests.statusNew')}
                      </span>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-bold ${req.roomType === 'multi' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                        {req.roomType === 'multi' ? t('requests.hallMulti') : t('requests.hallLectures')}
                      </span>
                      {req.priority === 'urgent' && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
                          {t('requests.urgent')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-bold">
                      {req.createdAt ? new Date(req.createdAt.toDate()).toLocaleDateString('ar-EG') : ''}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                    
                    {/* Date & Time */}
                    <div className="bg-blue-50/60 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                      <div className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        {t('requests.dateTime')}
                      </div>
                      <div className="font-black text-[#001e40] dark:text-slate-200 text-sm">{req.date}</div>
                      <div className="font-bold text-blue-600 dark:text-blue-400 text-sm ltr" dir="ltr">{formatTime(req.timeFrom)} — {formatTime(req.timeTo)}</div>
                    </div>

                    {/* Responsible Person */}
                    <div className="bg-gray-50 dark:bg-slate-700/40 rounded-xl p-4 border border-gray-100 dark:border-slate-600/30">
                      <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        {t('requests.responsible')}
                      </div>
                      <div className="font-black text-[#001e40] dark:text-slate-200 text-sm">{req.responsibleName}</div>
                      <div className="font-bold text-[#5a7698] dark:text-slate-400 text-xs mt-0.5">{req.responsibleJob || t('dashboard.noReason')}</div>
                      <div className="font-bold text-gray-500 dark:text-slate-500 text-xs mt-0.5 ltr" dir="ltr">{req.responsibleMobile || '—'}</div>
                    </div>

                    {/* Capacity */}
                    <div className="bg-orange-50/60 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800/30">
                      <div className="text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">groups</span>
                        {t('requests.capacityType')}
                      </div>
                      <div className="font-black text-[#001e40] dark:text-slate-200 text-sm">
                        {req.requiredCapacity ? `${req.requiredCapacity} ${t('requests.submitter')}` : t('dashboard.noReason')}
                      </div>
                      <div className="font-bold text-orange-600 dark:text-orange-400 text-xs mt-0.5">
                        {req.hallCategory === 'multi' ? t('requests.hallMulti') : t('requests.hallLectures')}
                      </div>
                    </div>

                    {/* Purpose */}
                    <div className="bg-gray-50 dark:bg-slate-700/40 rounded-xl p-4 border border-gray-100 dark:border-slate-600/30 md:col-span-2 lg:col-span-2">
                      <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        {t('requests.purpose')}
                      </div>
                      <div className="font-bold text-[#001e40] dark:text-slate-200 italic text-sm leading-relaxed">"{req.purpose || t('dashboard.noReason')}"</div>
                    </div>

                    {/* Submitter */}
                    <div className="bg-gray-50 dark:bg-slate-700/40 rounded-xl p-4 border border-gray-100 dark:border-slate-600/30">
                      <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">badge</span>
                        {t('requests.submitter')}
                      </div>
                      <div className="font-black text-[#001e40] dark:text-slate-200 text-sm">{req.userName}</div>
                      <div className="font-bold text-[#5a7698] dark:text-slate-400 text-xs mt-0.5">{req.college || '—'}</div>
                      <div className="font-bold text-gray-400 dark:text-slate-500 text-xs">{req.userRole}</div>
                    </div>
                  </div>

                  {/* Equipment Row */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {req.reqMic && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">mic</span>
                        {t('requests.mic')} ({req.reqMicQty})
                      </span>
                    )}
                    {req.reqLaptop && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">laptop_mac</span>
                        {t('requests.laptop')}
                      </span>
                    )}
                    {req.reqVideoConf && (
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">video_camera_front</span>
                        {t('requests.videoConf')}
                      </span>
                    )}
                    {req.reqOther && (
                      <span className="px-3 py-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-lg">
                        {t('requests.other')}: {req.reqOtherDetails}
                      </span>
                    )}
                    {req.isHolidayEvent && (
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">celebration</span>
                        {t('requests.holiday')}
                      </span>
                    )}
                    {req.isOfficialOccasion && (
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-bold rounded-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">stars</span>
                        {t('requests.officialOccasion')}
                      </span>
                    )}
                    {!req.reqMic && !req.reqLaptop && !req.reqVideoConf && !req.reqOther && !req.isHolidayEvent && !req.isOfficialOccasion && (
                      <span className="text-xs text-gray-400 dark:text-slate-500 font-bold italic">{t('requests.noExtraRequirements')}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    {req.status === 'pending' ? (
                      <>
                        <button onClick={() => handleApproveClick(req)} className="flex-1 bg-[#1e3a5f] dark:bg-blue-600 text-white rounded-xl py-3 text-sm font-black shadow-md hover:-translate-y-[2px] transition-transform flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-sm">task_alt</span>
                          {t('requests.approveBtn')}
                        </button>
                        <button onClick={() => handleRejectClick(req)} className="flex-1 bg-white dark:bg-slate-800 text-[#001e40] dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl py-3 text-sm font-black hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          {t('requests.rejectBtn')}
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 text-center py-3 bg-[#fbf0dd]/50 dark:bg-orange-900/10 text-[#b58b4b] dark:text-orange-300 text-sm font-black rounded-xl border border-[rgba(181,139,75,0.2)] dark:border-orange-800/30 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">forward</span>
                        {t('requests.forwarded')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {requests.length === 0 && (
               <div className="col-span-full text-center py-24 opacity-30 flex flex-col items-center">
                 <span className="material-symbols-outlined text-6xl mb-4 text-[#001e40] dark:text-white">task_alt</span>
                 <p className="font-bold text-[#001e40] dark:text-white text-xl">{t('requests.noRequests')}</p>
               </div>
            )}
          </div>
        )}
      </div>

      
      {/* Approve & Allocate Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm rtl" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl relative border-t-4 border-[#1e3a5f] dark:border-blue-600">
            <button onClick={() => setIsApproveModalOpen(false)} className="absolute top-4 left-4 text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <h2 className="text-2xl font-headline font-black text-[#001e40] dark:text-white mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">task_alt</span>
              {t('requests.modalApproveTitle')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-bold mb-6">{t('requests.modalApproveDesc')}</p>

            <div className="space-y-4">
               
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl mb-4 border border-gray-100 dark:border-slate-700 flex gap-4 text-sm font-bold text-[#5a7698] dark:text-slate-300">
                 <div className="flex-1">
                    <span className="block text-[10px] uppercase opacity-60">{t('requests.dateTime')}</span>
                    <span className="text-[#001e40] dark:text-slate-200">{approveSelectedRequest?.date} | {approveSelectedRequest?.timeFrom}</span>
                 </div>
                 <div className="flex-1">
                    <span className="block text-[10px] uppercase opacity-60">{t('requests.submitter')}</span>
                    <span className="text-[#001e40] dark:text-slate-200">{approveSelectedRequest?.responsibleName}</span>
                 </div>
                 <div className="flex-1">
                    <span className="block text-[10px] uppercase opacity-60">{t('requests.capacityType')}</span>
                    <span className="text-[#001e40] dark:text-slate-200">{approveSelectedRequest?.requiredCapacity || t('dashboard.noReason')}</span>
                 </div>
              </div>

              {(approveSelectedRequest?.roomType === 'multi' || approveSelectedRequest?.hallCategory === 'multi') && (
                <div className="space-y-2 mt-4">
                  <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400">{t('requests.urgent')}</label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${approvePriority === 'urgent' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                    <input 
                      type="checkbox" 
                      checked={approvePriority === 'urgent'} 
                      onChange={(e) => setApprovePriority(e.target.checked ? 'urgent' : 'normal')} 
                      className="w-5 h-5 accent-red-500 cursor-pointer" 
                    />
                    <span className="material-symbols-outlined text-xl">local_fire_department</span>
                    <span className="font-bold text-sm">{t('requests.urgent')}</span>
                  </label>
                </div>
              )}

              <div className="space-y-2 mt-4">
                <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400">{t('requests.suggestedRoom')}</label>
                 <select 
                    value={approveRoomId}
                    onChange={e => setApproveRoomId(e.target.value)}
                    className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-200 focus:ring-2 focus:ring-[#1e3a5f] dark:focus:ring-blue-600 font-bold outline-none"
                    disabled={isCheckingRooms || availableRooms.length === 0}
                 >
                    {isCheckingRooms ? (
                       <option value="">{t('common.checkingAvailability')}...</option>
                    ) : availableRooms.length === 0 ? (
                       <option value="">{t('common.noRoomsAvailable')}</option>
                    ) : (
                       availableRooms.map(r => (
                          <option key={r.id} value={r.id}>
                             {r.roomNumber} ({r.type === 'multi' ? t('requests.hallMulti') : t('requests.hallLectures')}) - {t('roomManagement.capacityLabel')}: {r.capacity}
                          </option>
                       ))
                    )}
                 </select>
                 <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">* {t('requests.roomsAvailabilityNote')}</p>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                <button 
                  onClick={submitApprove}
                  className="px-6 py-3 bg-[#1e3a5f] dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-[#152e4d] dark:hover:bg-blue-700 transition-all flex-1 shadow-md hover:-translate-y-1"
                >
                  {t('requests.confirmApprove')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm rtl" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl relative border-t-4 border-red-500">
            <button onClick={() => setIsRejectModalOpen(false)} className="absolute top-4 left-4 text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <h2 className="text-2xl font-headline font-black text-[#001e40] dark:text-white mb-2">{t('requests.modalRejectTitle')}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-bold mb-6">{t('requests.modalRejectDesc')}: <span className="text-red-500">{selectedRequest?.roomId}</span></p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400">{t('requests.rejectReason')}</label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 resize-none outline-none font-bold text-sm text-[#001e40] dark:text-slate-200" 
                  placeholder={t('requests.rejectReasonPlaceholder')} 
                  rows={3}
                ></textarea>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-[#001e40] dark:text-slate-200">{t('requests.suggestedTitle')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400">{t('requests.suggestedRoom')}</label>
                     <select 
                       value={suggestedRoomId}
                       onChange={e => setSuggestedRoomId(e.target.value)}
                       className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-red-500 appearance-none text-[#001e40] dark:text-slate-200"
                     >
                       <option value="">{t('dashboard.noReason')}</option>
                       {roomsList.filter(r => r.status !== 'unavailable').map(r => (
                         <option key={r.id} value={r.id}>{r.roomNumber}</option>
                       ))}
                     </select>
                   </div>
                   
                   <div className="space-y-2">
                     <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400">{t('requests.suggestedDate')}</label>
                     <input 
                        type="date"
                        value={suggestedDate}
                        onChange={e => setSuggestedDate(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-right font-bold text-sm outline-none focus:ring-2 focus:ring-red-500 text-[#001e40] dark:text-slate-200"
                     />
                   </div>
                   
                   <div className="col-span-1 md:col-span-2 space-y-2">
                     <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400">{t('requests.suggestedTime')}</label>
                     <select 
                        value={suggestedSlotIndex}
                        onChange={e => setSuggestedSlotIndex(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-red-500 appearance-none text-[#001e40] dark:text-slate-200"
                     >
                        <option value="">{t('dashboard.noReason')}</option>
                        {currentSlots.map((s, idx) => (
                          <option key={idx} value={idx}>{s.label}</option>
                        ))}
                     </select>
                   </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                <button 
                  onClick={submitReject}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex-1"
                >
                  {t('requests.confirmReject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewSelectedRequest && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm rtl" dir="rtl" onClick={() => setViewSelectedRequest(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewSelectedRequest(null)} className="absolute top-6 left-6 text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <h2 className="text-2xl font-headline font-black text-[#001e40] dark:text-white mb-6 border-b dark:border-slate-800 pb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">info</span>
              {t('requests.detailsTitle')}
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                 <div className="text-xs text-gray-500 dark:text-slate-400 font-bold mb-1">{t('requests.dateTime')}</div>
                 <div className="font-black text-[#001e40] dark:text-slate-200">{viewSelectedRequest.date}</div>
                 <div className="text-sm font-bold text-blue-600 dark:text-blue-400 ltr text-right" dir="ltr">{viewSelectedRequest.timeFrom} - {viewSelectedRequest.timeTo}</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                 <div className="text-xs text-gray-500 dark:text-slate-400 font-bold mb-1">{t('requests.responsible')}</div>
                 <div className="font-black text-[#001e40] dark:text-slate-200">{viewSelectedRequest.responsibleName}</div>
                 <div className="text-sm font-bold text-[#5a7698] dark:text-slate-400">{viewSelectedRequest.responsibleJob}</div>
                 <div className="text-xs font-bold text-gray-400 dark:text-slate-500 mt-1" dir="ltr">{viewSelectedRequest.responsibleMobile}</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                 <div className="text-xs text-gray-500 dark:text-slate-400 font-bold mb-1">{t('requests.capacityType')}</div>
                 <div className="font-black text-[#001e40] dark:text-slate-200">{viewSelectedRequest.roomId} ({viewSelectedRequest.roomType === 'multi' ? t('requests.hallMulti') : t('requests.hallLectures')})</div>
                 <div className="text-sm font-bold text-orange-600 dark:text-orange-400">{t('requests.capacityType')}: {viewSelectedRequest.requiredCapacity || t('dashboard.noReason')}</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                 <div className="text-xs text-gray-500 dark:text-slate-400 font-bold mb-1">{t('requests.submitter')}</div>
                 <div className="font-black text-[#001e40] dark:text-slate-200">{viewSelectedRequest.userName}</div>
                 <div className="text-sm font-bold text-[#5a7698] dark:text-slate-400">{viewSelectedRequest.userRole}</div>
                 <div className="text-xs font-bold text-gray-400 dark:text-slate-500">{viewSelectedRequest.college}</div>
              </div>
              <div className="col-span-2 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                 <div className="text-xs text-blue-500 dark:text-blue-400 font-bold mb-1">{t('requests.purpose')}</div>
                 <div className="font-bold text-[#001e40] dark:text-slate-200 italic">"{viewSelectedRequest.purpose}"</div>
              </div>
              <div className="col-span-2 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 text-right">
                 <div className="text-xs text-gray-500 dark:text-slate-400 font-bold mb-2">{t('requests.technicalRequirements')}</div>
                 <div className="flex flex-wrap gap-2">
                    {viewSelectedRequest.reqMic && <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold rounded-lg flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mic</span> {t('requests.mic')} ({viewSelectedRequest.reqMicQty})</span>}
                    {viewSelectedRequest.reqLaptop && <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">laptop_mac</span> {t('requests.laptop')}</span>}
                    {viewSelectedRequest.reqVideoConf && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">video_camera_front</span> {t('requests.videoConf')}</span>}
                    {viewSelectedRequest.reqOther && <span className="px-3 py-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-lg">{t('requests.other')}: {viewSelectedRequest.reqOtherDetails}</span>}
                    {!viewSelectedRequest.reqMic && !viewSelectedRequest.reqLaptop && !viewSelectedRequest.reqVideoConf && !viewSelectedRequest.reqOther && <span className="text-sm font-bold text-gray-400 dark:text-slate-500">{t('requests.noExtraRequirements')}</span>}
                 </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <button onClick={() => setViewSelectedRequest(null)} className="px-8 py-3 bg-[#001e40] dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-[#1e3a5f] dark:hover:bg-blue-700 transition-all">{t('requests.closeDetails')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
