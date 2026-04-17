import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function BookingForm() {
  const { userRole, currentUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [minDate, setMinDate] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Form Data
  const [formData, setFormData] = useState({
    roomId: '',
    roomType: '', // 'fixed' or 'multi'
    date: '',
    timeFrom: '',
    timeTo: '',
    purpose: '',
    respName: currentUser?.displayName || '',
    respJob: '',
    respMobile: '',
    reqMic: false,
    reqMicQty: 1,
    reqLaptop: false,
    reqVideoConf: false
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const q = query(collection(db, 'rooms'), orderBy('id', 'asc'));
        const querySnapshot = await getDocs(q);
        const roomsData = querySnapshot.docs.map(doc => ({
          ...doc.data()
        }));
        setRooms(roomsData);
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
  }, [userRole]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase.js');

      await addDoc(collection(db, 'bookings'), {
        roomId: formData.roomId,
        roomType: formData.roomType,
        date: formData.date,
        timeFrom: formData.timeFrom,
        timeTo: formData.timeTo,
        purpose: formData.purpose,
        responsibleName: formData.respName,
        responsibleJob: formData.respJob,
        responsibleMobile: formData.respMobile,
        reqMic: formData.reqMic,
        reqMicQty: formData.reqMicQty,
        reqLaptop: formData.reqLaptop,
        reqVideoConf: formData.reqVideoConf,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'مستخدم',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      alert('تم إرسال الطلب بنجاح وهو الآن بانتظار الموافقة');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding document: ', error);
      alert('حدث خطأ أثناء إرسال الطلب');
    }
  };

  return (
    <>
      <div className="mb-10 flex flex-col justify-between items-start gap-2">
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2">طلب حجز قاعة جديدة</h2>
        <p className="text-on-surface-variant text-lg">يرجى إكمال تفاصيل الحجز، سيتم مراجعة الطلب بناءً على التوافر.</p>
        {(userRole === 'secretary' || userRole === 'employee') && (
           <p className="text-sm font-bold text-error bg-error-container/20 px-3 py-1 rounded-md mt-2">
            ملاحظة نظامية: {userRole === 'secretary' ? 'لا يمكن حجز موعد أقل من 48 ساعة ويُسمح فقط بالقاعات متعددة الأغراض.' : 'لا يمكن حجز موعد أقل من 24 ساعة من الآن.'}
           </p>
        )}
      </div>

      {/* Stepper UI */}
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

      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm relative overflow-hidden max-w-3xl mx-auto">
        <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary to-primary-container"></div>
        
        <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-headline font-bold text-primary mb-6 border-b border-surface-container-high pb-4">المعلومات الأساسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block text-sm font-label font-bold text-on-surface-variant">اختر نوع وتسمية القاعة</label>
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

                      {userRole !== 'secretary' && (
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

                <div className="col-span-1 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-label font-bold text-on-surface-variant">من</label>
                    <input name="timeFrom" value={formData.timeFrom} onChange={handleChange} required className="w-full bg-surface-container-high border-none rounded-xl px-2 py-3 text-on-surface focus:ring-2 focus:ring-primary cursor-pointer text-center" type="time"/>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-label font-bold text-on-surface-variant">إلى</label>
                    <input name="timeTo" value={formData.timeTo} onChange={handleChange} required className="w-full bg-surface-container-high border-none rounded-xl px-2 py-3 text-on-surface focus:ring-2 focus:ring-primary cursor-pointer text-center" type="time"/>
                  </div>
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
            
            {step < 3 ? (
              <button 
                onClick={handleNext} 
                className="px-8 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-md flex items-center gap-2" 
                type="button"
                // Basic validation block before proceeding
                disabled={step === 1 && (!formData.roomId || !formData.date || !formData.timeFrom || !formData.timeTo)}
              >
                <span>التالي</span>
                <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
              </button>
            ) : (
              <button 
                onClick={handleSubmit} 
                className="px-8 py-2.5 bg-gradient-to-br from-secondary to-[#876a20] text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-md flex items-center gap-2" 
                type="button"
                disabled={!formData.respName || !formData.respJob || !formData.respMobile}
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
