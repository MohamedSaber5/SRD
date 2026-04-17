import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, onSnapshot, doc, addDoc, serverTimestamp } from 'firebase/firestore';

const REGULAR_SLOTS = [
  { from: '08:30', to: '10:10', label: 'المحاضرة الأولى (08:30 - 10:10)' },
  { from: '10:30', to: '12:10', label: 'المحاضرة الثانية (10:30 - 12:10)' },
  { from: '12:30', to: '14:10', label: 'المحاضرة الثالثة (12:30 - 14:10)' },
  { from: '14:30', to: '16:10', label: 'المحاضرة الرابعة (14:30 - 16:10)' },
  { from: '16:30', to: '18:10', label: 'المحاضرة الخامسة (16:30 - 18:10)' },
  { from: '18:30', to: '20:10', label: 'المحاضرة السادسة (18:30 - 20:10)' },
  { from: '20:30', to: '22:10', label: 'المحاضرة السابعة (20:30 - 22:10)' },
  { from: '22:30', to: '00:10', label: 'المحاضرة الثامنة (22:30 - 00:10)' },
];

const RAMADAN_SLOTS = [
  { from: '09:30', to: '10:25', label: 'الفترة الأولى (09:30 - 10:25)' },
  { from: '10:30', to: '11:25', label: 'الفترة الثانية (10:30 - 11:25)' },
  { from: '11:30', to: '12:25', label: 'الفترة الثالثة (11:30 - 12:25)' },
  { from: '12:30', to: '13:25', label: 'الفترة الرابعة (12:30 - 13:25)' },
  { from: '13:30', to: '14:25', label: 'الفترة الخامسة (13:30 - 14:25)' },
  { from: '14:30', to: '15:25', label: 'الفترة السادسة (14:30 - 15:25)' },
  { from: '15:30', to: '16:25', label: 'الفترة السابعة (15:30 - 16:25)' },
  { from: '16:30', to: '17:25', label: 'الفترة الثامنة (16:30 - 17:25)' },
];

export default function BookingForm() {
  const { userRole, currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [minDate, setMinDate] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const location = useLocation();
  const prefill = location.state?.prefill || {};

  // Form Data
  const [formData, setFormData] = useState({
    roomId: prefill.roomId || '',
    roomType: prefill.roomType || '', // 'fixed' or 'multi'
    hallCategory: prefill.hallCategory || '', // 'lecture' or 'multi' (for employee UI)
    date: prefill.date || '',
    selectedSlot: prefill.timeFrom ? { from: prefill.timeFrom, to: prefill.timeTo, label: `${prefill.timeFrom} - ${prefill.timeTo}` } : null,
    timeFrom: prefill.timeFrom || '',
    timeTo: prefill.timeTo || '',
    purpose: prefill.purpose || '',
    respName: prefill.responsibleName || currentUser?.displayName || '',
    respJob: '', // not in prefill originally 
    respMobile: prefill.responsibleMobile || '',
    reqMic: false,
    reqMicQty: 1,
    reqLaptop: false,
    reqVideoConf: false,
    isHolidayEvent: prefill.isHolidayEvent || false,
    isOfficialOccasion: prefill.isOfficialOccasion || false
  });
  const [isRamadanMode, setIsRamadanMode] = useState(false);
  const [isLeadTimeError, setIsLeadTimeError] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const q = query(collection(db, 'rooms'), orderBy('id', 'asc'));
        const querySnapshot = await getDocs(q);
        const roomsData = querySnapshot.docs.map(doc => ({
          ...doc.data()
        }));
        setRooms(roomsData);

        // Correctly set roomType and hallCategory if a room was prefilled
        setFormData(prev => {
          if (prev.roomId && prev.roomId !== 'لم يتم التحديد') {
            const selectedRoom = roomsData.find(r => r.id === prev.roomId);
            if (selectedRoom) {
              return { 
                ...prev, 
                roomType: selectedRoom.type || 'fixed', 
                hallCategory: selectedRoom.type === 'multi' ? 'multi' : 'lecture' 
              };
            }
          }
          return prev;
        });
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();

    // Calculate minimum date based on constraints:
    // Secretary: max 48 hours before (only multi-purpose)
    // Employee: max 24 hours before
    const today = new Date();
    let hoursToAdd = 0;
    
    if (userRole === 'secretary') {
      hoursToAdd = 48;
    } else if (userRole === 'employee') {
      hoursToAdd = 24;
    }

    const minAllowed = new Date(today.getTime() + hoursToAdd * 60 * 60 * 1000);
    setMinDate(minAllowed.toISOString().split('T')[0]);

    // 3. Listen to system settings (Ramadan Mode)
    const settingsUnsubscribe = onSnapshot(doc(db, 'settings', 'system'), (doc) => {
      if (doc.exists()) {
        setIsRamadanMode(doc.data().isRamadanMode);
      }
    });

    return () => settingsUnsubscribe();
  }, [userRole]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'date') {
       const selectedDate = new Date(value);
       const now = new Date();
       const diffHours = (selectedDate - now) / (1000 * 60 * 60);
       
       if (userRole === 'employee') {
          // Quick 24h check for employee date selection
          setIsLeadTimeError(diffHours < 24 && selectedDate.toDateString() === now.toDateString());
       } else if (userRole === 'secretary') {
          // Quick 48h check for secretary date selection
          setIsLeadTimeError(diffHours < 48);
       }
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const currentSlots = isRamadanMode ? RAMADAN_SLOTS : REGULAR_SLOTS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'bookings'), {
        roomId: formData.roomId,
        roomType: formData.roomType,
        date: formData.date,
        timeFrom: formData.timeFrom,
        timeTo: formData.timeTo,
        purpose: formData.purpose,
        isHolidayEvent: formData.isHolidayEvent,
        isOfficialOccasion: formData.isOfficialOccasion,
        responsibleName: formData.respName,
        responsibleJob: formData.respJob,
        responsibleMobile: formData.respMobile,
        reqMic: formData.reqMic,
        reqMicQty: formData.reqMicQty,
        reqLaptop: formData.reqLaptop,
        reqVideoConf: formData.reqVideoConf,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'مستخدم',
        userRole: userRole,
        college: userData?.collegeName || '',
        status: userRole === 'admin' ? 'awaiting_manager_final' : 'pending',
        createdAt: serverTimestamp()
      });

      // Audit Logging for special roles
      if (userRole === 'secretary' || userRole === 'temp_admin') {
         await addDoc(collection(db, 'audit_logs'), {
           actionBy: currentUser.email,
           actionByName: currentUser.displayName || 'مستخدم',
           actionType: 'REQUEST_BOOKING',
           details: `قام بإنشاء طلب حجز للقاعة (${formData.roomId}) بتاريخ ${formData.date}`,
           timestamp: serverTimestamp()
         });
      }

      alert('تم إرسال الطلب بنجاح وهو الآن بانتظار الموافقة');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding document: ', error);
      alert('حدث خطأ أثناء إرسال الطلب');
    }
  };

  const isEmployeeLecture = userRole === 'employee' && formData.hallCategory === 'lecture';

  return (
    <>
      <div className="mb-10 flex flex-col justify-between items-start gap-2">
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2">طلب حجز قاعة جديدة</h2>
        <p className="text-on-surface-variant text-lg">يرجى إكمال تفاصيل الحجز، سيتم مراجعة الطلب بناءً على التوافر.</p>
        {(userRole === 'secretary' || userRole === 'employee' || userRole === 'admin') && (
           <p className="text-sm font-bold text-error bg-error-container/20 px-3 py-1 rounded-md mt-2">
            ملاحظة نظامية: {userRole === 'admin' ? 'يمكن حجز القاعات متعددة الأغراض فقط، وسيتم تحويل الطلب لمدير الفرع مباشرة.' : userRole === 'secretary' ? 'لا يمكن حجز موعد أقل من 48 ساعة ويُسمح فقط بالقاعات متعددة الأغراض.' : 'لا يمكن حجز موعد أقل من 24 ساعة من الآن.'}
           </p>
        )}
      </div>

      {/* Stepper UI */}
      {!isEmployeeLecture && (
      <div className="mb-12 relative max-w-2xl mx-auto">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-surface-container-high -z-10 -translate-y-1/2 rounded-full"></div>
        <div 
          className="absolute top-1/2 right-0 h-1 bg-secondary -z-10 -translate-y-1/2 rounded-full transition-all duration-300"
          style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
        ></div>
        
        <div className="flex justify-between relative z-10 w-full px-2">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors ${step >= 1 ? 'bg-secondary text-white' : 'bg-surface-container border-2 border-surface-container-high text-on-surface-variant'}`}>1</div>
            <span className={`font-headline text-sm font-bold ${step >= 1 ? 'text-primary' : 'text-on-surface-variant'}`}>التفاصيل</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors ${step >= 2 ? 'bg-secondary text-white' : 'bg-surface-container border-2 border-surface-container-high text-on-surface-variant'}`}>2</div>
            <span className={`font-headline text-sm font-bold ${step >= 2 ? 'text-primary' : 'text-on-surface-variant'}`}>المسؤول</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors ${step >= 3 ? 'bg-secondary text-white' : 'bg-surface-container border-2 border-surface-container-high text-on-surface-variant'}`}>3</div>
            <span className={`font-headline text-sm font-bold ${step >= 3 ? 'text-primary' : 'text-on-surface-variant'}`}>التجهيزات</span>
          </div>
        </div>
      </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm relative overflow-hidden max-w-3xl mx-auto">
        <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary to-primary-container"></div>
        
        <form onSubmit={(step === 3 || isEmployeeLecture) ? handleSubmit : (e) => e.preventDefault()}>
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-headline font-bold text-primary mb-6 border-b border-surface-container-high pb-4">المعلومات الأساسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block text-sm font-label font-bold text-on-surface-variant">
                    {userRole === 'admin' ? 'اختر نوع وتسمية القاعة' : 'اختر نوع القاعة المطلوبة'}
                  </label>
                  
                  {userRole !== 'admin' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userRole !== 'secretary' && (
                        <button 
                          type="button"
                          onClick={() => setFormData(p => ({ 
                            ...p, 
                            roomId: 'لم يتم التحديد', 
                            roomType: 'fixed', 
                            hallCategory: 'lecture' 
                          }))}
                          className={`group p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${formData.hallCategory === 'lecture' ? 'border-primary bg-primary/5 shadow-md' : 'border-surface-container-high hover:border-primary/30 hover:bg-surface-container'}`}
                        >
                           <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${formData.hallCategory === 'lecture' ? 'bg-primary text-white' : 'bg-surface-container-highest text-primary'}`}>
                              <span className="material-symbols-outlined text-3xl">school</span>
                           </div>
                           <div className="text-center">
                              <div className={`font-bold text-lg ${formData.hallCategory === 'lecture' ? 'text-primary' : 'text-on-surface'}`}>قاعة محاضرات</div>
                              <div className="text-xs text-on-surface-variant">للمحاضرات الاستثنائية والتعويضية</div>
                           </div>
                           {formData.hallCategory === 'lecture' && (
                             <div className="absolute top-3 right-3 text-primary animate-in zoom-in">
                               <span className="material-symbols-outlined fill-1">check_circle</span>
                             </div>
                           )}
                        </button>
                      )}

                      <button 
                        type="button"
                        onClick={() => setFormData(p => ({ 
                          ...p, 
                          roomId: 'لم يتم التحديد', 
                          roomType: 'multi', 
                          hallCategory: 'multi' 
                        }))}
                        className={`group p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative flex-1 ${formData.hallCategory === 'multi' ? 'border-secondary bg-secondary/5 shadow-md' : 'border-surface-container-high hover:border-secondary/30 hover:bg-surface-container'} ${userRole === 'secretary' ? 'col-span-2' : ''}`}
                      >
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${formData.hallCategory === 'multi' ? 'bg-secondary text-white' : 'bg-surface-container-highest text-secondary'}`}>
                            <span className="material-symbols-outlined text-3xl">event_seat</span>
                         </div>
                         <div className="text-center">
                            <div className={`font-bold text-lg ${formData.hallCategory === 'multi' ? 'text-secondary' : 'text-on-surface'}`}>قاعة متعددة الأغراض</div>
                            <div className="text-xs text-on-surface-variant">للندوات، الاجتماعات، والفعاليات الرسمية</div>
                         </div>
                         {formData.hallCategory === 'multi' && (
                           <div className="absolute top-3 right-3 text-secondary animate-in zoom-in">
                             <span className="material-symbols-outlined fill-1">check_circle</span>
                           </div>
                         )}
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        name="roomId" 
                        value={formData.roomId} 
                        onChange={(e) => {
                           const selectedRoom = rooms.find(r => r.id === e.target.value);
                           setFormData(p => ({
                             ...p, 
                             roomId: e.target.value, 
                             roomType: selectedRoom?.type || 'fixed'
                           }));
                        }} 
                        className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                        disabled={loadingRooms}
                      >
                        <option disabled value="">{loadingRooms ? 'جاري تحميل القاعات...' : 'يرجى اختيار قاعة...'}</option>
                        
                        {/* Categorized rendering */}
                        <optgroup label="قاعات متعددة الأغراض">
                          {rooms.filter(r => r.type === 'multi').map(r => (
                            <option key={r.id} value={r.id}>{r.roomNumber} (سعة: {r.capacity})</option>
                          ))}
                        </optgroup>

                        {userRole !== 'secretary' && userRole !== 'admin' && (
                          <>
                            <optgroup label="الدور الأول (A-1xx)">
                              {rooms.filter(r => r.type === 'fixed' && r.floor === 1).map(r => (
                                <option key={r.id} value={r.id}>{r.roomNumber} (سعة: {r.capacity})</option>
                              ))}
                            </optgroup>
                            <optgroup label="الدور الثاني (A-2xx)">
                              {rooms.filter(r => r.type === 'fixed' && r.floor === 2).map(r => (
                                <option key={r.id} value={r.id}>{r.roomNumber} (سعة: {r.capacity})</option>
                              ))}
                            </optgroup>
                            <optgroup label="الدور الثالث (A-3xx)">
                              {rooms.filter(r => r.type === 'fixed' && r.floor === 3).map(r => (
                                <option key={r.id} value={r.id}>{r.roomNumber} (سعة: {r.capacity})</option>
                              ))}
                            </optgroup>
                          </>
                        )}
                      </select>
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                    </div>
                  )}
                </div>

                <div className="col-span-1 space-y-2">
                  <label className="block text-sm font-label font-bold text-on-surface-variant">تاريخ الفعالية</label>
                  <div className="relative">
                    <input 
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={minDate}
                      className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary cursor-pointer text-right" 
                      type="date"
                      required
                    />
                  </div>
                </div>

                 <div className="col-span-1 space-y-2">
                   <label className="block text-sm font-label font-bold text-on-surface-variant">الفترة الزمنية المتاحة</label>
                   <div className="relative">
                     <select 
                       className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                       value={formData.timeFrom ? currentSlots.findIndex(s => s.from === formData.timeFrom && s.to === formData.timeTo) : ""}
                       onChange={(e) => {
                         const slot = currentSlots[e.target.value];
                         setFormData(p => ({
                           ...p,
                           selectedSlot: slot,
                           timeFrom: slot.from,
                           timeTo: slot.to
                         }));
                         
                         // Lead-time rule (24h for employee, 48h for secretary)
                         if ((userRole === 'employee' || userRole === 'secretary') && formData.date) {
                            const [hours, minutes] = slot.from.split(':');
                            const bookingTime = new Date(formData.date);
                            bookingTime.setHours(parseInt(hours), parseInt(minutes));
                            const diff = (bookingTime - new Date()) / (1000 * 60 * 60);
                            const limit = userRole === 'secretary' ? 48 : 24;
                            setIsLeadTimeError(diff < limit);
                         }
                       }}
                       required
                     >
                       <option value="">اختر فترة...</option>
                       {currentSlots.map((s, idx) => (
                         <option key={idx} value={idx}>{s.label}</option>
                       ))}
                     </select>
                     <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                   </div>
                   {isLeadTimeError && (
                     <p className="text-xs text-error font-bold mt-1 px-1 flex items-center gap-1 animate-pulse">
                        <span className="material-symbols-outlined text-sm">warning</span> 
                        عفواً، يجب أن يكون الحجز قبل الموعد بـ {userRole === 'secretary' ? '48' : '24'} ساعة على الأقل.
                     </p>
                   )}
                 </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block text-sm font-label font-bold text-on-surface-variant">الغرض من الاستخدام</label>
                  <textarea 
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    required
                    className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary resize-none" 
                    placeholder="وصف موجز لطبيعة الفعالية أو الاجتماع..." 
                    rows={4}
                  ></textarea>
                </div>
                
                {userRole === 'secretary' && (
                  <div className="col-span-1 md:col-span-2 mt-2 bg-surface-container-highest p-4 rounded-xl space-y-3">
                    <label className="block text-sm font-label font-bold text-on-surface-variant mb-2">امتيازات إضافية للطلب (يرجى التحديد إن وجد)</label>
                    <label className="flex items-start gap-4 cursor-pointer">
                      <input type="checkbox" name="isHolidayEvent" checked={formData.isHolidayEvent} onChange={handleChange} className="mt-1 w-5 h-5 text-secondary rounded focus:ring-secondary border-outline-variant" />
                      <div>
                        <div className="font-bold text-on-surface">حدث خلال عطلة رسمية أو إجازة نهاية الأسبوع</div>
                        <div className="text-xs text-on-surface-variant">يضيف نقاط أولوية للطلب عند مدير الفرع</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-4 cursor-pointer">
                      <input type="checkbox" name="isOfficialOccasion" checked={formData.isOfficialOccasion} onChange={handleChange} className="mt-1 w-5 h-5 text-secondary rounded focus:ring-secondary border-outline-variant" />
                      <div>
                        <div className="font-bold text-on-surface">مناسبة رسمية للكلية (مؤتمر مسجل، ندوة عامة)</div>
                        <div className="text-xs text-on-surface-variant">يرجى توضيح التفاصيل في خانة "الغرض من الاستخدام"</div>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <h3 className="text-xl font-headline font-bold text-primary mb-6 border-b border-surface-container-high pb-4">بيانات المسؤول عن الحدث</h3>
               <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2 relative text-right">
                  <label className="block font-body text-sm font-medium text-on-surface-variant">الاسم</label>
                  <input name="respName" value={formData.respName} onChange={handleChange} required className="block w-full rounded-xl border-0 py-3 pl-4 pr-4 bg-surface-container-high focus:ring-2 focus:ring-primary text-right font-body" type="text"/>
                </div>
                <div className="space-y-2 relative text-right">
                  <label className="block font-body text-sm font-medium text-on-surface-variant">الوظيفة / الصفة الأكاديمية</label>
                  <input name="respJob" value={formData.respJob} onChange={handleChange} required className="block w-full rounded-xl border-0 py-3 pl-4 pr-4 bg-surface-container-high focus:ring-2 focus:ring-primary text-right font-body" type="text"/>
                </div>
                <div className="space-y-2 relative text-right">
                  <label className="block font-body text-sm font-medium text-on-surface-variant">رقم الجوال (للتواصل السريع)</label>
                  <input name="respMobile" value={formData.respMobile} onChange={handleChange} required className="block w-full rounded-xl border-0 py-3 pl-4 pr-4 bg-surface-container-high focus:ring-2 focus:ring-primary text-right font-body" type="tel" dir="ltr"/>
                </div>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <h3 className="text-xl font-headline font-bold text-primary mb-6 border-b border-surface-container-high pb-4">المتطلبات التقنية واللوجستية</h3>
               
               <div className="space-y-4">
                  <label className="flex items-start gap-4 p-4 border border-surface-variant rounded-xl cursor-pointer hover:bg-surface-container-lowest transition-colors">
                    <input type="checkbox" name="reqLaptop" checked={formData.reqLaptop} onChange={handleChange} className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary" />
                    <div>
                      <div className="font-bold text-primary">جهاز حاسب آلي (Laptop)</div>
                      <div className="text-sm text-on-surface-variant">توفير جهاز آلي متصل بشاشة العرض.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 p-4 border border-surface-variant rounded-xl cursor-pointer hover:bg-surface-container-lowest transition-colors">
                    <input type="checkbox" name="reqVideoConf" checked={formData.reqVideoConf} onChange={handleChange} className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary" />
                    <div>
                      <div className="font-bold text-primary">نظام الـ Video Conference</div>
                      <div className="text-sm text-on-surface-variant">تجهيز كاميرات ومعدات البث للتحضير لاجتماع عن بعد.</div>
                    </div>
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-surface-variant rounded-xl transition-colors">
                    <label className="flex items-start gap-4 cursor-pointer flex-1">
                      <input type="checkbox" name="reqMic" checked={formData.reqMic} onChange={handleChange} className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary" />
                      <div>
                        <div className="font-bold text-primary">ميكروفونات متحركة</div>
                        <div className="text-sm text-on-surface-variant">توفير ميكروفونات لاسلكية للأسئلة أو الحوار.</div>
                      </div>
                    </label>
                    {formData.reqMic && (
                      <div className="flex items-center gap-2 animate-in fade-in">
                        <span className="text-sm font-bold text-on-surface-variant">العدد:</span>
                        <input name="reqMicQty" min="1" max="10" value={formData.reqMicQty} onChange={handleChange} type="number" className="w-20 rounded-lg border-surface-variant py-2 text-center" />
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-surface-container-high flex justify-between items-center">
            {step > 1 ? (
               <button onClick={handlePrev} className="px-6 py-2.5 rounded-xl border border-surface-variant text-on-surface font-bold hover:bg-surface-container-low transition-colors" type="button">
                 السابق
               </button>
            ) : <div></div>}
            
            {(step < 3 && !isEmployeeLecture) ? (
              <button 
                onClick={handleNext} 
                className="px-8 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-md flex items-center gap-2 disabled:opacity-50 disabled:scale-100" 
                type="button"
                // Combined validation for slots and lead-time
                disabled={(step === 1 && (!formData.roomId || !formData.date || !formData.timeFrom || isLeadTimeError))}
              >
                <span>التالي</span>
                <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
              </button>
            ) : (
              <button 
                onClick={handleSubmit} 
                className="px-8 py-2.5 bg-gradient-to-br from-secondary to-[#876a20] text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-md flex items-center gap-2 disabled:opacity-50 disabled:scale-100" 
                type="button"
                disabled={
                  isEmployeeLecture 
                    ? (!formData.roomId || !formData.date || !formData.timeFrom || isLeadTimeError)
                    : (!formData.respName || !formData.respJob || !formData.respMobile)
                }
              >
                <span>تأكيد وإرسال الطلب</span>
                <span className="material-symbols-outlined text-sm rtl:rotate-180">check_circle</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}