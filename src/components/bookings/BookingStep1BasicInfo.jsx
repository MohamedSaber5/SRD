import { getHourOptions } from '../../hooks/useBookingForm';

export default function BookingStep1BasicInfo({ 
  formData, 
  setFormData, 
  handleChange, 
  userRole, 
  rooms, 
  loadingRooms, 
  minDate, 
  isLeadTimeError, 
  currentSlots,
  isMultiPurpose 
}) {
  const hourOptions = getHourOptions();

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-xl font-headline font-bold text-primary mb-6 border-b border-surface-container-high pb-4">المعلومات الأساسية</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Room Type & Selection */}
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
                    hallCategory: 'lecture',
                    timeFrom: '',
                    timeTo: '',
                    selectedSlot: null
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
                  hallCategory: 'multi',
                  timeFrom: '',
                  timeTo: '',
                  selectedSlot: null
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
                      roomType: selectedRoom?.type || 'fixed',
                      hallCategory: selectedRoom?.type === 'multi' ? 'multi' : 'lecture',
                      timeFrom: '',
                      timeTo: '',
                      selectedSlot: null
                    }));
                }} 
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                disabled={loadingRooms}
                required
              >
                <option disabled value="">{loadingRooms ? 'جاري تحميل القاعات...' : 'يرجى اختيار قاعة...'}</option>
                
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

        {/* Date */}
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

        {/* Time Selection */}
        <div className="col-span-1 space-y-2">
          <label className="block text-sm font-label font-bold text-on-surface-variant">الفترة الزمنية المتاحة</label>
          
          {isMultiPurpose ? (
            <div className="flex gap-4">
              <div className="relative flex-1">
                 <select 
                   name="timeFrom"
                   className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                   value={formData.timeFrom}
                   onChange={handleChange}
                   required
                 >
                   <option value="">من الساعة...</option>
                   {hourOptions.map((opt, i) => i < hourOptions.length - 1 && (
                     <option key={`from-${opt.value}`} value={opt.value}>{opt.label}</option>
                   ))}
                 </select>
                 <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
              <div className="relative flex-1">
                 <select 
                   name="timeTo"
                   className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                   value={formData.timeTo}
                   onChange={handleChange}
                   required
                 >
                   <option value="">إلى الساعة...</option>
                   {hourOptions.map((opt, i) => i > 0 && (
                     <option 
                        key={`to-${opt.value}`} 
                        value={opt.value}
                        disabled={formData.timeFrom && parseInt(opt.value.split(':')[0]) <= parseInt(formData.timeFrom.split(':')[0])}
                     >
                        {opt.label}
                     </option>
                   ))}
                 </select>
                 <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <select 
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                value={formData.timeFrom ? currentSlots.findIndex(s => s.from === formData.timeFrom && s.to === formData.timeTo) : ""}
                onChange={(e) => {
                  if (e.target.value === "") {
                     setFormData(p => ({...p, selectedSlot: null, timeFrom: '', timeTo: ''}));
                     return;
                  }
                  const slot = currentSlots[e.target.value];
                  setFormData(p => ({
                    ...p,
                    selectedSlot: slot,
                    timeFrom: slot.from,
                    timeTo: slot.to
                  }));
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
          )}

          {isLeadTimeError && (
            <p className="text-xs text-error font-bold mt-1 px-1 flex items-center gap-1 animate-pulse">
              <span className="material-symbols-outlined text-sm">warning</span> 
              عفواً، يجب أن يكون الحجز قبل الموعد بـ {userRole === 'secretary' ? '48' : '24'} ساعة على الأقل.
            </p>
          )}
        </div>

        {/* Purpose */}
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
        
        {/* Extra options for secretary */}
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
  );
}
