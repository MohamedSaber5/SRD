export default function BookingStep2Responsible({ formData, handleChange }) {
  // Name validation wrapper to ensure no numbers are typed
  const handleNameChange = (e) => {
    const val = e.target.value;
    if (val === '' || !/[0-9]/.test(val)) {
      handleChange(e);
    }
  };

  // Mobile validation wrapper to ensure only numbers are typed
  const handleMobileChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^[0-9\b]+$/.test(val)) {
      handleChange(e);
    }
  };

  // Job validation wrapper to encourage letters
  const handleJobChange = (e) => {
    const val = e.target.value;
    handleChange(e);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
       <h3 className="text-xl font-headline font-bold text-primary mb-6 border-b border-surface-container-high pb-4">بيانات المسؤول عن الحدث</h3>
       <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2 relative text-right">
          <label className="block font-body text-sm font-medium text-on-surface-variant">الاسم</label>
          <input 
            name="respName" 
            value={formData.respName} 
            onChange={handleNameChange} 
            required 
            className="block w-full rounded-xl border-0 py-3 pl-4 pr-4 bg-surface-container-high focus:ring-2 focus:ring-primary text-right font-body" 
            type="text"
            placeholder="ادخل الاسم (نص فقط)"
          />
          <p className="text-xs text-on-surface-variant mt-1">يجب أن يحتوي الاسم على حروف فقط</p>
        </div>
        <div className="space-y-2 relative text-right">
          <label className="block font-body text-sm font-medium text-on-surface-variant">الوظيفة / الصفة الأكاديمية</label>
          <input 
            name="respJob" 
            value={formData.respJob} 
            onChange={handleJobChange} 
            required 
            className="block w-full rounded-xl border-0 py-3 pl-4 pr-4 bg-surface-container-high focus:ring-2 focus:ring-primary text-right font-body" 
            type="text"
          />
          <p className="text-xs text-on-surface-variant mt-1">يجب أن تحتوي الوظيفة على أحرف (لا يمكن أن تكون أرقاماً فقط)</p>
        </div>
        <div className="space-y-2 relative text-right">
          <label className="block font-body text-sm font-medium text-on-surface-variant">رقم الجوال (للتواصل السريع)</label>
          <input 
            name="respMobile" 
            value={formData.respMobile} 
            onChange={handleMobileChange} 
            required 
            pattern="[0-9]*"
            maxLength="15"
            className="block w-full rounded-xl border-0 py-3 pl-4 pr-4 bg-surface-container-high focus:ring-2 focus:ring-primary text-right font-body" 
            type="tel" 
            dir="ltr"
            placeholder="مثال: 0501234567"
          />
          <p className="text-xs text-on-surface-variant mt-1">يجب إدخال أرقام فقط</p>
        </div>
       </div>
    </div>
  );
}
