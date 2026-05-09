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

export default function AdminDashboard() {
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



  const weekDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00'];

  const cardThemes = [
    { bg: 'bg-[#eef2f6]', border: 'border-[#1e3a5f]', textP: 'text-[#1e3a5f]', textS: 'text-[#5a7698]' },
    { bg: 'bg-[#fbf0dd]', border: 'border-[#b58b4b]', textP: 'text-[#4a3615]', textS: 'text-[#8b6a37]' },
    { bg: 'bg-[#e7e8eb]', border: 'border-[#1e232b]', textP: 'text-[#1e232b]', textS: 'text-[#555b63]' }
  ];

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const dayIndex = date.getDay();
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dayIndex];
  };

  const getDayIndexFromName = (dayName) => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
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
      showAlert(newMode ? 'تم تفعيل وضع رمضان للنظام بالكامل' : 'تم العودة للمواعيد العادية', 'success');
    } catch (e) {
      console.error(e);
      showAlert('حدث خطأ أثناء تحديث الإعدادات', 'error');
    }
  };

  const handlePrintMorningReport = () => {
    window.print();
  };

  const submitFixedLecture = async (e) => {
    e.preventDefault();
    if (!fixedLectureData.roomId || !fixedLectureData.startDate || !fixedLectureData.responsibleName || !fixedLectureData.courseName) {
      showAlert('الرجاء تعبئة جميع الحقول المطلوبة (القاعة، الدكتور، المادة)', 'warning');
      return;
    }
    showConfirm(`سيتم الآن إنشاء 16 حجزاً ثابتاً متتالياً لقاعة ${fixedLectureData.roomId}. هل أنت متأكد؟`, async () => {
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
        showAlert('تم إدراج 16 أسبوعاً بنجاح!', 'success');
      } catch (err) {
        console.error(err);
        showAlert('خطأ أثناء إنشاء المحاضرات الثابتة', 'error');
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 rtl pt-8 px-4" dir="rtl">
          <div>
            <h1 className="text-4xl font-headline font-bold text-[#001e40] tracking-tight">لوحة تحكم المسؤول</h1>
            <p className="text-[#5a7698] mt-2 text-lg">إدارة الجداول الأسبوعية ومتابعة العمليات</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0 justify-end">
            {/* Ramadan Mode Toggle */}
            <button 
              onClick={toggleRamadanMode}
              disabled={isSettingsLoading}
              className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-sm border transition-all hover:-translate-y-1 ${
                isRamadanMode 
                  ? 'bg-orange-500 text-white border-orange-600 shadow-orange-200' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{isRamadanMode ? 'brightness_high' : 'schedule'}</span>
              {isRamadanMode ? 'وضع رمضان: مفعّل' : 'تفعيل وضع رمضان'}
            </button>
            <button 
              onClick={() => navigate('/admin/requests')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2 relative"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              إدارة الطلبات المعلقة
              {pendingCount > 0 && (
                 <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs animate-bounce shadow-md">
                   {pendingCount}
                 </span>
              )}
            </button>
            <button 
              onClick={handlePrintMorningReport}
              className="px-5 py-2.5 rounded-xl bg-[#001e40] text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">summarize</span>
              التقرير الصباحي 
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 px-4" dir="rtl">
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-[#eef2f6] text-[#1e3a5f] rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">book_online</span>
              </div>
              <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold font-headline">مكتمل</span>
            </div>
            <div className="relative z-10">
              <div className="text-gray-500 text-sm font-bold mb-1">الطلبات المقبولة اليوم</div>
              <div className="text-4xl font-headline font-black text-[#001e40]">{acceptedTodayCount}</div>
            </div>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-[#fbf0dd] text-[#b58b4b] rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">pending_actions</span>
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-gray-500 text-sm font-bold mb-1">الطلبات قيد الانتظار</div>
              <div className="text-4xl font-headline font-black text-[#5a7698]">{pendingCount}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 px-4 rtl" dir="rtl">
          
          {/* Weekly View - Beautiful CSS Grid Implementation mapping 7 Days */}
          <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 w-full">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
              <h2 className="text-3xl font-headline font-black text-[#001e40]">الجدول الأسبوعي</h2>
              <div className="flex items-center gap-4 text-[#5a7698] font-bold">
                <span className="material-symbols-outlined cursor-pointer hover:text-black">chevron_right</span>
                <span>أكتوبر 2026</span>
                <span className="material-symbols-outlined cursor-pointer hover:text-black">chevron_left</span>
              </div>
            </div>
            
            <div className="overflow-x-auto pb-6 custom-scrollbar">
              <div className="min-w-[1000px]">
                
                {/* Header Row (Days) */}
                <div className="grid grid-cols-8 text-center text-sm font-bold text-[#5a7698] mb-6">
                  <div /* Placeholder for Time Col */>الوقت</div>
                  {weekDays.map(day => (
                    <div key={day} className="pb-4 border-b border-gray-200">{day}</div>
                  ))}
                </div>

                {/* Time Rows */}
                <div className="space-y-0 relative">
                  {timeSlots.map((time, rowIdx) => (
                    <div key={time} className="grid grid-cols-8 text-center h-[100px] border-b border-gray-100 relative group">
                      
                      {/* Time cell on the right */}
                      <div className="flex items-center justify-center text-sm font-bold text-[#5a7698] px-2 h-full border-l border-gray-100">
                        {time} {parseInt(time) < 12 ? 'ص' : 'م'}
                      </div>

                      {/* Day Cells mapping */}
                      {weekDays.map((day, colIdx) => {
                        const booking = getGridBooking(day, time);
                        let theme = cardThemes[Math.abs(booking?.roomId?.charCodeAt(0) + colIdx + rowIdx) % cardThemes.length];
                        if (booking?.is16WeekFixed) theme = cardThemes[0]; 
                        else if (booking?.roomType === 'multi') theme = cardThemes[1];

                        return (
                          <div key={`${day}-${time}`} className="relative h-full flex items-center justify-center p-[6px] border-l border-dashed border-gray-100 last:border-l-0">
                            {booking ? (
                              <div className={`w-full h-full rounded-[0.7rem] ${theme.bg} ${theme.border} border-r-[6px] flex flex-col justify-center items-center shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all cursor-pointer relative`}>
                                <div className={`font-headline font-black text-[15px] ${theme.textP} leading-tight`}>
                                  {booking.roomType === 'multi' ? '' : 'قاعة'} {booking.roomId}
                                </div>
                                <div className={`text-[11px] font-bold mt-1 ${theme.textS} text-center leading-tight px-1`}>
                                  {booking.courseName || (booking.is16WeekFixed ? 'محاضرة ثابتة' : 'حجز اعتيادي')}
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={() => openModalForCell(day, time)} 
                                className="w-full h-full rounded-[0.7rem] hover:bg-blue-50 border-2 border-transparent hover:border-dashed hover:border-blue-200 cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100 transition-all text-blue-400 group"
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
            <form onSubmit={submitFixedLecture} className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
              <button type="button" onClick={() => setIsFixedLectureModalOpen(false)} className="absolute top-6 left-6 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-full w-8 h-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              <h2 className="text-3xl font-headline font-black text-[#001e40] mb-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-[32px] text-blue-600 bg-blue-50 p-2 rounded-2xl">event_repeat</span> 
                تسجيل جدول ثابت
              </h2>
              <p className="text-sm text-gray-500 font-bold mb-8 pr-1 leading-relaxed">
                هذه النافذة مخصصة لإضافة المحاضرات الثابتة أو الأنشطة المستمرة من خلال ضخ البيانات مباشرة على هذا المفصل الزمني.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#5a7698] uppercase">القاعة المتاحة</label>
                  <select 
                    required 
                    value={fixedLectureData.roomId} 
                    onChange={e => setFixedLectureData({...fixedLectureData, roomId: e.target.value})} 
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] focus:ring-2 focus:ring-[#1e3a5f] focus:outline-none font-bold"
                  >
                    <option value="" disabled>-- اختر قاعة --</option>
                    {roomsList.map(r => (
                      <option key={r.id} value={r.id}>{r.roomNumber} ({r.type === 'multi' ? 'متعددة' : 'عادية'})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#5a7698] uppercase">اسم المادة</label>
                  <input required value={fixedLectureData.courseName} onChange={e => setFixedLectureData({...fixedLectureData, courseName: e.target.value})} type="text" className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] focus:ring-2 focus:ring-[#1e3a5f] focus:outline-none font-bold" placeholder="رياضيات 1" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#5a7698] uppercase">المشرف / الدكتور</label>
                  <input required value={fixedLectureData.responsibleName} onChange={e => setFixedLectureData({...fixedLectureData, responsibleName: e.target.value})} type="text" className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] focus:ring-2 focus:ring-[#1e3a5f] focus:outline-none font-bold" placeholder="د. محمد خالد" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-[#fdfdfd] p-6 rounded-2xl border border-gray-100">
                <div className="space-y-2 relative">
                    <label className="block text-xs font-bold text-[#5a7698]">تاريخ الانطلاق</label>
                    <input required value={fixedLectureData.startDate} onChange={e => setFixedLectureData({...fixedLectureData, startDate: e.target.value})} type="date" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] focus:ring-2 focus:ring-[#1e3a5f] font-bold outline-none" />
                </div>
                <div className="space-y-2 relative">
                  <label className="block text-xs font-bold text-[#5a7698]">اليوم المكرر المستهدف</label>
                  <select value={fixedLectureData.dayOfWeek} onChange={e => setFixedLectureData({...fixedLectureData, dayOfWeek: parseInt(e.target.value)})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] focus:ring-2 focus:ring-[#1e3a5f] font-bold outline-none font-headline">
                    <option value={0}>الأحد</option>
                    <option value={1}>الإثنين</option>
                    <option value={2}>الثلاثاء</option>
                    <option value={3}>الأربعاء</option>
                    <option value={4}>الخميس</option>
                    <option value={5}>الجمعة</option>
                    <option value={6}>السبت</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10 bg-[#f8fafc] p-6 rounded-2xl">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#5a7698] text-center">وقت البداية</label>
                  <select value={fixedLectureData.timeFrom} onChange={e => setFixedLectureData({...fixedLectureData, timeFrom: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] focus:ring-2 focus:ring-[#1e3a5f] font-black text-center outline-none" dir="ltr">
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2 border-r border-gray-200 pr-6">
                  <label className="block text-xs font-bold text-[#5a7698] text-center">وقت الانتهاء</label>
                  <select value={fixedLectureData.timeTo} onChange={e => setFixedLectureData({...fixedLectureData, timeTo: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] focus:ring-2 focus:ring-[#1e3a5f] font-black text-center outline-none" dir="ltr">
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={isSyncing} className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black text-lg transition-all ${isSyncing ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#001e40] text-white hover:bg-[#1e3a5f] hover:shadow-xl hover:-translate-y-1'}`}>
                <span className="material-symbols-outlined text-[20px]">{isSyncing ? 'hourglass_top' : 'check_circle'}</span>
                {isSyncing ? 'جاري ضخ البيانات للـ 16 أسبوع...' : 'حجز واكتتاب الفصول المتكررة'}
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
              <h1 className="text-4xl font-headline font-black text-[#001e40]">التقرير الصباحي اليومي</h1>
              <h2 className="text-xl font-bold text-gray-500 tracking-wide">Daily Morning Report</h2>
            </div>
            <div className="text-left bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-gray-500 font-bold mb-1">تاريخ اليوم:</p>
              <div className="text-2xl font-black text-[#001e40]">{todayDateStr}</div>
            </div>
         </div>

         <div className="mb-8 bg-[#fdfdfd] p-6 border-l-8 border-[#b58b4b] rounded shadow-sm">
            <h3 className="font-black text-xl mb-3 text-[#001e40] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b58b4b]">library_books</span>
              محتوى التقرير الشامل:
            </h3>
            <p className="font-bold text-gray-700 leading-relaxed max-w-3xl mb-4">
              يحتوي هذا التقرير المنبثق على قائمة بكافة الأحداث خارج الجدول الثابت لهذا اليوم لتوجيه العمال والمختصين لتجهيزها، وتشمل:
            </p>
            <ul className="list-disc pr-8 text-gray-600 font-medium space-y-2">
               <li>التعديلات أو المحاضرات الاستثنائية / المتغيرة.</li>
               <li>حجوزات القاعات متعددة الأغراض والمؤتمرات المعتمدة.</li>
            </ul>
         </div>

         {/* Beautifully styled data table */}
         <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm border border-gray-300 text-right mt-10">
            <thead>
               <tr className="bg-[#001e40] text-white">
                  <th className="py-4 px-6 text-sm font-bold border-b border-[#001e40] w-1/5 whitespace-nowrap">اسم القاعة</th>
                  <th className="py-4 px-6 text-sm font-bold border-b border-[#001e40] w-1/5">نوع الحدث</th>
                  <th className="py-4 px-6 text-sm font-bold border-b border-[#001e40] w-1/5">الأستاذ / المستخدم</th>
                  <th className="py-4 px-6 text-sm font-bold border-b border-[#001e40] w-[15%] text-center">وقت الاستخدام</th>
                  <th className="py-4 px-6 text-sm font-bold border-b border-[#001e40]">التجهيزات المطلوبة</th>
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
                        {evt.roomType === 'multi' ? 'قاعة متعددة الأغراض' : 'استثنائية / متغيرة'}
                      </span>
                    </td>
                    <td className="py-5 px-6 font-bold text-gray-800 border-l border-gray-100">
                      {evt.responsibleName}
                    </td>
                    <td className="py-5 px-6 text-center font-black text-gray-700 bg-gray-50/50 ltr border-l border-gray-100" dir="ltr">
                      {evt.timeFrom}
                    </td>
                    <td className="py-5 px-6 text-sm leading-relaxed text-gray-700 font-semibold space-y-1">
                       {evt.reqLaptop && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-gray-400">laptop_mac</span> حاسب آلي</div>}
                       {evt.reqVideoConf && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-gray-400">video_camera_front</span> فيديو كونفرنس</div>}
                       {evt.reqMic && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-gray-400">mic</span> ميكروفونات (عدد: {evt.reqMicQty || 1})</div>}
                       {!evt.reqLaptop && !evt.reqVideoConf && !evt.reqMic && <span className="text-gray-400 italic">بدون تجهيزات إضافية</span>}
                    </td>
                 </tr>
               ))}
               {morningReportEvents.length === 0 && (
                 <tr>
                    <td colSpan="5" className="py-16 text-center text-gray-400 font-bold bg-gray-50">
                       <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">event_available</span>
                       لا توجد حجوزات استثنائية ضمن نطاق التقرير لهذا اليوم.
                    </td>
                 </tr>
               )}
            </tbody>
         </table>

         {/* Signatures Area */}
         <div className="mt-24 grid grid-cols-2 gap-20 px-16 text-sm font-bold text-[#001e40]">
            <div className="text-center bg-gray-50 p-6 rounded-2xl border border-gray-200">
               <p className="text-lg">توقيع مدير الشؤون الأكاديمية</p>
               <div className="border-b-2 border-dashed border-[#001e40] mt-16 mx-auto w-3/4"></div>
            </div>
            <div className="text-center bg-gray-50 p-6 rounded-2xl border border-gray-200">
               <p className="text-lg">توقيع الإدارة الهندسيـة</p>
               <div className="border-b-2 border-dashed border-[#001e40] mt-16 mx-auto w-3/4"></div>
            </div>
         </div>
         
         <div className="mt-12 text-center text-gray-400 text-xs font-bold w-full uppercase tracking-widest">
           -- نظام إدارة القاعات الأكاديمية | التقرير مطبوع إلكترونيا في {new Date().toLocaleTimeString()} --
         </div>
      </div>
    </>
  );
}
