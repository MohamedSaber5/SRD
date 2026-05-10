import { useTranslation } from 'react-i18next';

export default function BookingStep2Responsible({ formData, handleChange }) {
  const { t } = useTranslation();
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
       <h3 className="text-xl font-headline font-bold text-[#001e40] dark:text-white mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">{t('booking.steps.responsible')}</h3>
       <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2 relative text-right">
          <label className="block font-bold text-sm text-[#5a7698] dark:text-slate-400">{t('booking.responsibleName')}</label>
          <input 
            name="respName" 
            value={formData.respName} 
            onChange={handleNameChange} 
            required 
            className="block w-full rounded-xl border-0 py-3 px-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-[#1e3a5f] text-right font-bold text-[#001e40] dark:text-slate-200" 
            type="text"
          />
          <p className="text-xs text-[#5a7698] dark:text-slate-500 mt-1">يجب أن يحتوي الاسم على حروف فقط</p>
        </div>
        <div className="space-y-2 relative text-right">
          <label className="block font-bold text-sm text-[#5a7698] dark:text-slate-400">{t('booking.responsibleJob')}</label>
          <input 
            name="respJob" 
            value={formData.respJob} 
            onChange={handleJobChange} 
            required 
            className="block w-full rounded-xl border-0 py-3 px-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-[#1e3a5f] text-right font-bold text-[#001e40] dark:text-slate-200" 
            type="text"
          />
          <p className="text-xs text-[#5a7698] dark:text-slate-500 mt-1">يجب أن تحتوي الوظيفة على أحرف (لا يمكن أن تكون أرقاماً فقط)</p>
        </div>
        <div className="space-y-2 relative text-right">
          <label className="block font-bold text-sm text-[#5a7698] dark:text-slate-400">{t('booking.responsibleMobile')}</label>
          <input 
            name="respMobile" 
            value={formData.respMobile} 
            onChange={handleMobileChange} 
            required 
            pattern="[0-9]*"
            maxLength="15"
            className="block w-full rounded-xl border-0 py-3 px-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-[#1e3a5f] text-right font-bold text-[#001e40] dark:text-slate-200" 
            type="tel" 
            dir="ltr"
          />
          <p className="text-xs text-[#5a7698] dark:text-slate-500 mt-1">يجب إدخال أرقام فقط</p>
        </div>
       </div>
    </div>
  );
}
