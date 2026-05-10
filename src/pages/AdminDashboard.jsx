import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  orderBy,
  writeBatch,
  serverTimestamp,
  where,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePopup } from '../contexts/PopupContext';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRamadanMode, setIsRamadanMode] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const { showAlert, showConfirm } = usePopup();

  // 16-Week Fixed Lecture State
  const [isFixedLectureModalOpen, setIsFixedLectureModalOpen] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  
  // Empty Rooms Search State
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTime, setSearchTime] = useState('08:00');
  const [searchRoomType, setSearchRoomType] = useState('all');
  const [emptyRoomsResult, setEmptyRoomsResult] = useState(null);

  const [fixedLectureData, setFixedLectureData] = useState({
    roomId: '',
    responsibleName: '',
    courseName: '',
    startDate: new Date().toISOString().split('T')[0],
    timeFrom: '08:00',
    timeTo: '10:00',
    dayOfWeek: 1, // 0=Sunday
  });



  const weekDays = [
    t('common.days.saturday'), 
    t('common.days.sunday'), 
    t('common.days.monday'), 
    t('common.days.tuesday'), 
    t('common.days.wednesday'), 
    t('common.days.thursday'), 
    t('common.days.friday')
  ];
  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00'];

  const cardThemes = [
    { bg: 'bg-[#eef2f6]', border: 'border-[#1e3a5f]', textP: 'text-[#1e3a5f]', textS: 'text-[#5a7698]' },
    { bg: 'bg-[#fbf0dd]', border: 'border-[#b58b4b]', textP: 'text-[#4a3615]', textS: 'text-[#8b6a37]' },
    { bg: 'bg-[#e7e8eb]', border: 'border-[#1e232b]', textP: 'text-[#1e232b]', textS: 'text-[#555b63]' }
  ];

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const dayIndex = date.getDay();
    // In JS, 0=Sunday, 1=Monday...
    // The weekDays array starts with Saturday? No, let's look at weekDays.
    // weekDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    const days = [
      t('common.days.sunday', 'الأحد'), 
      t('common.days.monday', 'الإثنين'), 
      t('common.days.tuesday', 'الثلاثاء'), 
      t('common.days.wednesday', 'الأربعاء'), 
      t('common.days.thursday', 'الخميس'), 
      t('common.days.friday', 'الجمعة'), 
      t('common.days.saturday', 'السبت')
    ];
    return days[dayIndex];
  };

  const getDayIndexFromName = (dayName) => {
    const days = [
      t('common.days.sunday', 'الأحد'), 
      t('common.days.monday', 'الإثنين'), 
      t('common.days.tuesday', 'الثلاثاء'), 
      t('common.days.wednesday', 'الأربعاء'), 
      t('common.days.thursday', 'الخميس'), 
      t('common.days.friday', 'الجمعة'), 
      t('common.days.saturday', 'السبت')
    ];
    return days.indexOf(dayName);
  };

  const getGridBooking = (dayName, timeFrom) => {
    return bookings.find(b =>
      b.status === 'approved' &&
      b.timeFrom === timeFrom &&
      getDayName(b.date) === dayName
    );
  };

  const openModalForCell = (dayName, timeStr) => {
    const dayIndex = getDayIndexFromName(dayName);
    const slotIndex = timeSlots.indexOf(timeStr);
    const endTime = timeSlots[slotIndex + 1] || '18:00';
    setFixedLectureData({
      roomId: '',
      responsibleName: '',
      courseName: '',
      startDate: new Date().toISOString().split('T')[0],
      dayOfWeek: dayIndex,
      timeFrom: timeStr,
      timeTo: endTime
    });
    setIsFixedLectureModalOpen(true);
  };

  const toggleRamadanMode = async () => {
    try {
      const newMode = !isRamadanMode;
      await setDoc(doc(db, 'settings', 'system'), { isRamadanMode: newMode }, { merge: true });
      showAlert(newMode ? t('settings.ramadanEnabled') : t('settings.ramadanDisabled'), 'success');
    } catch (e) {
      console.error(e);
      showAlert(t('common.errorOccurred'), 'error');
    }
  };

  const handlePrintMorningReport = () => {
    window.print();
  };

  const submitFixedLecture = async (e) => {
    e.preventDefault();
    if (!fixedLectureData.roomId || !fixedLectureData.startDate || !fixedLectureData.responsibleName || !fixedLectureData.courseName) {
      showAlert(t('admin.fillRequiredFields'), 'warning');
      return;
    }
    showConfirm(t('admin.confirmBatchCreation', { roomId: fixedLectureData.roomId }), async () => {
      try {
        setIsSyncing(true);
        const batch = writeBatch(db);
        const startDateTime = new Date(fixedLectureData.startDate);
        const currentDay = startDateTime.getDay();
        const diff = fixedLectureData.dayOfWeek - currentDay;
        startDateTime.setDate(startDateTime.getDate() + diff);
        for (let i = 0; i < 16; i++) {
          const lectureDate = new Date(startDateTime.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
          const formattedDate = lectureDate.toISOString().split('T')[0];
          const newDocRef = doc(collection(db, 'bookings'));
          batch.set(newDocRef, {
            roomId: fixedLectureData.roomId,
            roomType: 'fixed',
            date: formattedDate,
            timeFrom: fixedLectureData.timeFrom,
            timeTo: fixedLectureData.timeTo,
            responsibleName: fixedLectureData.responsibleName,
            courseName: fixedLectureData.courseName,
            userId: currentUser?.uid || 'admin',
            status: 'approved',
            is16WeekFixed: true,
            weekNumber: i + 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        await batch.commit();
        setIsFixedLectureModalOpen(false);
        setFixedLectureData({ roomId: '', responsibleName: '', courseName: '', startDate: new Date().toISOString().split('T')[0], timeFrom: '08:00', timeTo: '10:00', dayOfWeek: 0 });
        showAlert(t('admin.batchSuccess'), 'success');
      } catch (err) {
        console.error(err);
        showAlert(t('common.errorOccurred'), 'error');
      } finally {
        setIsSyncing(false);
      }
    });
  };

  useEffect(() => {
    const qBookings = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setBookings(data);
      setLoading(false);
    });
    const qRooms = query(collection(db, 'rooms'));
    const unsubRooms = onSnapshot(qRooms, (snapshot) => {
      setRoomsList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubSettings = onSnapshot(doc(db, 'settings', 'system'), (docSnap) => {
      if (docSnap.exists()) setIsRamadanMode(!!docSnap.data().isRamadanMode);
      setIsSettingsLoading(false);
    });
    return () => { unsubBookings(); unsubRooms(); unsubSettings(); };
  }, []);

  const todayDateStr = new Date().toISOString().split('T')[0];

  const morningReportEvents = bookings.filter(b =>
    b.date === todayDateStr &&
    (b.status === 'approved' || b.status === 'approved_by_branch') &&
    (!b.is16WeekFixed || b.roomType === 'multi')
  ).sort((a, b) => a.timeFrom.localeCompare(b.timeFrom));

  const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'awaiting_manager_final').length;
  const acceptedTodayCount = bookings.filter(b => b.status === 'approved' && b.date === todayDateStr).length;

  return (
    <>
      <div className="print-hidden w-full h-full pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 rtl pt-8 px-4">
          <div className="text-right rtl:text-right ltr:text-left">
            <h1 className="text-4xl font-headline font-bold text-[#001e40] dark:text-blue-300 tracking-tight">{t('admin.title')}</h1>
            <p className="text-[#5a7698] dark:text-slate-400 mt-2 text-lg">{t('admin.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0 justify-end">

            <button 
              onClick={() => navigate('/admin/requests')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 dark:from-orange-600 dark:to-orange-800 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2 relative"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              {t('admin.pendingRequests')}
              {pendingCount > 0 && (
                 <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs animate-bounce shadow-md">
                   {pendingCount}
                 </span>
              )}
            </button>
            <button 
              onClick={handlePrintMorningReport}
              className="px-5 py-2.5 rounded-xl bg-[#001e40] dark:bg-blue-800 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">summarize</span>
              {t('admin.morningReport')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 px-4 text-right rtl:text-right ltr:text-left">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-[#eef2f6] dark:bg-blue-900/30 text-[#1e3a5f] dark:text-blue-300 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">book_online</span>
              </div>
              <span className="bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold font-headline">{t('dashboard.status.approved')}</span>
            </div>
            <div className="relative z-10">
              <div className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-1">{t('admin.acceptedToday')}</div>
              <div className="text-4xl font-headline font-black text-[#001e40] dark:text-slate-100">{acceptedTodayCount}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-[#fbf0dd] dark:bg-[#b58b4b]/20 text-[#b58b4b] dark:text-[#d4af37] rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">pending_actions</span>
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-1">{t('admin.waitingRequests')}</div>
              <div className="text-4xl font-headline font-black text-[#5a7698] dark:text-slate-300">{pendingCount}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 px-4 rtl" dir="rtl">
          
          {/* Weekly View - Beautiful CSS Grid Implementation mapping 7 Days */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-slate-800 p-8 w-full">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-slate-800 pb-4">
              <h2 className="text-3xl font-headline font-black text-[#001e40] dark:text-blue-300">{t('admin.weeklySchedule')}</h2>
              <div className="flex items-center gap-4 text-[#5a7698] dark:text-slate-400 font-bold">
                <span className="material-symbols-outlined cursor-pointer hover:text-black dark:hover:text-white">chevron_right</span>
                <span>{new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}</span>
                <span className="material-symbols-outlined cursor-pointer hover:text-black dark:hover:text-white">chevron_left</span>
              </div>
            </div>
            
            <div className="overflow-x-auto pb-6 custom-scrollbar">
              <div className="min-w-[1000px]">
                
                {/* Header Row (Days) */}
                <div className="grid grid-cols-8 text-center text-sm font-bold text-[#5a7698] dark:text-slate-400 mb-6">
                  <div /* Placeholder for Time Col */>{t('common.time', 'الوقت')}</div>
                  {weekDays.map((day, idx) => (
                    <div key={day} className="pb-4 border-b border-gray-200 dark:border-slate-700">
                      {t(`common.days.${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][(idx + 6) % 7]}`, day)}
                    </div>
                  ))}
                </div>

                {/* Time Rows */}
                <div className="space-y-0 relative">
                  {timeSlots.map((time, rowIdx) => (
                    <div key={time} className="grid grid-cols-8 text-center h-[100px] border-b border-gray-100 dark:border-slate-800 relative group">
                      
                      {/* Time cell on the right */}
                      <div className="flex items-center justify-center text-sm font-bold text-[#5a7698] dark:text-slate-400 px-2 h-full border-l border-gray-100 dark:border-slate-800">
                        {time} {parseInt(time) < 12 ? t('common.am', 'ص') : t('common.pm', 'م')}
                      </div>

                      {/* Day Cells mapping */}
                      {weekDays.map((day, colIdx) => {
                        const booking = getGridBooking(day, time);
                        let theme = cardThemes[Math.abs(booking?.roomId?.charCodeAt(0) + colIdx + rowIdx) % cardThemes.length];
                        if (booking?.is16WeekFixed) theme = cardThemes[0]; 
                        else if (booking?.roomType === 'multi') theme = cardThemes[1];

                        return (
                          <div key={`${day}-${time}`} className="relative h-full flex items-center justify-center p-[6px] border-l border-dashed border-gray-100 dark:border-slate-800 last:border-l-0">
                            {booking ? (
                              <div className={`w-full h-full rounded-[0.7rem] ${theme.bg} ${theme.border} dark:bg-slate-800 dark:border-slate-700 border-r-[6px] flex flex-col justify-center items-center shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all cursor-pointer relative`}>
                                <div className={`font-headline font-black text-[15px] ${theme.textP} dark:text-slate-100 leading-tight`}>
                                  {booking.roomType === 'multi' ? '' : t('admin.room', 'قاعة')} {booking.roomId}
                                </div>
                                <div className={`text-[11px] font-bold mt-1 ${theme.textS} dark:text-slate-400 text-center leading-tight px-1`}>
                                  {booking.courseName || (booking.is16WeekFixed ? t('admin.fixedLecture', 'محاضرة ثابتة') : t('admin.normalBooking', 'حجز اعتيادي'))}
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={() => openModalForCell(day, time)} 
                                className="w-full h-full rounded-[0.7rem] hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 border-transparent hover:border-dashed hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100 transition-all text-blue-400 group"
                              >
                                <span className="material-symbols-outlined transform group-hover:scale-125 transition-transform text-[32px]">add_circle</span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>


        </div>

        {/* 16-Week Fixed Lecture Modal */}
        {isFixedLectureModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm rtl" dir="rtl">
            <form onSubmit={submitFixedLecture} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl relative border border-gray-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <button type="button" onClick={() => setIsFixedLectureModalOpen(false)} className="absolute top-6 left-6 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 dark:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              <h2 className="text-3xl font-headline font-black text-[#001e40] dark:text-blue-300 mb-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-[32px] text-blue-600 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-2xl">event_repeat</span> 
                {t('admin.fixedLectureModalTitle')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-bold mb-8 pr-1 leading-relaxed">
                {t('admin.fixedLectureModalDesc')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400 uppercase">{t('admin.availableRoom')}</label>
                  <select 
                    required 
                    value={fixedLectureData.roomId} 
                    onChange={e => setFixedLectureData({...fixedLectureData, roomId: e.target.value})} 
                    className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 focus:ring-2 focus:ring-[#1e3a5f] focus:outline-none font-bold"
                  >
                    <option value="" disabled>{t('admin.chooseRoom')}</option>
                    {roomsList.map(r => (
                      <option key={r.id} value={r.id}>{r.roomNumber} ({r.type === 'multi' ? t('admin.multi') : t('admin.normal')})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400 uppercase">{t('admin.courseName')}</label>
                  <input required value={fixedLectureData.courseName} onChange={e => setFixedLectureData({...fixedLectureData, courseName: e.target.value})} type="text" className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 focus:ring-2 focus:ring-[#1e3a5f] focus:outline-none font-bold" placeholder="math 1" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400 uppercase">{t('admin.supervisor')}</label>
                  <input required value={fixedLectureData.responsibleName} onChange={e => setFixedLectureData({...fixedLectureData, responsibleName: e.target.value})} type="text" className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 focus:ring-2 focus:ring-[#1e3a5f] focus:outline-none font-bold" placeholder="Dr. Name" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-[#fdfdfd] dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                <div className="space-y-2 relative">
                    <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400">{t('admin.startLaunchDate')}</label>
                    <input required value={fixedLectureData.startDate} onChange={e => setFixedLectureData({...fixedLectureData, startDate: e.target.value})} type="date" className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 focus:ring-2 focus:ring-[#1e3a5f] font-bold outline-none" />
                </div>
                <div className="space-y-2 relative">
                  <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400">{t('admin.targetDay')}</label>
                  <select value={fixedLectureData.dayOfWeek} onChange={e => setFixedLectureData({...fixedLectureData, dayOfWeek: parseInt(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 focus:ring-2 focus:ring-[#1e3a5f] font-bold outline-none font-headline">
                    <option value={0}>{t('common.days.sunday')}</option>
                    <option value={1}>{t('common.days.monday')}</option>
                    <option value={2}>{t('common.days.tuesday')}</option>
                    <option value={3}>{t('common.days.wednesday')}</option>
                    <option value={4}>{t('common.days.thursday')}</option>
                    <option value={5}>{t('common.days.friday')}</option>
                    <option value={6}>{t('common.days.saturday')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10 bg-[#f8fafc] dark:bg-slate-800/50 p-6 rounded-2xl">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400 text-center">{t('admin.startTime')}</label>
                  <select value={fixedLectureData.timeFrom} onChange={e => setFixedLectureData({...fixedLectureData, timeFrom: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 focus:ring-2 focus:ring-[#1e3a5f] font-black text-center outline-none" dir="ltr">
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2 border-r border-gray-200 dark:border-slate-700 pr-6">
                  <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400 text-center">{t('admin.endTime')}</label>
                  <select value={fixedLectureData.timeTo} onChange={e => setFixedLectureData({...fixedLectureData, timeTo: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 focus:ring-2 focus:ring-[#1e3a5f] font-black text-center outline-none" dir="ltr">
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={isSyncing} className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black text-lg transition-all ${isSyncing ? 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed' : 'bg-[#001e40] dark:bg-blue-600 text-white hover:bg-[#1e3a5f] dark:hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1'}`}>
                <span className="material-symbols-outlined text-[20px]">{isSyncing ? 'hourglass_top' : 'check_circle'}</span>
                {isSyncing ? t('admin.pumpingData') : t('admin.submitFixedBtn')}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 
        ===================================================================
        PRINT ONLY: DAILY MORNING REPORT 
        ===================================================================
      */}
      <div className="hidden print-block w-full min-h-screen bg-white p-12 rtl" dir="rtl">
         {/* Professional Header */}
         <div className="flex justify-between items-center border-b-4 border-[#001e40] pb-6 mb-8">
            <div className="text-right">
              <h1 className="text-4xl font-headline font-black text-[#001e40]">{t('admin.morningReportTitle')}</h1>
              <h2 className="text-xl font-bold text-gray-500 tracking-wide">Daily Morning Report</h2>
            </div>
            <div className="text-left bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-gray-500 font-bold mb-1">{t('admin.todayDate', 'تاريخ اليوم')}:</p>
              <div className="text-2xl font-black text-[#001e40]">{todayDateStr}</div>
            </div>
         </div>

         <div className="mb-8 bg-[#fdfdfd] p-6 border-l-8 border-[#b58b4b] rounded shadow-sm">
            <h3 className="font-black text-xl mb-3 text-[#001e40] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b58b4b]">library_books</span>
              {t('admin.morningReportContent')}
            </h3>
            <p className="font-bold text-gray-700 leading-relaxed max-w-3xl mb-4">
              {t('admin.morningReportDesc')}
            </p>
            <ul className="list-disc pr-8 text-gray-600 font-medium space-y-2">
               <li>{t('admin.morningReportList1')}</li>
               <li>{t('admin.morningReportList2')}</li>
            </ul>
         </div>

         {/* Beautifully styled data table */}
         <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm border border-gray-300 text-right mt-10">
            <thead>
               <tr className="bg-[#001e40] text-white">
                  <th className="py-4 px-6 text-sm font-bold border-b border-[#001e40] w-1/5 whitespace-nowrap">{t('admin.roomName')}</th>
                  <th className="py-4 px-6 text-sm font-bold border-b border-[#001e40] w-1/5">{t('admin.eventType')}</th>
                  <th className="py-4 px-6 text-sm font-bold border-b border-[#001e40] w-1/5">{t('admin.responsible')}</th>
                  <th className="py-4 px-6 text-sm font-bold border-b border-[#001e40] w-[15%] text-center">{t('admin.useTime')}</th>
                  <th className="py-4 px-6 text-sm font-bold border-b border-[#001e40]">{t('admin.requiredEquip')}</th>
               </tr>
            </thead>
            <tbody className="bg-white">
               {morningReportEvents.map((evt, index) => (
                 <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-5 px-6 font-black text-lg text-[#001e40] border-l border-gray-100">
                      {evt.roomId}
                    </td>
                    <td className="py-5 px-6 border-l border-gray-100">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${evt.roomType === 'multi' ? 'bg-[#b58b4b]/10 text-[#8b6a37]' : 'bg-blue-100 text-blue-800'}`}>
                        {evt.roomType === 'multi' ? t('admin.multiPurpose') : t('admin.exceptional')}
                      </span>
                    </td>
                    <td className="py-5 px-6 font-bold text-gray-800 border-l border-gray-100">
                      {evt.responsibleName}
                    </td>
                    <td className="py-5 px-6 text-center font-black text-gray-700 bg-gray-50/50 ltr border-l border-gray-100" dir="ltr">
                      {evt.timeFrom}
                    </td>
                    <td className="py-5 px-6 text-sm leading-relaxed text-gray-700 font-semibold space-y-1">
                       {evt.reqLaptop && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-gray-400">laptop_mac</span> {t('booking.requirementsLaptop')}</div>}
                       {evt.reqVideoConf && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-gray-400">video_camera_front</span> {t('booking.requirementsVideo')}</div>}
                       {evt.reqMic && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-gray-400">mic</span> {t('booking.requirementsMic')} ({t('booking.qty')}: {evt.reqMicQty || 1})</div>}
                       {!evt.reqLaptop && !evt.reqVideoConf && !evt.reqMic && <span className="text-gray-400 italic">{t('admin.noEquip')}</span>}
                    </td>
                 </tr>
               ))}
               {morningReportEvents.length === 0 && (
                 <tr>
                    <td colSpan="5" className="py-16 text-center text-gray-400 font-bold bg-gray-50">
                       <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">event_available</span>
                       {t('admin.noEvents')}
                    </td>
                 </tr>
               )}
            </tbody>
         </table>

         {/* Signatures Area */}
         <div className="mt-24 grid grid-cols-2 gap-20 px-16 text-sm font-bold text-[#001e40]">
            <div className="text-center bg-gray-50 p-6 rounded-2xl border border-gray-200">
               <p className="text-lg">{t('admin.academicManagerSign')}</p>
               <div className="border-b-2 border-dashed border-[#001e40] mt-16 mx-auto w-3/4"></div>
            </div>
            <div className="text-center bg-gray-50 p-6 rounded-2xl border border-gray-200">
               <p className="text-lg">{t('admin.engineeringManagerSign')}</p>
               <div className="border-b-2 border-dashed border-[#001e40] mt-16 mx-auto w-3/4"></div>
            </div>
         </div>
         
         <div className="mt-12 text-center text-gray-400 text-xs font-bold w-full uppercase tracking-widest">
           -- {t('admin.printedAt')} {new Date().toLocaleTimeString()} --
         </div>
      </div>
    </>
  );
}
